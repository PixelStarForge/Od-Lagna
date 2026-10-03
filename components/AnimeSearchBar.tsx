"use client";

import React from "react";

interface AnimeSearchBarProps {
  placeholder?: string;
  onClick: () => void;
  className?: string;
  badgeText?: string;
}

export function AnimeSearchBar({
  placeholder = "Search anime live-tweets, characters, and lore...",
  onClick,
  className = "",
  badgeText,
}: AnimeSearchBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-2xs text-left ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-xs sm:text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors truncate">
          {placeholder}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badgeText && (
          <span className="hidden sm:inline-block font-mono text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
            {badgeText}
          </span>
        )}
        <kbd
          title="Press ? or Shift + / to search"
          className="font-mono text-xs px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--text-main)] group-hover:border-[var(--accent-border)] font-semibold transition-colors"
        >
          ?
        </kbd>
      </div>
    </button>
  );
}
