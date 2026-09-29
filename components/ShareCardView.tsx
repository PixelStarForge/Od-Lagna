"use client";

import React, { forwardRef } from "react";
import { QnaEntry, TriviaEntry, getEntrySources } from "../lib/schema";
import { getArcMetadata } from "../lib/arc-utils";
import { formatQnaDate, getEntryDate } from "../lib/date-utils";
import { isQnaEntry } from "../lib/share-utils";

interface ShareCardViewProps {
  entry: QnaEntry | TriviaEntry;
}

export const ShareCardView = forwardRef<HTMLDivElement, ShareCardViewProps>(
  function ShareCardView({ entry }, ref) {
    const isQna = isQnaEntry(entry);
    const arcMeta = getArcMetadata(entry.arc);
    const dateFormatted = formatQnaDate(getEntryDate(entry));
    const sources = getEntrySources(entry).filter(
      (s) => s.value && s.value.trim().length > 0
    );

    const arcBadge = (
      <>
        {arcMeta.type === "canon" && arcMeta.order && (
          <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] shrink-0">
            Arc {arcMeta.order}: {arcMeta.name}
          </span>
        )}
        {arcMeta.type === "if" && (
          <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] shrink-0">
            {arcMeta.name}
            {arcMeta.divergesFrom && ` (Diverges ${arcMeta.divergesFrom.toUpperCase()})`}
          </span>
        )}
        {arcMeta.type === "side-story" && (
          <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] shrink-0">
            {arcMeta.name}
            {arcMeta.timeline && ` · ${arcMeta.timeline}`}
          </span>
        )}
        {arcMeta.type === "general" && (
          <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] shrink-0">
            General / Lore
          </span>
        )}
      </>
    );

    return (
      <div
        ref={ref}
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-4 text-left select-none"
        style={{
          boxSizing: "border-box",
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-main)",
        }}
      >
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-3 text-xs border-b border-[var(--border-subtle)] pb-3.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Type Badge */}
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-[var(--accent-border)] text-[var(--accent)] tracking-wider shrink-0">
              {isQna ? "Q&A" : "TRIVIA"}
            </span>

            {/* Arc Badge */}
            {arcBadge}

            {/* Verification Badge */}
            {entry.verified ? (
              <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full bg-[var(--verified-bg)] text-[var(--verified-text)] border border-[var(--verified-border)] text-xs shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Verified</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full bg-[var(--unverified-bg)] text-[var(--unverified-text)] border border-[var(--unverified-border)] text-xs shrink-0">
                <span className="font-bold text-xs">!</span>
                <span>Unverified</span>
              </span>
            )}

            {/* Date Badge */}
            {dateFormatted && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] shrink-0">
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{dateFormatted}</span>
              </span>
            )}
          </div>

          {/* Watermark Attribution */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)] shrink-0 ml-auto self-start sm:self-center">
            <span className="font-sans font-bold text-[var(--accent)] tracking-tight">OD-LAGNA</span>
            <span>•</span>
            <span className="font-semibold text-[var(--text-main)]">#{entry.id}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {isQna ? (
            <>
              {/* Question */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                  Question
                </h3>
                <p className="font-sans font-semibold text-base sm:text-lg text-[var(--text-main)] leading-relaxed tracking-tight">
                  {entry.question}
                </p>
              </div>

              {/* Answer */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                  Answer
                </h4>
                <div className="font-sans text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                  {entry.answer}
                </div>
              </div>
            </>
          ) : (
            <>
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
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                  Trivia
                </h4>
                <div className="font-sans text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                  {entry.text}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {(entry.characters.length > 0 || entry.topics.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {entry.characters.map((char) => (
                <span
                  key={char}
                  className="text-xs font-medium font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)]"
                >
                  {char}
                </span>
              ))}

              {entry.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs font-medium font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Source Citation & Watermark Footer */}
          <div className="pt-3 text-xs text-[var(--text-muted)] flex items-end justify-between gap-3 border-t border-[var(--border-subtle)]">
            <div className="min-w-0 flex-1 space-y-1">
              {sources.length > 0 ? (
                <>
                  <span className="font-mono font-semibold block text-[var(--text-muted)]">
                    {sources.length > 1 ? "Sources:" : "Source:"}
                  </span>
                  <div className="space-y-1">
                    {sources.map((source, index) => (
                      <div key={index} className="flex items-baseline gap-1.5 min-w-0">
                        {sources.length > 1 && (
                          <span className="text-[var(--border-subtle)] select-none mr-0.5">•</span>
                        )}
                        {source.type === "url" ? (
                          <span className="text-[var(--accent)] font-medium break-all inline items-baseline">
                            <span>{source.value}</span>
                            <span className="inline-block ml-0.5 text-[10px] align-baseline">↗</span>
                          </span>
                        ) : (
                          <span className="text-[var(--accent)] font-medium italic break-words">
                            {source.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <span className="italic">Re:Zero kara Hajimeru Isekai Seikatsu Lore Archive</span>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }
);
