"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TwitterShortStory } from "../lib/schema";
import { formatQnaDate } from "../lib/date-utils";
import { BookmarkButton } from "./BookmarkButton";
import { useShareModal } from "../lib/share";

interface TwitterShortStoryCardProps {
  story: TwitterShortStory;
  selectedCharacters?: string[];
  onTagClick?: ((type: "character", tag: string) => void) | ((character: string) => void);
  isHighlighted?: boolean;
  isDetailPage?: boolean;
}

export function TwitterShortStoryCard({
  story,
  selectedCharacters = [],
  onTagClick,
  isHighlighted = false,
  isDetailPage = false,
}: TwitterShortStoryCardProps) {
  const router = useRouter();
  const { openShareModal } = useShareModal();
  const [isCopied, setIsCopied] = useState(false);

  const dateFormatted = formatQnaDate(story.date);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/twitter-short-stories?id=${story.id}`;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const verificationBadge = story.verified ? (
    <span
      title="Verified with primary source"
      className="inline-flex items-center gap-1 font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-[var(--verified-bg)] text-[var(--verified-text)] border border-[var(--verified-border)] text-xs"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span>Verified</span>
    </span>
  ) : (
    <span
      title="Awaiting primary citation verification"
      className="inline-flex items-center gap-1 font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-[var(--unverified-bg)] text-[var(--unverified-text)] border border-[var(--unverified-border)] text-xs"
    >
      <span className="font-bold text-xs">!</span>
      <span>Unverified</span>
    </span>
  );

  const dateBadge = dateFormatted ? (
    <span
      title={`Published Date: ${story.date}`}
      className="inline-flex items-center gap-1.5 font-mono text-xs px-2 sm:px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
    >
      <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>{dateFormatted}</span>
    </span>
  ) : null;

  return (
    <article
      id={`story-${story.id}`}
      className={`group relative rounded-xl border ${
        isHighlighted
          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
          : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
      } bg-[var(--bg-surface)] p-5 sm:p-6 transition-all shadow-xs space-y-4`}
    >
      {/* Top Meta Bar */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 text-xs sm:text-sm">
        {/* Row 1 on mobile / Left group on desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
            {/* Type Badge */}
            <span className="font-mono text-[11px] sm:text-[12px] font-bold px-2 sm:px-2.5 py-0.5 rounded border border-[var(--accent-border)] text-[var(--accent)] tracking-wider shrink-0">
              TWITTER SHORT STORY
            </span>

            {/* Desktop-only: Verification and Date Badges */}
            <div className="hidden sm:flex items-center gap-2">
              {verificationBadge}
              {dateBadge}
            </div>
          </div>

          {/* Mobile-only Top Right: Bookmark button */}
          <div className="sm:hidden shrink-0">
            <BookmarkButton id={story.id} size="sm" />
          </div>
        </div>

        {/* Row 2 on mobile / Right group on desktop */}
        <div className="flex items-center justify-between gap-2 pt-0.5 sm:pt-0">
          {/* Mobile-only Left: Verification and Date Badges */}
          <div className="flex sm:hidden items-center gap-1.5 flex-wrap">
            {verificationBadge}
            {dateBadge}
          </div>

          {/* Actions & Permalink */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto sm:ml-0">
            <div className="hidden sm:block">
              <BookmarkButton id={story.id} size="sm" />
            </div>

            {!isDetailPage && (
              <Link
                href={`/twitter-short-stories?id=${story.id}`}
                title="Open dedicated page for this short story"
                className="text-xs font-semibold px-2 py-0.5 rounded border border-transparent hover:border-[var(--border-subtle)] bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-all inline-flex items-center gap-0.5 sm:gap-1"
              >
                <span>Full View</span>
                <span>→</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy direct permalink to this short story"
              aria-label="Copy permalink"
              className="font-mono text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] px-1.5 sm:px-2 py-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>#{story.id}</span>
              {isCopied ? (
                <span className="text-xs text-[var(--verified-text)] font-sans font-semibold">copied</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Optional Title */}
      {story.title && (
        <h3 className="font-sans font-bold text-lg sm:text-xl text-[var(--text-main)] leading-snug">
          {isDetailPage ? (
            story.title
          ) : (
            <Link
              href={`/twitter-short-stories?id=${story.id}`}
              className="hover:text-[var(--accent)] transition-colors"
            >
              {story.title}
            </Link>
          )}
        </h3>
      )}

      {/* Story Content */}
      {isDetailPage ? (
        <div className="font-sans text-sm sm:text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line bg-[var(--bg-elevated)]/30 p-4 sm:p-5 rounded-lg border border-[var(--border-subtle)]/60">
          {story.story}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="font-sans text-sm sm:text-base text-[var(--text-main)] leading-relaxed bg-[var(--bg-elevated)]/20 p-4 rounded-lg border border-[var(--border-subtle)]/40">
            <p className="line-clamp-4 whitespace-pre-line text-[var(--text-muted)]">
              {story.story}
            </p>
          </div>
          <div>
            <Link
              href={`/twitter-short-stories?id=${story.id}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline cursor-pointer"
            >
              <span>Read Full Story</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tags (Characters) */}
      {story.characters.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {story.characters.map((char) => {
            const isSelected = selectedCharacters.includes(char);
            return (
              <button
                key={char}
                type="button"
                onClick={() => {
                  if (onTagClick) {
                    if (onTagClick.length > 1) {
                      (onTagClick as (type: "character", tag: string) => void)("character", char);
                    } else {
                      (onTagClick as (character: string) => void)(char);
                    }
                  } else {
                    router.push(`/twitter-short-stories?character=${encodeURIComponent(char)}`);
                  }
                }}
                title={isSelected ? `Remove filter for ${char}` : `Filter by ${char}`}
                className={`text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--accent)] text-white border-[var(--accent)] font-semibold"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:border-[var(--text-muted)]"
                }`}
              >
                {char}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Bar: Source Citation & Actions (Share button on bottom-right) */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs sm:text-sm">
        {/* Left: Sources */}
        {(() => {
          const storyUrls = story.urls && story.urls.length > 0 ? story.urls : [story.url];
          return (
            <div className="text-[var(--text-muted)] min-w-0 flex-1 space-y-1">
              <span className="font-mono font-semibold block text-[var(--text-muted)]">
                {storyUrls.length > 1 ? "Sources:" : "Source:"}
              </span>
              <div className="space-y-1">
                {storyUrls.map((u, index) => (
                  <div key={index} className="flex items-baseline gap-1.5 min-w-0">
                    {storyUrls.length > 1 && (
                      <span className="text-[var(--border-subtle)] select-none mr-0.5">•</span>
                    )}
                    <a
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline break-all font-medium inline items-baseline"
                    >
                      <span>{u}</span>
                      <span className="inline-block ml-0.5 text-[11px] align-baseline">↗</span>
                    </a>
                  </div>
                ))}
                {story.translationSource?.name && (
                  <div className="text-xs text-[var(--text-muted)] italic">
                    Translation: {story.translationSource.name}
                    {story.translationSource.url && (
                      <>
                        {" "}
                        (
                        <a
                          href={story.translationSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          link
                        </a>
                        )
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
          {/* Share Button on bottom right */}
          <button
            type="button"
            onClick={() => openShareModal(story)}
            title="Share or export short story (Image / Markdown)"
            aria-label="Share short story"
            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </article>
  );
}
