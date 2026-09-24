import { Metadata } from "next";
import Link from "next/link";
import { ContributionTemplates } from "../../components/ContributionTemplates";
import { getAllContributors } from "../../lib/content-loader";

export const metadata: Metadata = {
  title: "Contribute — Od-Lagna Re:Zero Q&A Archive",
  description:
    "Suggest new author Q&A entries, submit translation corrections, provide primary sources, or ask questions via GitHub Issues.",
};

function getInitials(name: string): string {
  const cleaned = name.replace(/^(u\/|@|r\/)/i, "").trim();
  const parts = cleaned.split(/[\s_\-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "??";
}

export default function ContributePage() {
  const contributors = getAllContributors();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8 sm:pb-12">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Submissions &amp; Corrections</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
          Contribute to the Archive
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] font-serif leading-relaxed max-w-3xl">
          Od-Lagna was built to bring scattered Re:Zero author Q&amp;A entries together in one place. If you have a newly discovered author statement, spotted a mistranslation or typo, have a primary Japanese source link to verify an entry, or have a question, please open an issue on our GitHub repository.
        </p>
      </div>

      {/* GitHub Callout Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
                GitHub Issues
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
              All Submissions &amp; Queries Go Through GitHub Issues
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-serif leading-relaxed max-w-xl">
              Using GitHub Issues makes it easy to track suggestions, discuss fixes, and update the entries so nothing gets lost or forgotten.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="https://github.com/PixelStarForge/Od-Lagna/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs text-center inline-flex items-center justify-center gap-1.5"
            >
              <span>Open GitHub Issue</span>
              <span>↗</span>
            </a>
            <a
              href="https://github.com/PixelStarForge/Od-Lagna/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] transition-colors text-center"
            >
              View Active Issues
            </a>
          </div>
        </div>
      </div>

      {/* Contribution Categories */}
      <section className="space-y-6" aria-labelledby="ways-to-contribute">
        <div className="space-y-1">
          <h2 id="ways-to-contribute" className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            How You Can Help
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-mono uppercase tracking-wider">
            Four ways to help keep the archive accurate and up to date
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
            <div className="font-mono text-xs font-semibold text-[var(--accent)]">
              [NEW STATEMENTS]
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Submit Unindexed Q&amp;As
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-serif leading-relaxed">
              Found a birthday tweet from 2014, a convention live Q&amp;A, or an interview excerpt not yet present in our archive? Send the entries and source if possible.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
            <div className="font-mono text-xs font-semibold text-[var(--verified-text)]">
              [PRIMARY CITATIONS]
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Verify Unverified Entries
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-serif leading-relaxed">
              Many fan-translated Q&amp;As lack their original Japanese source URL. If you locate Tappei Nagatsuki&apos;s original tweet or an official permalink, let us know so we can mark it Verified.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
            <div className="font-mono text-xs font-semibold text-[var(--text-main)]">
              [CORRECTIONS]
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Correct Typos &amp; Mistranslations
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-serif leading-relaxed">
              Spotted a misspelled character name, an inaccurate translation nuance, an erroneous story arc classification, or a misplaced topic tag? Submit a quick fix.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
            <div className="font-mono text-xs font-semibold text-[var(--text-muted)]">
              [QUESTIONS &amp; SUGGESTIONS]
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Queries &amp; Tag Suggestions
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-serif leading-relaxed">
              Have a question about how an ambiguous Q&amp;A is categorized, or want to propose a new character tag or topic category? Feel free to open an issue.
            </p>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="space-y-6" aria-labelledby="contributors-heading">
        <div className="space-y-1">
          <h2 id="contributors-heading" className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Contributors
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-mono tracking-wider">
            People who contributed data to Od-Lagna
          </p>
        </div>

        <div className="space-y-3">
          {contributors.map((c, index) => {
            const initials = getInitials(c.username);
            return (
              <div
                key={`${c.username}-${index}`}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs group"
              >
                {/* Left: Avatar + Username + Platform */}
                <div className="flex items-center gap-3 shrink-0 md:w-56 lg:w-64">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-[var(--text-main)] font-mono hover:text-[var(--accent)] hover:underline inline-flex items-center gap-1 group/link truncate"
                        >
                          <span className="truncate">{c.username}</span>
                          <span className="text-[10px] text-[var(--text-muted)] group-hover/link:text-[var(--accent)] font-sans shrink-0">
                            ↗
                          </span>
                        </a>
                      ) : (
                        <h3 className="text-sm font-bold text-[var(--text-main)] font-mono truncate">
                          {c.username}
                        </h3>
                      )}
                    </div>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {c.platform}
                    </span>
                  </div>
                </div>

                {/* Middle: Short Description */}
                <p className="text-xs sm:text-[13px] text-[var(--text-muted)] font-serif leading-relaxed flex-1">
                  {c.description}
                </p>

                {/* Right: Contribution (optional) */}
                {c.contribution ? (
                  <div className="pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-[var(--border-subtle)] md:pl-4 shrink-0 md:w-48 lg:w-56 text-xs flex md:flex-col justify-between md:justify-center items-center md:items-start gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                      Contribution:
                    </span>
                    <span className="font-mono text-xs font-semibold text-[var(--text-main)] leading-tight text-right md:text-left">
                      {c.contribution}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Copyable Issue Templates Section */}
      <section className="space-y-6" aria-labelledby="templates-heading">
        <div className="space-y-1">
          <h2 id="templates-heading" className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Issue Templates
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-serif">
            Copy the appropriate template below, fill in your details, and paste it directly into a new GitHub Issue.
          </p>
        </div>

        <ContributionTemplates />
      </section>

      {/* For Developers & Direct PRs */}
      <section className="p-6 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
            For Developers
          </span>
        </div>
        <h2 className="text-lg font-bold text-[var(--text-main)]">
          Prefer Submitting a Pull Request?
        </h2>
        <p className="text-sm text-[var(--text-muted)] font-serif leading-relaxed">
          If you prefer working directly with code, you can clone or fork the repository, use the local admin tool with <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-main)]">npm run admin</code> to add or edit entries in <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-main)]">content/qna/</code>, validate with <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-main)]">npm run build</code>, and open a pull request on GitHub.
        </p>
        <div className="pt-2">
          <a
            href="https://github.com/PixelStarForge/Od-Lagna"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>View GitHub Repository</span>
            <span>↗</span>
          </a>
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
        <Link
          href="/about"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          ← About Od-Lagna
        </Link>
        <Link
          href="/browse"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
        >
          Browse the Archive →
        </Link>
      </div>
    </div>
  );
}
