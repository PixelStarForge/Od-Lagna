import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-main)] mt-auto py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xs">
                Ω
              </span>
              <span className="font-bold text-sm text-[var(--text-main)]">
                Od-Lagna Archive
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md">
              A comprehensive, static index of verified author statements, event Q&amp;As, and Twitter lore.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-main)] transition-colors">
              Home
            </Link>
            <Link href="/browse" className="hover:text-[var(--text-main)] transition-colors">
              Browse Q&amp;As
            </Link>
            <a
              href="https://github.com/PixelStarForge/Od-Lagna"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-main)] transition-colors inline-flex items-center gap-1"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[var(--text-faint)]">
          <p>
            Unofficial, non-commercial fan archive. Re:Zero kara Hajimeru Isekai Seikatsu is copyright © Tappei Nagatsuki / KADOKAWA.
          </p>
          <p className="font-mono">
            Od-Lagna Static Export
          </p>
        </div>
      </div>
    </footer>
  );
}
