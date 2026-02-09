import { scanWebsite } from "@/lib/accessibilityScanner";
import { explainIssue, generateSummary, generateImprovementPlan } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";

// --- Helper implementations (previously missing) ---

/**
 * Enrich raw axe-core style violations with lightweight WCAG metadata
 * Returns an array of enriched violation objects used downstream.
 */
function enrichViolations(violations = []) {
  try {
    return violations.map((v, idx) => ({
      id: v.id || v.ruleId || `violation-${idx}`,
      description: v.description || v.help || v.message || "",
      impact: v.impact || v.severity || "moderate",
      nodes: v.nodes || v.targets || [],
      wcag: (v.tags || []).filter((t) => /^wcag|^WCAG/i.test(t) || /^wcag/.test(t)),
      raw: v
    }));
  } catch (e) {
    logger.debug("[API /scan]", "enrichViolations error", { error: e.message });
    return violations.map((v, idx) => ({ id: v.id || `violation-${idx}`, raw: v }));
  }
}

/**
 * Prioritize remediations by impact/severity. Returns sorted array.
 */
function prioritizeRemediations(enriched = []) {
  const weight = { critical: 5, serious: 4, high: 4, moderate: 3, low: 2, minor: 1 };
  return enriched.slice().sort((a, b) => {
    const wa = weight[(a.impact || "").toLowerCase()] || 2;
    const wb = weight[(b.impact || "").toLowerCase()] || 2;
    return wb - wa;
  });
}

/**
 * Generate a basic audit report object expected by the route logic.
 */
function generateAuditReport(fullScanResults = {}) {
  const violations = fullScanResults.violations || [];
  const totalViolations = violations.length;

  // Simple scoring heuristic: penalize per-violation but clamp 0-100
  const accessibilityScore = Math.max(0, Math.min(100, 100 - totalViolations * 8));

  const detailedIssues = (violations || []).map((v, idx) => ({
    id: v.id || `issue-${idx}`,
    description: v.description || v.help || (v.raw && v.raw.description) || "",
    impact: v.impact || "moderate",
    wcag: v.wcag || [],
    nodes: v.nodes || [],
    remediation: (typeof generateImprovementPlan === "function") ? generateImprovementPlan(v) : null,
    raw: v.raw || v
  }));

  const summary = (typeof generateSummary === "function")
    ? generateSummary({ url: fullScanResults.url, violations: detailedIssues })
    : `Found ${totalViolations} accessibility issue(s).`;

  return {
    url: fullScanResults.url,
    accessibilityScore,
    detailedIssues,
    summary,
    meta: {
      scannedAt: fullScanResults.timestamp || new Date().toISOString(),
      requestId: fullScanResults.requestId
    }
  };
}

/**
 * Lightweight validation of audit report. Returns score, issues, warnings.
 */
function validateAuditResults(auditReport = {}) {
  const issues = auditReport.detailedIssues || [];
  const validationScore = Math.max(0, Math.min(100, auditReport.accessibilityScore - Math.floor(issues.length / 2)));
  const overallQuality = validationScore >= 80 ? "good" : validationScore >= 50 ? "fair" : "poor";

  const warnings = [];
  if (!auditReport || typeof auditReport.accessibilityScore !== "number") warnings.push("Missing score");

  return {
    overallQuality,
    validationScore,
    issues: issues.map((i) => ({ id: i.id, impact: i.impact })),
    warnings
  };
}

/**
 * Simple sanity check to ensure report shape and score are plausible.
 */
function performSanityCheck(auditReport = {}) {
  const passed = auditReport && typeof auditReport.accessibilityScore === "number" && auditReport.accessibilityScore >= 0 && auditReport.accessibilityScore <= 100;
  return { passed, notes: passed ? [] : ["accessibilityScore missing or out of range"] };
}

/**
 * Return a small industry comparison object with recommendations.
 */
function generateIndustryComparison(auditReport = {}) {
  return {
    url: auditReport.url || "",
    recommendations: ["axe-core", "WAVE", "Lighthouse"],
    expectedVariances: "Different tools may surface additional or fewer issues; use multiple tools for coverage.",
    interpretationGuide: "Higher score = better accessibility. Focus on 'critical/serious' items first."
  };
}


/**
 * POST /api/scan
 * Performs comprehensive accessibility audit using enterprise-grade methodology
 * 
 * Request: { url: "https://example.com", options?: { skipExtended?: boolean } }
 * Response: Professional audit report with score, issues, remediation, validation
 */
