"use client";

import React, { useEffect, useRef } from "react";
import { usePreferences, ThemeMode } from "../lib/preferences";
import { SpoilerControls } from "./SpoilerControls";

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, theme, setTheme } = usePreferences();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          setIsSettingsOpen(false);
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-7 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 sm:zoom-in-95 min-w-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 id="settings-heading" className="text-lg font-bold text-[var(--text-main)]">
              Preferences & Settings
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Customize spoiler gating and display appearance. Changes apply instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close settings dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Section 1: Spoiler Protection */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
              Spoiler Protection
            </h3>
          </div>
          <SpoilerControls idPrefix="settings" />
        </section>

        {/* Section 2: Appearance & Theme */}
        <section className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
              Appearance
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center capitalize cursor-pointer transition-colors ${
                  theme === mode
                    ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {mode === "system" ? "System Auto" : mode}
              </button>
            ))}
          </div>
        </section>

        {/* Footer actions */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 cursor-pointer transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
