import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllQnas } from "../../../lib/content-loader";
import { QnaCard } from "../../../components/QnaCard";
import { QnaEntry } from "../../../lib/schema";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const qnas = getAllQnas();
  return qnas.map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const qnas = getAllQnas();
  const entry = qnas.find((q) => q.id === id);

  if (!entry) {
    return {
      title: "Q&A Not Found — Od-Lagna",
    };
  }

  const snippet = entry.question.length > 60 ? `${entry.question.slice(0, 57)}...` : entry.question;
  return {
    title: `Q&A #${entry.id}: "${snippet}" — Od-Lagna`,
    description: entry.answer.slice(0, 160),
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

  if (!entry) {
    notFound();
  }

  const recommendations = computeRecommendations(entry, allQnas, 3);

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Bar & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-4">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-faint)] text-[var(--text-main)] transition-colors"
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
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Curated Re:Zero author Q&amp;As sharing characters, topics, or storyline arcs.
                </p>
              </div>
              <Link
                href="/browse"
                className="text-xs text-[var(--accent)] hover:underline font-medium self-start sm:self-auto"
              >
                Browse all {allQnas.length} entries →
              </Link>
            </div>

            <div className="space-y-4">
              {recommendations.map(({ entry: recEntry, reasonText }) => (
                <div key={recEntry.id} className="space-y-1.5">
                  {reasonText && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-faint)] px-1">
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
