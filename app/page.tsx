import Link from "next/link";
import { getContentStats, getAllArcs, getAllIfRoutes } from "../lib/content-loader";
import { SearchHeroButton } from "../components/SearchHeroButton";

export default function HomePage() {
  const stats = getContentStats();
  const arcs = getAllArcs();
  const ifRoutes = getAllIfRoutes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
          <span>Answers of Od-Lagna</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-main)]">
          Every Tappei Q&amp;A. <br />
          <span className="text-[var(--accent)] italic">One Searchable Archive.</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          Od-Lagna indexes every public statement, event interview, and Twitter Q&amp;A given by Re:Zero author{" "}
          <strong className="text-[var(--text-main)] font-semibold">Tappei Nagatsuki</strong>, with granular spoiler cutoff controls.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/browse"
            className="px-6 py-3 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            Browse Q&amp;A Index
          </Link>
          <SearchHeroButton />
        </div>
      </section>

      {/* Live Stats Overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Live Archive Metrics
          </h2>
          <span className="text-xs font-mono text-[var(--text-muted)]">Updated at build time</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <p className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase">Total Indexed</p>
            <p className="text-3xl font-extrabold text-[var(--text-main)] mt-1 font-mono">
              {stats.totalCount}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">Author Q&amp;A records</p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <p className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase">Verified Citations</p>
            <p className="text-3xl font-extrabold text-[var(--verified-text)] mt-1 font-mono">
              {stats.verifiedCount}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">With primary source URLs</p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <p className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase">Canon Arcs</p>
            <p className="text-3xl font-extrabold text-[var(--text-main)] mt-1 font-mono">
              {arcs.length}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">Arc 1 through Arc 10</p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <p className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase">IF Timelines</p>
            <p className="text-3xl font-extrabold text-[var(--text-main)] mt-1 font-mono">
              {ifRoutes.length}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">Alternate What-If routes</p>
          </div>
        </div>
      </section>

      {/* Intentional Empty State / Population Notice */}
      {stats.totalCount === 0 && (
        <section className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Archive Initialized &amp; Ready for Ingestion
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              The Od-Lagna engine, spoiler filtration system, and search indices are active with 0 placeholder entries.
              Real Q&amp;As will be ingested into <code className="px-1.5 py-0.5 rounded text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">content/qna/</code> using the local admin tool.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/browse"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] transition-colors"
            >
              Explore Browse Interface →
            </Link>
          </div>
        </section>
      )}

      {/* Canon Arcs Progression Spine */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">
              Canonical Story Progression
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              The linear story spine mapped to the spoiler-cutoff slider.
            </p>
          </div>
          <Link href="/browse" className="text-sm font-semibold text-[var(--accent)] hover:underline">
            View in Browse →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {arcs.map((arc) => {
            const count = stats.arcCounts[arc.slug] || 0;
            return (
              <Link
                key={arc.slug}
                href={`/browse?arc=${arc.slug}`}
                className="group p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:bg-[var(--accent-bg)] transition-colors">
                      Arc {arc.order}
                    </span>
                    <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
                      {count} Q&amp;A
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                    {arc.name}
                  </h3>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1 group-hover:text-[var(--accent)]">
                  <span>Filter arc</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Alternate Timelines (IF Routes) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">
            Alternate &ldquo;What-If&rdquo; Timelines
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Parallel divergence routes exploring divergent choices made by Subaru Natsuki.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ifRoutes.map((route) => {
            const count = stats.arcCounts[route.slug] || 0;
            return (
              <Link
                key={route.slug}
                href={`/browse?ifRoute=${route.slug}`}
                className="group p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--accent)]">
                      {route.name}
                    </span>
                    <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
                      {count} Q&amp;A
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    {route.divergesFrom
                      ? `Diverges from ${route.divergesFrom.replace("-", " ").toUpperCase()}`
                      : "Independent divergence"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
