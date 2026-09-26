import Link from "next/link";
import { getIfStories, getContentStats, getAllArcs } from "../../lib/content-loader";

export const metadata = {
  title: "IF Routes — Od-Lagna",
  description:
    "Explore alternate 'What-If' divergence routes where Natsuki Subaru made different choices in Re:Zero.",
};

export default function IfStoriesPage() {
  const ifStories = getIfStories();
  const stats = getContentStats();
  const arcs = getAllArcs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">IF Routes</span>
      </nav>

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
          {ifStories.length} Routes
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
          IF Routes
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-3xl leading-relaxed">
          Alternate divergence routes exploring what would happen if Natsuki Subaru surrendered to a deadly sin or made an alternate choice at key turning points in the story.
        </p>
      </div>

      {/* Grid of IF Routes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {ifStories.map((story) => {
          const count = stats.arcCounts[story.slug] || 0;
          let divergenceName = "Independent divergence";
          if (story.divergesFrom) {
            const arc = arcs.find((a) => a.slug === story.divergesFrom);
            divergenceName = arc ? `Diverges from Arc ${arc.order}: ${arc.name}` : `Diverges from ${story.divergesFrom}`;
          }

          return (
            <Link
              key={story.slug}
              href={`/ifs/${story.slug}`}
              className="group p-4 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)]">
                    IF Route
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {count} Q&amp;A{count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                    {story.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[var(--accent)]">
                    {divergenceName}
                  </p>
                </div>

                {story.description ? (
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {story.description}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] italic">
                    Explore Q&amp;A archive and supplementary lore notes.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm font-semibold text-[var(--accent)]">
                <span>View Route &amp; Supplements</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
