import { Metadata } from "next";
import Link from "next/link";
import { getContentStats, getAllArcs, getAllIfRoutes } from "../../lib/content-loader";

export const metadata: Metadata = {
  title: "About — Od-Lagna Re:Zero Q&A Archive",
  description:
    "Why Od-Lagna was created, how author statements are organized, and how spoiler protection works.",
};

export default function AboutPage() {
  const stats = getContentStats();
  const arcs = getAllArcs();
  const ifRoutes = getAllIfRoutes();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8 sm:pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Origin &amp; Purpose</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
          A Single Website for All Q&amp;A Entries
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] font-serif leading-relaxed max-w-3xl">
          This website was created because author Q&amp;A entries were scattered across the internet and difficult to find. Od-Lagna brings them together in one place, making it easier to search, filter, and read through them.
        </p>
      </div>

      {/* Architectural Pillars Grid */}
      <section className="space-y-6" aria-labelledby="pillars-heading">
        <div className="space-y-1">
          <h2 id="pillars-heading" className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Core Principles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1:  Spoiler Safety */}
          <div className="p-5 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center font-bold text-sm font-mono">
              01
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
              Spoiler Protection
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              Every Q&amp;A is tagged with its minimum spoiler threshold. Whether you are an anime-only viewer at Arc 3, currently reading Arc 6, or fully caught up with Novels, you can set your personal cutoff to browse with total confidence.
            </p>
          </div>

          {/* Pillar 2: Primary Source Verification */}
          <div className="p-5 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--verified-bg)] border border-[var(--verified-border)] text-[var(--verified-text)] flex items-center justify-center font-bold text-sm font-mono">
              02
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
              Primary Source Verification
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              Entries clearly distinguish between verified records with primary Japanese citations (official tweets, archival links, scan transcripts) and unverified entries awaiting corroborating sources.
            </p>
          </div>
        </div>
      </section>

      {/* Scope of Coverage */}
      <section className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">
          Scope of Coverage
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--accent)]">
              {arcs.length}
            </div>
            <div className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">Canon Arcs Indexed</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--accent)]">
              {ifRoutes.length}
            </div>
            <div className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">IF Routes Supported</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--accent)]">
              {stats.totalCount}
            </div>
            <div className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">Queries Indexed</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--accent)]">
              100%
            </div>
            <div className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">Static &amp; Open Source</div>
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          The archive indexes questions spanning personal character trivia, magic theory, divine protections, historical lore of the Re:Zero world, and IF timelines.
        </p>
      </section>

      {/* Legal & Non-Commercial Disclaimer */}
      <section className="space-y-4 border-t border-[var(--border-subtle)] pt-8">
        <h2 className="text-lg font-bold text-[var(--text-main)]">
          Disclaimer &amp; Copyright Notice
        </h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Od-Lagna is an independent, non-commercial fan project created purely for archival purposes.
        </p>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          <em>Re:Zero kara Hajimeru Isekai Seikatsu</em> and all associated characters, names, storylines, and trademarks are the intellectual property of Tappei Nagatsuki and KADOKAWA Corporation.
        </p>
      </section>

      {/* Action Links */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border-subtle)]">
        <Link
          href="/browse"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
        >
          Browse the Archive →
        </Link>
        <Link
          href="/contribute"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors"
        >
          How to Contribute
        </Link>
      </div>
    </div>
  );
}
