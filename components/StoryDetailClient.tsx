"use client";

import Link from "next/link";
import { StoryDetail } from "../lib/schema";

interface StoryDetailClientProps {
  story: StoryDetail;
  qnaCount: number;
  divergenceArcName: string | null;
  baseRoute?: string;
}

export function StoryDetailClient({
  story,
  qnaCount,
  divergenceArcName,
  baseRoute,
}: StoryDetailClientProps) {
  const isIf = (story.type ?? "if") === "if";
  const categoryLabel = isIf ? "IF Routes" : "Side Stories";
  const categoryHref = baseRoute || (isIf ? "/ifs" : "/side-stories");
  const supplementsHref = `${categoryHref}/${story.slug}/supplements`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={categoryHref} className="hover:text-[var(--accent)] transition-colors">
          {categoryLabel}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">{story.name}</span>
      </nav>

      {/* Main Story Overview Card */}
      <section className="p-5 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              {isIf ? "IF Route" : "Side Story"}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
              {story.name}
            </h1>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Divergence Point (IF) OR Timeline Placement (Side Story) */}
          {isIf ? (
            <div className="p-4 sm:p-5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 min-w-0">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Divergence Point
              </p>
              <p className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                {divergenceArcName ? (
                  <Link
                    href={`/browse?arc=${story.divergesFrom}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {divergenceArcName}
                  </Link>
                ) : (
                  <span className="text-[var(--text-muted)]">Independent divergence</span>
                )}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Point where this alternate timeline diverges from canon
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 min-w-0">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Timeline Placement (Canon)
              </p>
              <p className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                {story.timeline ? (
                  <span className="text-[var(--accent)]">{story.timeline}</span>
                ) : (
                  <span className="text-[var(--text-muted)]">Canonical standalone</span>
                )}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Canonically placed in the official Re:Zero storyline
              </p>
            </div>
          )}

          {/* Card 2: Date Published */}
          <div className="p-4 sm:p-5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 min-w-0">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Date Published
            </p>
            <p className="text-base sm:text-lg font-bold text-[var(--text-main)]">
              {story.datePublished ? (
                story.datePublished
              ) : (
                <span className="text-[var(--text-muted)] italic font-normal">To be added</span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Original publication or serialization date
            </p>
          </div>

          {/* Card 3: Q&A Count */}
          <div className="p-4 sm:p-5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 min-w-0">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Q&amp;A Archive Entries
            </p>
            <p className="text-base sm:text-lg font-bold text-[var(--text-main)]">
              {qnaCount > 0 ? (
                <span className="font-mono">{qnaCount} Entries</span>
              ) : (
                <span className="text-[var(--text-muted)] italic font-normal">None indexed yet</span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Verified author statements cataloged
            </p>
          </div>
        </div>

        {/* Premise Description */}
        {story.description && (
          <div className="pt-5 border-t border-[var(--border-subtle)] space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Premise &amp; Overview
            </p>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              {story.description}
            </p>
          </div>
        )}
      </section>

      {/* Action Navigation Cards: Q&A and Supplements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Q&A Archive Action Card */}
        <Link
          href={`/browse?ifRoute=${story.slug}`}
          className="group p-5 sm:p-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                Q&amp;A Archive
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {qnaCount > 0
                  ? `Browse ${qnaCount} verified author statements and Q&A entries for ${story.name}.`
                  : `Browse indexed Q&A archive filtered for ${story.name}.`}
              </p>
            </div>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-[var(--accent)] flex items-center gap-1.5 pt-1">
            <span>Explore Q&amp;As in Browse</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* Supplements Action Card */}
        {story.supplements.length > 0 ? (
          <Link
            href={supplementsHref}
            className="group p-5 sm:p-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                  Supplements
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  {story.supplements.length} author comment{story.supplements.length !== 1 ? "s" : ""} and supplementary lore details available.
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[var(--accent)] flex items-center gap-1.5 pt-1">
              <span>View Story Supplements</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ) : (
          <div className="p-5 sm:p-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between space-y-4 opacity-80">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                  Supplements
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  Supplements for {story.name} will be provided in a near-future update.
                </p>
              </div>
            </div>
            <div className="text-xs font-medium text-[var(--text-muted)] italic pt-1">
              Coming Soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
