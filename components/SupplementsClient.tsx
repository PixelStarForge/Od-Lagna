"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StoryDetail, SupplementEntry } from "../lib/schema";

interface SupplementsClientProps {
  story: StoryDetail;
  baseRoute?: string;
}

function SupplementCard({ supplement }: { supplement: SupplementEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = supplement.content.length > 350;
  const displayContent =
    isLong && !isExpanded
      ? supplement.content.slice(0, 347) + "..."
      : supplement.content;

  return (
    <article className="p-4 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)] leading-snug">
          {supplement.title}
        </h3>
        {supplement.date && (
          <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md shrink-0">
            {supplement.date}
          </span>
        )}
      </div>

      <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
        {displayContent}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          <span>{isExpanded ? "Show less" : "Read full comment"}</span>
          <span>{isExpanded ? "↑" : "↓"}</span>
        </button>
      )}

      {supplement.source && supplement.source.value && (
        <div className="pt-2.5 border-t border-[var(--border-subtle)]">
          {supplement.source.type === "url" ? (
            <a
              href={supplement.source.value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--accent)] hover:underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>View Source</span>
            </a>
          ) : (
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Source: {supplement.source.value}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function SupplementsClient({ story, baseRoute }: SupplementsClientProps) {
  const isIf = (story.type ?? "if") === "if";
  const categoryLabel = isIf ? "IF Routes" : "Side Stories";
  const categoryHref = baseRoute || (isIf ? "/ifs" : "/side-stories");
  const storyHref = `${categoryHref}/${story.slug}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={categoryHref} className="hover:text-[var(--accent)] transition-colors">
          {categoryLabel}
        </Link>
        <span>/</span>
        <Link href={storyHref} className="hover:text-[var(--accent)] transition-colors">
          {story.name}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">Supplements</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
            {story.name} · Supplements
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
            Supplements &amp; Author Notes
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)]">
            Author comments, tweets, and supplementary lore for{" "}
            <strong className="text-[var(--text-main)] font-semibold">{story.name}</strong>.
          </p>
        </div>
        <Link
          href={storyHref}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors text-xs sm:text-sm font-semibold self-start sm:self-auto"
        >
          <span>←</span>
          <span>Back to {story.name}</span>
        </Link>
      </div>

      {/* Supplements List */}
      {story.supplements.length > 0 ? (
        <div className="space-y-4">
          <div className="text-xs font-mono text-[var(--text-muted)] font-medium">
            {story.supplements.length} supplement{story.supplements.length !== 1 ? "s" : ""} cataloged
          </div>
          {story.supplements.map((supplement) => (
            <SupplementCard key={supplement.id} supplement={supplement} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
              No Supplements Yet
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Supplements for <strong>{story.name}</strong> will be provided in a near-future update.
              Check back later for author comments and additional lore.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={storyHref}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors"
            >
              ← Back to {story.name}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
