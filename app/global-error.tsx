"use client";

import React from "react";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2a1215] border border-[#451a1d] text-[#ef4444]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Critical System Error
            </h1>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              A critical failure occurred while loading the application shell.
            </p>
          </div>

          {error.message && (
            <div className="p-3 text-left rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#f87171] break-words">
              {error.message}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors cursor-pointer"
            >
              Reset Corridor
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold rounded-lg border border-[#3f3f46] bg-[#18181b] hover:bg-[#27272a] text-white transition-colors cursor-pointer text-decoration-none"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
