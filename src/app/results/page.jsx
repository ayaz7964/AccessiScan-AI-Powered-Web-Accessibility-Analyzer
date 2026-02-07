import { Suspense } from "react";
import { ResultsContent } from "./ResultsContent";

/**
 * Results page metadata
 */
export const metadata = {
  title: "Scan Results - AllyCheck",
  description: "View your accessibility scan results with detailed fixes and AI-powered recommendations",
  robots: "noindex, nofollow" // Results are user-specific, don't index
};

/**
 * Loading fallback component
 */
export function ResultsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading results...</p>
      </div>
    </div>
  );
}

/**
 * Results page - wrapped with Suspense for useSearchParams
 */
export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsContent />
    </Suspense>
  );
}
