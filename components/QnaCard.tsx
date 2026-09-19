"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QnaEntry } from "../lib/schema";
import { ArcMetadata, getArcMetadata } from "../lib/arc-utils";
import { usePreferences } from "../lib/preferences";

interface QnaCardProps {
  entry: QnaEntry;
  onTagClick?: (type: "character" | "topic", tag: string) => void;
}

export function QnaCard({ entry, onTagClick }: QnaCardProps) {
  const router = useRouter();
  const { spoilerArc, spoilerIf, mounted } = usePreferences();
  const [isCopied, setIsCopied] = useState(false);
  const [isManuallyRevealed, setIsManuallyRevealed] = useState(false);

  const arcMeta: ArcMetadata = getArcMetadata(entry.arc);

  // Determine if this entry is gated by spoilers
  // Default to gated on SSR (before mounted) to strictly prevent any spoiler flash
  let isGated = true;

  if (mounted) {
    if (arcMeta.type === "general") {
      isGated = false;
    } else if (arcMeta.type === "canon" && arcMeta.order !== undefined) {
      isGated = arcMeta.order > spoilerArc;
    } else if (arcMeta.type === "if") {
      isGated = !spoilerIf;
    }
  }

  // If manually revealed, override gate
  const isHidden = isGated && !isManuallyRevealed;

  // Handle permalink copy
  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/browse#qna-${entry.id}`;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <article
      id={`qna-${entry.id}`}
      className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 transition-all hover:border-[var(--border-strong)] shadow-xs space-y-4"
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Arc / Route Badge */}
          {arcMeta.type === "canon" && arcMeta.order && (
            <span className="font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              Arc {arcMeta.order}: {arcMeta.name}
            </span>
          )}

          {arcMeta.type === "if" && (
            <span className="font-mono font-medium px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)]">
              {arcMeta.name}
              {arcMeta.divergesFrom && ` (Diverges ${arcMeta.divergesFrom.toUpperCase()})`}
            </span>
          )}

          {arcMeta.type === "general" && (
            <span className="font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-faint)]">
              General / Lore
            </span>
          )}

          {/* Verification Badge */}
          {entry.verified ? (
            <span
              title="Verified with primary source"
              className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-[var(--verified-bg)] text-[var(--verified-text)] border border-[var(--verified-border)] text-[11px]"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Verified</span>
            </span>
          ) : (
            <span
              title="Awaiting primary citation verification"
              className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-[var(--unverified-bg)] text-[var(--unverified-text)] border border-[var(--unverified-border)] text-[11px]"
            >
              <span className="font-bold text-[10px]">!</span>
              <span>Unverified</span>
            </span>
          )}
        </div>

        {/* Entry ID & Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/qna/${entry.id}`}
            title="Open dedicated page for this Q&A"
            className="text-[11px] text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors hidden sm:inline"
          >
            Full View →
          </Link>
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy direct permalink to this Q&A"
            aria-label="Copy permalink"
            className="font-mono text-xs text-[var(--text-faint)] hover:text-[var(--text-main)] px-1.5 py-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>#{entry.id}</span>
            {isCopied ? (
              <span className="text-[10px] text-[var(--verified-text)] font-sans">copied</span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content Area — Either Gated Barrier OR Visible Question + Answer */}
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
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              The question, author answer, and tags contain narrative revelations beyond your current story cutoff.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManuallyRevealed(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
          >
            Reveal Spoiler
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {/* Question */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Question
            </h3>
            <p className="font-sans font-semibold text-base sm:text-lg text-[var(--text-main)] leading-relaxed tracking-tight">
              {entry.question}
            </p>
          </div>

          {/* Author Answer */}
          <div className="space-y-1.5 pt-1">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Author Answer
            </h4>
            <div className="font-sans text-sm sm:text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line">
              {entry.answer}
            </div>
          </div>

          {/* Tags */}
          {(entry.characters.length > 0 || entry.topics.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {entry.characters.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() =>
                    onTagClick
                      ? onTagClick("character", char)
                      : router.push(`/browse?character=${encodeURIComponent(char)}`)
                  }
                  className="text-xs font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-faint)] transition-colors cursor-pointer"
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
                  className="text-xs font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-faint)] hover:text-[var(--text-main)] hover:border-[var(--text-faint)] transition-colors cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

          {/* Source Citation */}
          {entry.source && entry.source.value && (
            <div className="pt-2 text-xs text-[var(--text-faint)] flex items-center gap-1.5 border-t border-[var(--border-subtle)]">
              <span className="font-mono">Source:</span>
              {entry.source.type === "url" ? (
                <a
                  href={entry.source.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline truncate max-w-md inline-flex items-center gap-0.5"
                >
                  <span>{entry.source.value}</span>
                  <span>↗</span>
                </a>
              ) : (
                <span className="italic truncate">{entry.source.value}</span>
              )}
            </div>
          )}

          {/* If entry was manually revealed while gated, offer to re-hide */}
          {isGated && isManuallyRevealed && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsManuallyRevealed(false)}
                className="text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] underline cursor-pointer"
              >
                Hide question &amp; spoiler again
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