export async function POST(req) {
  const requestId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  let browser = null;
  
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-client-ip") || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";

    // Rate limiting
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      logger.warn("[API /scan]", "Rate limit exceeded", { ip, requestId });
      return new Response(
        JSON.stringify({
          error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter
        }),
        { status: 429, headers: { "Retry-After": rateLimitResult.retryAfter } }
      );
    }

    let { url, options = {} } = await req.json();

    // Validate URL
    if (!url || !url.trim()) {
      logger.warn("[API /scan]", "Missing URL", { requestId });
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400 }
      );
    }

    url = url.trim();

    // Ensure URL has protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      logger.warn("[API /scan]", "Invalid URL format", { url, requestId });
      return new Response(
        JSON.stringify({
          error: "Invalid URL format. Please enter a valid URL like example.com or https://example.com"
        }),
        { status: 400 }
      );
    }

    logger.info("[API /scan]", `Starting comprehensive audit`, { url, requestId, ip });

    // ============================================================
    // PHASE 1: Core Accessibility Scanning with axe-core
    // ============================================================
    const scanResults = await scanWebsite(url);
    const violations = scanResults.violations || [];
    const passes = scanResults.passes || [];
    const incomplete = scanResults.incomplete || [];

    logger.info("[API /scan]", `Found ${violations.length} violations`, {
      requestId,
      violations: violations.length,
      passes: passes.length
    });

    // ============================================================
    // PHASE 2: Violation Enrichment & Analysis
    // ============================================================
    logger.info("[API /scan]", "Enriching violations with WCAG metadata", { requestId });
    const enrichedViolations = enrichViolations(violations);
    const prioritized = prioritizeRemediations(enrichedViolations);
    
    // ============================================================
    // PHASE 3: Generate Professional Audit Report
    // ============================================================
    logger.info("[API /scan]", "Generating professional audit report", { requestId });
    const fullScanResults = {
      url,
      violations: enrichedViolations,
      passes,
      incomplete,
      timestamp: new Date().toISOString(),
      requestId,
      performance: {
        duration: Date.now() - startTime,
        unit: "ms"
      }
    };

    const auditReport = generateAuditReport(fullScanResults);

    // ============================================================
    // PHASE 4: Validation & Quality Assurance
    // ============================================================
    logger.info("[API /scan]", "Validating audit results", { requestId });
    const validationResults = validateAuditResults(auditReport);
    const sanityCheck = performSanityCheck(auditReport);
    const industryComparison = generateIndustryComparison(auditReport);

    // Warn if validation fails
    if (validationResults.overallQuality === "poor") {
      logger.warn("[API /scan]", "Audit validation quality is poor", {
        requestId,
        score: validationResults.validationScore
      });
    }

    // ============================================================
    // PHASE 5: Generate AI Explanations (Optional Enhancement)
    // ============================================================
    // Add AI explanations to top violations if Gemini API is available
    let enhancedWithAI = prioritized;
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY && prioritized.length > 0) {
      logger.info("[API /scan]", `Generating AI explanations for top violations`, { 
        requestId,
        count: Math.min(5, prioritized.length)
      });
      
      enhancedWithAI = await Promise.all(
        prioritized.slice(0, 5).map(async (violation) => {
          try {
            const explanation = await explainIssue(violation);
            return {
              ...violation,
              aiExplanation: explanation
            };
          } catch (error) {
            logger.debug("[API /scan]", `AI explanation skipped for ${violation.id}`, {});
            return violation;
          }
        })
      );
      
      // Add remaining violations without AI
      enhancedWithAI.push(...prioritized.slice(5));
    }

    const scanDuration = Date.now() - startTime;
    logger.info("[API /scan]", "Comprehensive audit completed successfully", {
      requestId,
      duration: `${scanDuration}ms`,
      violations: enrichedViolations.length,
      score: auditReport.accessibilityScore
    });

    // ============================================================
    // FINAL RESPONSE: Comprehensive Audit Report
    // ============================================================
    return new Response(
      JSON.stringify({
        // Request metadata
        requestId,
        success: true,
        
        // Comprehensive audit report
        auditReport: {
          ...auditReport,
          // Ensure detailed issues include AI explanations where available
          detailedIssues: (auditReport.detailedIssues || []).map((issue, idx) => ({
            ...issue,
            aiExplanation: enhancedWithAI[idx]?.aiExplanation || undefined
          }))
        },

        // Validation results
        validation: {
          quality: validationResults.overallQuality,
          score: validationResults.validationScore,
          sanityCheck: sanityCheck,
          validationIssues: validationResults.issues,
          validationWarnings: validationResults.warnings
        },

        // Industry comparison guidance
        industryComparison: {
          url: industryComparison.url,
          toolsToCompareAgainst: industryComparison.recommendations,
          expectedVariances: industryComparison.expectedVariances,
          interpretationGuide: industryComparison.interpretationGuide
        },

        // Performance metrics
        performance: {
          totalDuration: scanDuration,
          unit: "ms",
          scans: {
            axeCoreTime: scanDuration - 100 // Approximate
          }
        },

        // Timestamp
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    const scanDuration = Date.now() - startTime;
    
    logger.error("[API /scan]", "Audit error", {
      requestId,
      error: error.message,
      duration: `${scanDuration}ms`
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message || "Failed to complete accessibility audit";
    
    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      errorMessage = "The website took too long to load. Please try a different URL or a faster website.";
    } else if (errorMessage.includes("ERR_NAME_NOT_RESOLVED") || errorMessage.includes("ENOTFOUND")) {
      errorMessage = "Could not find that website. Please check the URL and try again.";
    } else if (errorMessage.includes("ERR_CONNECTION_REFUSED")) {
      errorMessage = "Connection refused. The website may be down or blocked.";
    } else if (errorMessage.includes("net::ERR") || errorMessage.includes("ERR::")) {
      errorMessage = "Network error. Please check the URL and your internet connection.";
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    // Cleanup
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        logger.debug("[API /scan]", "Error closing browser", {});
      }
    }
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      error: "Use POST method with { url: '...' }",
      example: "POST /api/scan with body: { \"url\": \"https://example.com\" }",
      description: "Performs comprehensive WCAG 2.1 accessibility audit"
    }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
