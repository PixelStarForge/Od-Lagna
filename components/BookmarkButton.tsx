"use client";

import React from "react";
import { useBookmarks } from "../lib/bookmarks";

export interface BookmarkButtonProps {
  id: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  id,
  size = "md",
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, mounted } = useBookmarks();
  const bookmarked = mounted ? isBookmarked(id) : false;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(id);
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={bookmarked ? `Remove #${id} from saved bookmarks` : `Save #${id} to bookmarks`}
      aria-pressed={bookmarked}
      title={bookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
      className={`group relative inline-flex items-center justify-center gap-1.5 rounded-lg border transition-all duration-150 cursor-pointer active:scale-92 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
        isSmall
          ? "px-1.5 py-1 text-xs"
          : "px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm"
      } ${
        bookmarked
          ? "bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent)] hover:bg-[var(--accent-border)]"
          : "bg-transparent border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
      } ${className}`}
    >
      <svg
        className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} shrink-0 transition-transform group-hover:scale-110`}
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={bookmarked ? 2 : 1.75}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {showLabel && (
        <span className="font-medium text-xs">
          {bookmarked ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
