import Link from "next/link";
import { getAnimeCatalog, getAnimeStats, getSeasonBadgeLabel } from "../../lib/anime-loader";

export const metadata = {
  title: "Anime Episode Commentary — Od-Lagna",
  description:
    "Author comments, episode trivia, and live-tweets from Tappei Nagatsuki for each Re:Zero anime season.",
  openGraph: {
    title: "Anime Episode Commentary — Od-Lagna",
    description:
      "Explore author Tappei Nagatsuki's broadcast live-tweets and episode commentary across all Re:Zero anime seasons.",
    type: "website",
    url: "/anime",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Episode Commentary — Od-Lagna",
    description:
      "Explore author Tappei Nagatsuki's broadcast live-tweets and episode commentary across all Re:Zero anime seasons.",
  },
};

export default function AnimeCatalogPage() {
  const catalog = getAnimeCatalog();
  const stats = getAnimeStats();

  const seasons = catalog.filter((item) => item.type === "season");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">Anime</span>
      </nav>

      {/* Hero Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
            Author Live-Tweets On Anime Episodes
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
          Anime Episode Commentary
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-3xl leading-relaxed">
          Explore author Tappei Nagatsuki&apos;s real-time broadcast live-tweets and episode commentary across all Re:Zero television seasons.
        </p>

        {/* Stats Strip */}
        <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>
              <strong className="text-[var(--text-main)] font-semibold">{stats.seasonsCount}</strong> Television Seasons
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--verified-text)]" />
            <span>
              <strong className="text-[var(--text-main)] font-semibold">{stats.totalCatalogedEpisodes}</strong> Cataloged Episodes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-solid)]" />
            <span>
              <strong className="text-[var(--text-main)] font-semibold">{stats.totalComments}</strong> Author Comments
            </span>
          </div>
        </div>
      </div>

      {/* Television Seasons Section */}
      <section className="space-y-4">
        <div className="border-b border-[var(--border-subtle)] pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]">
              Television Seasons
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {seasons.length} Releases
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {seasons.map((season) => {
            const isAnnounced = season.status === "announced";

            if (isAnnounced) {
              return (
                <div
                  key={season.id}
                  className="p-5 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-75 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                        {getSeasonBadgeLabel(season)}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded border border-[var(--unverified-border)] bg-[var(--unverified-bg)] text-[var(--unverified-text)]">
                        {season.year}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                        {season.title}
                      </h3>
                    </div>

                    {season.arcs.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {season.arcs.map((arcSlug) => (
                          <span
                            key={arcSlug}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] font-semibold"
                          >
                            {arcSlug.replace("arc-", "Arc ")}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                      {season.synopsis}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-mono text-[var(--text-muted)]">In Production</span>
                    <span className="font-mono text-xs text-[var(--text-muted)] italic">
                      Announced
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={season.id}
                href={`/anime/${season.id}`}
                className="group p-5 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                      {getSeasonBadgeLabel(season)}
                    </span>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded border border-[var(--verified-border)] bg-[var(--verified-bg)] text-[var(--verified-text)]">
                      {season.year}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                      {season.title}
                    </h3>
                  </div>

                  {/* Arcs & Episodes Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {season.episodesCount && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
                        {season.episodesCount} Episodes
                      </span>
                    )}
                    {season.arcs.map((arcSlug) => (
                      <span
                        key={arcSlug}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] font-semibold"
                      >
                        {arcSlug.replace("arc-", "Arc ")}
                      </span>
                    ))}
                  </div>

                  {/* Synopsis */}
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                    {season.synopsis}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[var(--accent)] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore Episodes</span>
                    <span>→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
