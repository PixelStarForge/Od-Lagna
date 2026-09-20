import Link from "next/link";

export const metadata = {
  title: "404 — Record Not Found | Od-Lagna",
  description: "The requested archive record could not be found in Od-Lagna.",
};

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Thematic Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent)] shadow-xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Header Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            <span>404</span>
            <span>•</span>
            <span>Record Not Found</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Lost in the Memories
          </h1>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
            The requested statement, question, or story timeline cannot be located in Od-Lagna. It may have been moved, renamed, or never indexed.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs text-center"
          >
            Return to Home
          </Link>
          <Link
            href="/browse"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors text-center"
          >
            Browse Q&amp;A Archive
          </Link>
        </div>

        {/* Quick Search Shortcut Tip */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-mono">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold">/</kbd> anywhere to search all indexed Q&amp;As.
          </p>
        </div>
      </div>
    </main>
  );
}
