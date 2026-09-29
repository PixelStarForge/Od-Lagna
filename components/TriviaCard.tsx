"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TriviaEntry, getEntrySources } from "../lib/schema";
import { ArcMetadata, getArcMetadata } from "../lib/arc-utils";
import { usePreferences } from "../lib/preferences";
import { formatQnaDate, getEntryDate } from "../lib/date-utils";
import { BookmarkButton } from "./BookmarkButton";
import { useShareModal } from "../lib/share";

interface TriviaCardProps {
  entry: TriviaEntry;
  onTagClick?: (type: "character" | "topic", tag: string) => void;
  unmaskSpoiler?: boolean;
}

export function TriviaCard({ entry, onTagClick, unmaskSpoiler = false }: TriviaCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDetailPage =
    pathname === `/qna/${entry.id}` ||
    (pathname === "/qna" && searchParams.get("id") === entry.id);

  const { spoilerArc, isIfRouteAllowed, mounted } = usePreferences();
  const { openShareModal } = useShareModal();
  const [isCopied, setIsCopied] = useState(false);
  const [isManuallyRevealed, setIsManuallyRevealed] = useState(false);

  const rawDate = getEntryDate(entry);
  const dateFormatted = formatQnaDate(rawDate);

  const arcMeta: ArcMetadata = getArcMetadata(entry.arc);

  // Determine if this entry is gated by spoilers
  // Default to gated on SSR (before mounted) to strictly prevent any spoiler flash
  let isGated = true;

  if (mounted) {
    if (arcMeta.type === "general") {
      isGated = false;
    } else if (arcMeta.type === "canon" && arcMeta.order !== undefined) {
      isGated = arcMeta.order > spoilerArc;
    } else if (arcMeta.type === "if" || arcMeta.type === "side-story") {
      isGated = !isIfRouteAllowed(entry.arc);
    }
  }

  // If manually revealed or unmasked, override gate
  const isHidden = isGated && !isManuallyRevealed && !unmaskSpoiler;

  // Handle permalink copy
  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/qna?id=${entry.id}`;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Verification Badge markup
  const verificationBadge = entry.verified ? (
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

  // Statement Date Badge markup
  const dateBadge = dateFormatted ? (
    <span
      title={`Statement Date: ${rawDate}`}
      className="inline-flex items-center gap-1.5 font-mono text-xs px-2 sm:px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
    >
      <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>{dateFormatted}</span>
    </span>
  ) : null;

  // Arc Badge markup
  const arcBadge = (
    <>
      {arcMeta.type === "canon" && arcMeta.order && (
        <span className="font-mono font-medium px-2 sm:px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] truncate">
          Arc {arcMeta.order}: {arcMeta.name}
        </span>
      )}

      {arcMeta.type === "if" && (
        <span className="font-mono font-medium px-2 sm:px-2.5 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] truncate">
          {arcMeta.name}
          {arcMeta.divergesFrom && ` (Diverges ${arcMeta.divergesFrom.toUpperCase()})`}
        </span>
      )}

      {arcMeta.type === "side-story" && (
        <span className="font-mono font-medium px-2 sm:px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] truncate">
          {arcMeta.name}
          {arcMeta.timeline && ` · ${arcMeta.timeline}`}
        </span>
      )}

      {arcMeta.type === "general" && (
        <span className="font-mono font-medium px-2 sm:px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] shrink-0">
          General / Lore
        </span>
      )}
    </>
  );

  return (
    <article
      id={`trivia-${entry.id}`}
      className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 transition-all hover:border-[var(--border-strong)] shadow-xs space-y-4"
    >
      {/* Top Meta Bar */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 text-xs sm:text-sm">
        {/* Row 1 on mobile / Left group on desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
            {/* Trivia Type Badge */}
            <span className="font-mono text-[11px] sm:text-[12px] font-bold px-2 sm:px-2.5 py-0.5 rounded border border-[var(--accent-border)] text-[var(--accent)] tracking-wider shrink-0">
              TRIVIA
            </span>

            {/* Arc / Route Badge */}
            {arcBadge}

            {/* Desktop-only: Verification and Date Badges */}
            <div className="hidden sm:flex items-center gap-2">
              {verificationBadge}
              {dateBadge}
            </div>
          </div>

          {/* Mobile-only Top Right: Bookmark button */}
          <div className="sm:hidden shrink-0">
            <BookmarkButton id={entry.id} size="sm" />
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
            {/* Desktop Bookmark Button */}
            <div className="hidden sm:block">
              <BookmarkButton id={entry.id} size="sm" />
            </div>

            {!isDetailPage && (
              <Link
                href={`/qna?id=${entry.id}`}
                title="Open dedicated page for this trivia entry"
                className="text-xs font-semibold px-2 py-0.5 rounded border border-transparent hover:border-[var(--border-subtle)] bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-all inline-flex items-center gap-0.5 sm:gap-1"
              >
                <span>Full View</span>
                <span>→</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy direct permalink to this trivia"
              aria-label="Copy permalink"
              className="font-mono text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] px-1.5 sm:px-2 py-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>#{entry.id}</span>
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

      {/* Content Area — Either Gated Barrier OR Visible Trivia Statement */}
      {isHidden ? (
        <div className="p-4 sm:p-5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--accent-text)] flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Spoiler Barrier:{" "}
                {arcMeta.type === "if"
                  ? `${arcMeta.name} Alternate Timeline`
                  : `Beyond Arc ${spoilerArc} (${arcMeta.name})`}
              </span>
            </p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              The author statement and tags contain narrative revelations beyond your current story cutoff.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManuallyRevealed(true)}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
          >
            Reveal Spoiler
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {/* Optional Title */}
          {entry.title && (
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-base sm:text-lg text-[var(--text-main)] leading-snug">
                {entry.title}
              </h3>
            </div>
          )}

          {/* Author Statement */}
          <div className="space-y-1.5">
            <h4 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
              Trivia
            </h4>
            <div className="font-sans text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line">
              {entry.text}
            </div>
          </div>

          {/* Tags */}
          {(entry.characters.length > 0 || entry.topics.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {entry.characters.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() =>
                    onTagClick
                      ? onTagClick("character", char)
                      : router.push(`/browse?character=${encodeURIComponent(char)}`)
                  }
                  className="text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
                >
                  {char}
                </button>
              ))}

              {entry.topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() =>
                    onTagClick
                      ? onTagClick("topic", topic)
                      : router.push(`/browse?topic=${encodeURIComponent(topic)}`)
                  }
                  className="text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Bar: Source Citation & Actions (Share button on bottom-right) */}
          {(() => {
            const validSources = getEntrySources(entry).filter(
              (s) => s.value && s.value.trim().length > 0
            );

            return (
              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs sm:text-sm">
                {/* Left: Sources */}
                <div className="text-[var(--text-muted)] min-w-0 flex-1 space-y-1">
                  {validSources.length > 0 && (
                    <>
                      <span className="font-mono font-semibold block text-[var(--text-muted)]">
                        {validSources.length > 1 ? "Sources:" : "Source:"}
                      </span>
                      <div className="space-y-1">
                        {validSources.map((source, index) => (
                          <div key={index} className="flex items-baseline gap-1.5 min-w-0">
                            {validSources.length > 1 && (
                              <span className="text-[var(--border-subtle)] select-none mr-0.5">•</span>
                            )}
                            {source.type === "url" ? (
                              <a
                                href={source.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent)] hover:underline break-all font-medium inline items-baseline"
                              >
                                <span>{source.value}</span>
                                <span className="inline-block ml-0.5 text-[11px] align-baseline">↗</span>
                              </a>
                            ) : (
                              <span className="italic break-words">
                                {source.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                  {/* If entry was manually revealed while gated, offer to re-hide */}
                  {isGated && isManuallyRevealed && (
                    <button
                      type="button"
                      onClick={() => setIsManuallyRevealed(false)}
                      className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] underline cursor-pointer mr-1"
                    >
                      Hide spoiler
                    </button>
                  )}

                  {/* Share Button on bottom right */}
                  <button
                    type="button"
                    onClick={() => openShareModal(entry)}
                    title="Share or export Trivia (Image / Markdown)"
                    aria-label="Share statement"
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </article>
  );
}
