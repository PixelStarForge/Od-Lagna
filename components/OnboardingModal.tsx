"use client";

import React, { useEffect, useRef } from "react";
import { usePreferences } from "../lib/preferences";
import { SpoilerControls } from "./SpoilerControls";

export function OnboardingModal() {
  const { mounted, onboardingSeen, setOnboardingSeen } = usePreferences();
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll while onboarding is visible
  useEffect(() => {
    if (!mounted || onboardingSeen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mounted, onboardingSeen]);

  // Handle Escape key to dismiss
  useEffect(() => {
    if (!mounted || onboardingSeen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOnboardingSeen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onboardingSeen, setOnboardingSeen]);

  // Guard: client-side only, and only show if onboardingSeen is false
  if (!mounted || onboardingSeen) {
    return null;
  }

  const handleDismiss = () => {
    setOnboardingSeen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg my-auto bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] animate-in fade-in zoom-in-95"
      >
        {/* Header (pinned/fixed) */}
        <div className="shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Spoiler Protection Active</span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close spoiler setup"
              className="p-1.5 -mr-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Welcome to Od-Lagna
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            This archive indexes author Q&amp;As across the entire Re:Zero storyline. To protect your reading experience,
            spoilers are filtered by default. Select your current story progress below:
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          <SpoilerControls compact idPrefix="onboarding" />
        </div>

        {/* Action Footer (pinned/fixed) */}
        <div className="shrink-0 p-4 sm:px-6 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
            You can change this anytime via the Settings icon in the header.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer transition-colors shadow-sm shrink-0"
          >
            Confirm &amp; Enter Archive
          </button>
        </div>
      </div>
    </div>
  );
}
