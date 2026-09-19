"use client";

import React from "react";
import { usePreferences } from "../lib/preferences";
import { SpoilerControls } from "./SpoilerControls";

export function OnboardingModal() {
  const { mounted, onboardingSeen, setOnboardingSeen } = usePreferences();

  // Guard: client-side only, and only show if onboardingSeen is false
  if (!mounted || onboardingSeen) {
    return null;
  }

  const handleDismiss = () => {
    setOnboardingSeen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-none transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Spoiler Protection Active</span>
          </div>
          <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Welcome to Od-Lagna
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            This archive indexes author Q&amp;As across the entire Re:Zero storyline. To protect your reading experience,
            spoilers are filtered by default. Select your current story progress below:
          </p>
        </div>

        {/* Embedded Spoiler Controls */}
        <div className="py-2">
          <SpoilerControls />
        </div>

        {/* Action button */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-faint)]">
            You can change this anytime via the Settings icon in the header.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer transition-colors shadow-sm"
          >
            Confirm &amp; Enter Archive
          </button>
        </div>
      </div>
    </div>
  );
}
