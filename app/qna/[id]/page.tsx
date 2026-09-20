import Link from "next/link";
import { getAllQnas } from "../../../lib/content-loader";
import { QnaCard } from "../../../components/QnaCard";
import { QnaEntry } from "../../../lib/schema";
import { formatQnaDate, getEntryDate } from "../../../lib/date-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const qnas = getAllQnas();
  if (qnas.length === 0) {
    return [{ id: "_placeholder" }];
  }
  return qnas.map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const qnas = getAllQnas();
  const entry = qnas.find((q) => q.id === id);

  if (id === "_placeholder" || !entry) {
    return {
      title: "No Q&A Entries Yet — Od-Lagna",
      description: "No Q&A entries have been published to the archive yet.",
    };
  }

  const rawDate = getEntryDate(entry);
  const dateFormatted = formatQnaDate(rawDate);
  const snippet = entry.question.length > 60 ? `${entry.question.slice(0, 57)}...` : entry.question;
  return {
    title: `Q&A #${entry.id}${dateFormatted ? ` (${dateFormatted})` : ""}: "${snippet}" — Od-Lagna`,
    description: `${dateFormatted ? `[${dateFormatted}] ` : ""}${entry.answer.slice(0, 160)}`,
  };
}

function computeRecommendations(current: QnaEntry, all: QnaEntry[], limit = 3) {
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

export default async function QnaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const allQnas = getAllQnas();
  const entry = allQnas.find((q) => q.id === id);

  if (id === "_placeholder" || !entry) {
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
              No Q&amp;A entries yet — check back soon
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              The archive has not yet indexed any public statements for this record. Use the local admin tool or browse the main archive.
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

  const recommendations = computeRecommendations(entry, allQnas, 3);

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
            <span className="text-[var(--text-main)] font-semibold">Q&amp;A #{entry.id}</span>
          </nav>

          <Link
            href={`/browse#qna-${entry.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors text-xs sm:text-sm font-medium"
          >
            <span>←</span>
            <span>Back to Archive</span>
          </Link>
        </div>

        {/* Primary Q&A Showcase Card */}
        <section aria-labelledby="detail-heading">
          <h1 id="detail-heading" className="sr-only">
            Q&amp;A Entry #{entry.id}
          </h1>
          <QnaCard entry={entry} />
        </section>

        {/* Recommended / Similar Q&As Section */}
        {recommendations.length > 0 && (
          <section className="pt-8 border-t border-[var(--border-subtle)] space-y-6" aria-labelledby="recommended-heading">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <h2 id="recommended-heading" className="text-xl font-sans font-bold text-[var(--text-main)] tracking-tight">
                  Related Q&amp;As
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                  Curated Re:Zero author Q&amp;As sharing characters, topics, or storyline arcs.
                </p>
              </div>
              <Link
                href="/browse"
                className="text-xs sm:text-sm text-[var(--accent)] hover:underline font-medium self-start sm:self-auto"
              >
                Browse all {allQnas.length} entries →
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
                  <QnaCard entry={recEntry} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
