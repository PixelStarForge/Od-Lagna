import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeCommentaryClient } from "../../../../components/EpisodeCommentaryClient";
import {
  getAnimeSeason,
  getEpisodeCommentary,
  getSeasonEpisodes,
  getAllEpisodeParams,
  EpisodeCommentary,
} from "../../../../lib/anime-loader";

interface PageProps {
  params: Promise<{
    season: string;
    episode: string;
  }>;
}

export async function generateStaticParams() {
  return getAllEpisodeParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { season: seasonId, episode: episodeParam } = await params;
  const commentary = getEpisodeCommentary(seasonId, episodeParam);
  const season = getAnimeSeason(seasonId);

  if (!commentary || !season) {
    return { title: "Episode Commentary — Od-Lagna" };
  }

  const title = `Episode ${commentary.episodeNumber}: ${commentary.title.en} — ${season.title} Commentary — Od-Lagna`;
  const description = `Author Tappei Nagatsuki's official broadcast live-tweets and episode commentary for Re:Zero ${season.title} Episode ${commentary.episodeNumber}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/anime/${seasonId}/${commentary.episodeNumber}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

interface EpisodePaginationProps {
  seasonId: string;
  currentEpNum: number;
  totalEpisodes: number;
  allEpisodes: EpisodeCommentary[];
  position: "top" | "bottom";
}

function EpisodePagination({
  seasonId,
  currentEpNum,
  totalEpisodes,
  allEpisodes,
  position,
}: EpisodePaginationProps) {
  if (totalEpisodes <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalEpisodes <= 7) {
    for (let i = 1; i <= totalEpisodes; i++) pages.push(i);
  } else if (currentEpNum <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", totalEpisodes);
  } else if (currentEpNum >= totalEpisodes - 3) {
    pages.push(
      1,
      "...",
      totalEpisodes - 4,
      totalEpisodes - 3,
      totalEpisodes - 2,
      totalEpisodes - 1,
      totalEpisodes
    );
  } else {
    pages.push(1, "...", currentEpNum - 1, currentEpNum, currentEpNum + 1, "...", totalEpisodes);
  }

  const currentIndex = allEpisodes.findIndex((e) => e.episodeNumber === currentEpNum);
  const prevEp = currentIndex > 0 ? allEpisodes[currentIndex - 1] : allEpisodes.find((e) => e.episodeNumber === currentEpNum - 1);
  const nextEp = currentIndex >= 0 && currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : allEpisodes.find((e) => e.episodeNumber === currentEpNum + 1);

  const availableEpSet = new Set(allEpisodes.map((e) => e.episodeNumber));

  const borderClass =
    position === "top"
      ? "pb-3 border-b border-[var(--border-subtle)]"
      : "pt-6 border-t border-[var(--border-subtle)]";

  return (
    <nav
      aria-label={`Episode Navigation (${position})`}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${borderClass} text-xs sm:text-sm`}
    >
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        {prevEp ? (
          <Link
            href={`/anime/${seasonId}/${prevEp.episodeNumber}`}
            className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>Previous</span>
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] opacity-40 cursor-not-allowed select-none shadow-2xs inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>Previous</span>
          </span>
        )}

        {/* Mobile episode status */}
        <span className="sm:hidden font-mono text-xs text-[var(--text-muted)] font-medium">
          Episode {currentEpNum} of {totalEpisodes}
        </span>

        {nextEp ? (
          <Link
            href={`/anime/${seasonId}/${nextEp.episodeNumber}`}
            className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
          >
            <span>Next</span>
            <span>→</span>
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] opacity-40 cursor-not-allowed select-none shadow-2xs inline-flex items-center gap-1"
          >
            <span>Next</span>
            <span>→</span>
          </span>
        )}
      </div>

      {/* Desktop / Laptop episode numbers with ellipsis */}
      <div className="hidden sm:flex items-center gap-1.5">
        {pages.map((item, idx) => {
          if (item === "...") {
            return (
              <span
                key={`ellipsis-${position}-${idx}`}
                className="w-8 h-8 flex items-center justify-center font-mono text-xs text-[var(--text-muted)] select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = item === currentEpNum;
          if (isCurrent) {
            return (
              <span
                key={`ep-${position}-${item}`}
                aria-current="page"
                className="w-8 h-8 rounded-lg text-xs font-mono font-bold bg-[var(--accent)] text-white shadow-2xs flex items-center justify-center select-none"
              >
                {item}
              </span>
            );
          }

          const isAvailable = availableEpSet.has(item);
          if (isAvailable) {
            return (
              <Link
                key={`ep-${position}-${item}`}
                href={`/anime/${seasonId}/${item}`}
                title={`Episode ${item}`}
                className="w-8 h-8 rounded-lg text-xs font-mono font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-all shadow-2xs flex items-center justify-center"
              >
                {item}
              </Link>
            );
          }

          return (
            <span
              key={`ep-${position}-${item}`}
              title={`Episode ${item} (Pending)`}
              className="w-8 h-8 rounded-lg text-xs font-mono text-[var(--text-muted)] opacity-40 border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center cursor-not-allowed select-none"
            >
              {item}
            </span>
          );
        })}
      </div>

      {/* Total Indicator for desktop */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
        <span>Total {totalEpisodes} Episodes</span>
      </div>
    </nav>
  );
}

export default async function EpisodeCommentaryPage({ params }: PageProps) {
  const { season: seasonId, episode: episodeParam } = await params;
  const commentary = getEpisodeCommentary(seasonId, episodeParam);
  const season = getAnimeSeason(seasonId);

  if (!commentary || !season) {
    notFound();
  }

  const allEpisodes = getSeasonEpisodes(seasonId);
  const currentEpNum = commentary.episodeNumber;
  const totalEpisodes = Math.max(
    season.episodesCount || 0,
    allEpisodes.length > 0 ? allEpisodes[allEpisodes.length - 1].episodeNumber : currentEpNum
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--text-muted)] overflow-x-auto min-w-0"
        >
          <Link href="/" className="hover:text-[var(--accent)] transition-colors shrink-0">
            Home
          </Link>
          <span>/</span>
          <Link href="/anime" className="hover:text-[var(--accent)] transition-colors shrink-0">
            Anime
          </Link>
          <span>/</span>
          <Link href={`/anime/${seasonId}`} className="hover:text-[var(--accent)] transition-colors shrink-0">
            {season.title}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-main)] font-semibold shrink-0">
            Episode {currentEpNum}
          </span>
        </nav>

        <Link
          href={`/anime/${seasonId}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors text-xs sm:text-sm font-semibold self-start sm:self-auto shrink-0"
        >
          <span>←</span>
          <span>Back to {season.title}</span>
        </Link>
      </div>

      {/* Episode Header */}
      <section className="p-5 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)]">
              Episode {currentEpNum < 10 ? `0${currentEpNum}` : currentEpNum}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded">
              {season.title}
            </span>
            {commentary.airDate && (
              <span className="text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded">
                Aired: {commentary.airDate}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            {commentary.title.en}
          </h1>
        </div>

        {/* Translation source banner if provided */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          {commentary.translationSource ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Translations compiled from community archive:</span>
              <a
                href={commentary.translationSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <span>{commentary.translationSource.name || "Community Source"}</span>
                <span>↗</span>
              </a>
            </div>
          ) : (
            <span>Author broadcast commentary stream</span>
          )}

          <span className="text-[var(--accent)] font-semibold font-mono">
            {commentary.comments.length} Author Comments
          </span>
        </div>
      </section>

      {/* Top Episode Pagination */}
      <EpisodePagination
        seasonId={seasonId}
        currentEpNum={currentEpNum}
        totalEpisodes={totalEpisodes}
        allEpisodes={allEpisodes}
        position="top"
      />

      {/* Commentary Stream with Interactive Filter System */}
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-xl">
            Loading episode commentary...
          </div>
        }
      >
        <EpisodeCommentaryClient
          seasonId={seasonId}
          seasonTitle={season.title}
          episodeNumber={currentEpNum}
          comments={commentary.comments}
        />
      </Suspense>

      {/* Bottom Episode Pagination */}
      <EpisodePagination
        seasonId={seasonId}
        currentEpNum={currentEpNum}
        totalEpisodes={totalEpisodes}
        allEpisodes={allEpisodes}
        position="bottom"
      />
    </div>
  );
}
