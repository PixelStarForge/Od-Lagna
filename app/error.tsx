"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime error to console
    console.error("Od-Lagna uncaught application error:", error);
  }, [error]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent)] shadow-xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            <span>Runtime Error</span>
            <span>•</span>
            <span>Timeline Desynchronization</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            An Unexpected Error Occurred
          </h1>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
            An issue prevented this view from rendering cleanly. You can attempt to re-sync the corridor or return to the main archive.
          </p>
        </div>

        {/* Technical Error Box (if message exists) */}
        {error.message && (
          <div className="text-left p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Diagnostic Details
            </p>
            <p className="font-mono text-xs text-[var(--accent)] break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-[var(--text-muted)]">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer shadow-xs"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Reload Page
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
