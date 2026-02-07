"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * Professional Progress Circle Component
 */
const ProgressCircle = ({
  percentage = 0,
  size = 200,
  strokeWidth = 16,
  color = "#3b82f6"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-800"
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [val, setVal] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [results, setResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanStatus, setScanStatus] = useState("");

  const handleStartScan = async () => {
    if (!url || !url.trim()) {
      setError("Enter a URL to scan");
      return;
    }

    let validUrl = url.trim();

    // Validate and fix URL format
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
      validUrl = "https://" + validUrl;
    }

    // Basic URL pattern validation
    const urlPattern = /^https?:\/\/.+\..+/;
    if (!urlPattern.test(validUrl)) {
      setError("Invalid URL format");
      return;
    }

    setIsScanning(true);
    setError(null);
    setVal(0);
    setOpen(true);
    setResults(null);
    setScanStatus("Initializing scan...");

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setVal((prev) => Math.min(prev + Math.random() * 25, 90));
      }, 600);

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: validUrl })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Scan failed");
      }

      const resultsData = await response.json();
      setVal(100);
      setScanStatus("Processing results...");
      
      // Store results in localStorage
      localStorage.setItem("scanResults", JSON.stringify(resultsData));
      
      // Redirect to results page
      setTimeout(() => {
        router.push("/results");
      }, 1000);
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.message);
      setVal(0);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 text-blue-600 dark:text-blue-400">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AllyCheck</h1>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Website Accessibility Checker
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Empower your development team to build inclusive digital experiences. Enter a URL to run a deep, automated audit against international accessibility standards.
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-800"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={url}
              placeholder="https://www.example.com"
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
              onKeyPress={(e) => e.key === "Enter" && handleStartScan()}
            />
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900 disabled:shadow-none flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>🔍</span>
              {isScanning ? "Scanning..." : "Start Test"}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                ⚠️ {error}
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">WCAG 2.1 Compliance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎨</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Color Contrast</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⌨️</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Keyboard Navigation</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">PDF Reports</p>
            </div>
          </div>
        </motion.div>

        {/* Scan Modal */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex justify-center mb-6">
                <ProgressCircle percentage={val} size={180} color="#3b82f6" />
              </div>

              {error ? (
                <>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 text-center">
                    ❌ Scan Failed
                  </p>
                  <p className="text-center text-gray-600 dark:text-gray-300 text-sm mb-6">
                    {error}
                  </p>
                </>
              ) : val === 100 ? (
                <>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 mb-2 text-center">
                    ✓ Scan Complete
                  </p>
                  <p className="text-center text-gray-600 dark:text-gray-300 text-sm mb-6">
                    Redirecting to results...
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                    Analyzing Accessibility
                  </p>
                  <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {scanStatus}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                    <motion.div
                      className="bg-blue-600 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Evaluating page structure, interactive elements, and color palettes against WCAG 2.1 AA guidelines.
                  </p>
                </>
              )}

              {!isScanning && (
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setVal(0);
                      setError(null);
                      setScanStatus("");
                    }}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}