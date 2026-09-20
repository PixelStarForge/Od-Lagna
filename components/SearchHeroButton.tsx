"use client";

import React from "react";
import { usePreferences } from "../lib/preferences";

export function SearchHeroButton() {
  const { setIsSearchOpen } = usePreferences();

  return (
    <button
      type="button"
      onClick={() => setIsSearchOpen(true)}
      className="px-5 py-3 rounded-lg text-sm font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
    >
      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Open Search</span>
      <kbd className="font-mono text-xs px-1.5 py-0.5 border rounded border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] font-semibold">
        /
      </kbd>
    </button>
  );
}
