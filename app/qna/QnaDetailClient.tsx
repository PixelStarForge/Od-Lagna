"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { QnaCard } from "../../components/QnaCard";
import { TriviaCard } from "../../components/TriviaCard";
import { QnaEntry, TriviaEntry, ArchiveEntry } from "../../lib/schema";
import { formatQnaDate, getEntryDate } from "../../lib/date-utils";

interface QnaDetailClientProps {
  allQnas: QnaEntry[];
  allTrivia?: TriviaEntry[];
}

function computeRecommendations(current: ArchiveEntry, all: ArchiveEntry[], limit = 3) {
  const others = all.filter((item) => item.id !== current.id);
  if (others.length === 0) return [];

  const scored = others.map((item) => {
    let score = 0;
    const reasons: string[] = [];

    // Characters: +3 points each
    const sharedChars = item.characters.filter((c) => current.characters.includes(c));
    if (sharedChars.length > 0) {
      score += sharedChars.length * 3;
      reasons.push(sharedChars.join(", "));
    }

    // Topics: +2 points each
    const sharedTopics = item.topics.filter((t) => current.topics.includes(t));
    if (sharedTopics.length > 0) {
      score += sharedTopics.length * 2;
      reasons.push(sharedTopics.join(", "));
    }

    // Arc: +1 point
    if (item.arc === current.arc && item.arc !== "general") {
      score += 1;
      reasons.push("Same Story Arc");
    }

    return {
      entry: item,
      score,
      reasonText: reasons.join(" • "),
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  return scored.slice(0, limit);
}

export function QnaDetailClient({ allQnas, allTrivia = [] }: QnaDetailClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const allEntries = useMemo<ArchiveEntry[]>(() => {
    const qnas: ArchiveEntry[] = allQnas.map((q) => ({ entryType: "qna" as const, ...q }));
    const trivias: ArchiveEntry[] = allTrivia.map((t) => ({ entryType: "trivia" as const, ...t }));
    return [...qnas, ...trivias];
  }, [allQnas, allTrivia]);

  const getIdFromUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const fromPath = pathParts.length > 1 && pathParts[0] === "qna" ? pathParts[1] : null;
      return sp.get("id") || fromPath || "";
    }
    const pathParts = pathname.split("/").filter(Boolean);
    const idFromPath = pathParts.length > 1 && pathParts[0] === "qna" ? pathParts[1] : null;
    return searchParams.get("id") || idFromPath || "";
  }, [pathname, searchParams]);

  const [id, setId] = useState<string>(() => getIdFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      React.startTransition(() => {
        setId(getIdFromUrl());
      });
    };
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("od-lagna-urlchange", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("od-lagna-urlchange", handleUrlChange);
    };
  }, [getIdFromUrl]);

  useEffect(() => {
    React.startTransition(() => {
      setId(getIdFromUrl());
    });
  }, [searchParams, getIdFromUrl]);

  // Determine if requested ID is trivia or Q&A
  const isTriviaId = /^tr[-_\s]?\d+/i.test(id);

  const entry = useMemo<ArchiveEntry | null>(() => {
    if (!id) return null;

    if (isTriviaId) {
      const normalizedId = id.toUpperCase().replace(/\s+/g, "-");
      const numPart = id.replace(/^tr[-_\s]*/i, "");
      const paddedId = `TR-${numPart.padStart(4, "0")}`;

      const tMatch = allTrivia.find(
        (t) =>
          t.id.toUpperCase() === normalizedId ||
          t.id === paddedId ||
          t.id.toLowerCase() === id.toLowerCase()
      );
      if (tMatch) {
        return { entryType: "trivia" as const, ...tMatch };
      }
    }

    const cleanId = id.replace(/^#/, "").replace(/^qna[\s#-]+/i, "").trim();
    const isNum = /^\d+$/.test(cleanId);

    const qMatch = allQnas.find(
      (q) =>
        q.id === id ||
        q.id === cleanId ||
        (isNum && (q.id === cleanId.padStart(4, "0") || parseInt(q.id, 10).toString() === cleanId))
    );

    if (qMatch) {
      return { entryType: "qna" as const, ...qMatch };
    }

    return null;
  }, [id, isTriviaId, allTrivia, allQnas]);

  // Dynamically update document title on client
  useEffect(() => {
    if (entry) {
      const rawDate = getEntryDate(entry);
      const dateFormatted = formatQnaDate(rawDate);
      if (entry.entryType === "qna") {
        const snippet = entry.question.length > 60 ? `${entry.question.slice(0, 57)}...` : entry.question;
        document.title = `Q&A #${entry.id}${dateFormatted ? ` (${dateFormatted})` : ""}: "${snippet}" — Od-Lagna`;
      } else {
        const titleSnippet = entry.title || (entry.text.length > 60 ? `${entry.text.slice(0, 57)}...` : entry.text);
        document.title = `Trivia #${entry.id}${dateFormatted ? ` (${dateFormatted})` : ""}: "${titleSnippet}" — Od-Lagna`;
      }
    } else {
      document.title = "Entry Not Found — Od-Lagna";
    }
  }, [entry]);

  if (!id || !entry) {
    return (
      <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] py-12 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
              {id ? `Entry #${id} not found` : "No entry specified"}
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              The archive has not indexed a statement matching this ID. It may have been moved or you may browse the complete archive.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
            >
              Return to Home
            </Link>
            <Link
              href="/browse"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors"
            >
              Browse Archive
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const recommendations = computeRecommendations(entry, allEntries, 3);

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Bar & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-[var(--accent)] transition-colors">
              Archive
            </Link>
            <span>/</span>
            <span className="text-[var(--text-main)] font-semibold">
              {entry.entryType === "trivia" ? "Trivia" : "Q&A"} #{entry.id}
            </span>
          </nav>

          <Link
            href={`/browse?id=${entry.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors text-xs sm:text-sm font-medium"
          >
            <span>←</span>
            <span>Back to Archive</span>
          </Link>
        </div>

        {/* Primary Entry Showcase Card */}
        <section aria-labelledby="detail-heading">
          <h1 id="detail-heading" className="sr-only">
            {entry.entryType === "trivia" ? "Trivia" : "Q&A"} Entry #{entry.id}
          </h1>
          {entry.entryType === "trivia" ? (
            <TriviaCard entry={entry} />
          ) : (
            <QnaCard entry={entry} />
          )}
        </section>

        {/* Recommended / Similar Entries Section */}
        {recommendations.length > 0 && (
          <section className="pt-8 border-t border-[var(--border-subtle)] space-y-6" aria-labelledby="recommended-heading">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <h2 id="recommended-heading" className="text-xl font-sans font-bold text-[var(--text-main)] tracking-tight">
                  Related Archive Entries
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                  Curated Re:Zero author statements sharing characters, topics, or storyline arcs.
                </p>
              </div>
              <Link
                href="/browse"
                className="text-xs sm:text-sm text-[var(--accent)] hover:underline font-medium self-start sm:self-auto"
              >
                Browse all {allEntries.length} entries →
              </Link>
            </div>

            <div className="space-y-4">
              {recommendations.map(({ entry: recEntry, reasonText }) => (
                <div key={recEntry.id} className="space-y-1.5">
                  {reasonText && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] px-1">
                      <span className="text-[var(--accent)]">↳</span>
                      <span>Connected by: {reasonText}</span>
                    </div>
                  )}
                  {recEntry.entryType === "trivia" ? (
                    <TriviaCard entry={recEntry} />
                  ) : (
                    <QnaCard entry={recEntry} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
