"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-rose"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-text-muted max-w-md">
          An error occurred while loading the dashboard. This may be a temporary
          issue.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
