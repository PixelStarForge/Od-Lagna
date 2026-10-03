import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAnimeCatalog,
  getAnimeSeason,
  getSeasonEpisodes,
  getSeasonBadgeLabel,
  EpisodeCommentary,
} from "../../../lib/anime-loader";

interface PageProps {
  params: Promise<{
    season: string;
  }>;
}

export async function generateStaticParams() {
  const catalog = getAnimeCatalog();
  return catalog.map((item) => ({
    season: item.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { season: seasonId } = await params;
  const season = getAnimeSeason(seasonId);
  if (!season) return { title: "Anime — Od-Lagna" };

  const title = `${season.title} Commentary — Od-Lagna`;
  const description = `Author Tappei Nagatsuki's episode comments, live-tweets, and production trivia for Re:Zero ${season.title}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/anime/${seasonId}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function AnimeSeasonPage({ params }: PageProps) {
  const { season: seasonId } = await params;
  const season = getAnimeSeason(seasonId);

  if (!season) {
    notFound();
  }

  const catalogedEpisodes = getSeasonEpisodes(seasonId);

  // Pre-index episodes by number for O(1) lookups in grid
  const episodeMap = new Map<number, EpisodeCommentary>(
    catalogedEpisodes.map((e) => [e.episodeNumber, e])
  );

  // Determine total episodes to display
  const maxCatalogedEp =
    catalogedEpisodes.length > 0
      ? catalogedEpisodes[catalogedEpisodes.length - 1].episodeNumber
      : 0;
  const totalEpCount = Math.max(season.episodesCount || 0, maxCatalogedEp);

  // Generate episode numbers array [1, 2, ... totalEpCount]
  const episodeNumbers = Array.from({ length: totalEpCount }, (_, i) => i + 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] min-w-0"
        >
          <Link href="/" className="hover:text-[var(--accent)] transition-colors shrink-0">
            Home
          </Link>
          <span>/</span>
          <Link href="/anime" className="hover:text-[var(--accent)] transition-colors shrink-0">
            Anime
          </Link>
          <span>/</span>
          <span className="text-[var(--text-main)] font-semibold truncate">{season.title}</span>
        </nav>

        <Link
          href="/anime"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors text-xs sm:text-sm font-semibold self-start sm:self-auto shrink-0"
        >
          <span>←</span>
          <span>Back to Anime</span>
        </Link>
      </div>

      {/* Season Hero Header */}
      <section className="p-5 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              {getSeasonBadgeLabel(season)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              {season.year}
            </span>
            {season.duration && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                {season.duration}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
            {season.title}
          </h1>
        </div>

        {/* Arc badges */}
        {season.arcs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono text-[var(--text-muted)] font-medium">Adapted Arcs:</span>
            {season.arcs.map((arc) => (
              <span
                key={arc}
                className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold"
              >
                {arc.replace("arc-", "Arc ")}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed">
            {season.synopsis}
          </p>
        </div>
      </section>

      {/* Episode Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-2 gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]">
              Episodes &amp; Broadcast Commentary
            </h2>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              ({totalEpCount > 0 ? `${totalEpCount} Episodes` : "No episodes yet"})
            </span>
          </div>

          <Link
            href={`/anime/browse?seasons=${seasonId}`}
            className="text-xs font-mono font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Search all {season.title} comments</span>
            <span>→</span>
          </Link>
        </div>

        {totalEpCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {episodeNumbers.map((epNum) => {
              const cataloged = episodeMap.get(epNum);
              const hasComments = cataloged && cataloged.comments && cataloged.comments.length > 0;

              if (hasComments) {
                return (
                  <Link
                    key={epNum}
                    href={`/anime/${seasonId}/${epNum}`}
                    className="group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)]">
                          Episode {epNum < 10 ? `0${epNum}` : epNum}
                        </span>
                        {cataloged.airDate && (
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            {cataloged.airDate}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                          {cataloged.title.en}
                        </h3>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                      <span>{cataloged.comments.length} Author Comments</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                );
              }

              return (
                <div
                  key={epNum}
                  className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-75 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        Episode {epNum < 10 ? `0${epNum}` : epNum}
                      </span>
                      {cataloged?.airDate ? (
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {cataloged.airDate}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-[var(--text-muted)] italic">
                          Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">
                      {cataloged?.title?.en || `Episode ${epNum}`}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] italic">
                    Comments cataloging pending
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
            <p className="text-base font-semibold text-[var(--text-main)]">
              No episodes scheduled or cataloged yet.
            </p>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              Episode data and author tweets for this release will be cataloged soon.
            </p>
            <div className="pt-2">
              <Link
                href="/anime"
                className="text-xs font-mono font-semibold text-[var(--accent)] hover:underline"
              >
                ← Back to Anime Overview
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
