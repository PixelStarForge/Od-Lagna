import { Metadata } from "next";
import Link from "next/link";
import { getReadingGuide } from "../../lib/content-loader";
import { PostAnimeGuide } from "../../components/PostAnimeGuide";

export const metadata: Metadata = {
  title: "Post-Anime Reading Guide — Where to Continue in WN & LN | Od-Lagna",
  description:
    "Finished the Re:Zero anime? Complete guide on Web Novel (WN) vs Light Novel (LN), exact starting volumes and chapters after each season.",
  openGraph: {
    title: "Post-Anime Reading Guide — Od-Lagna",
    description:
      "A complete guide for anime viewers transitioning to the Re:Zero novels: WN vs LN terminologies, and where to start after Seasons 1–4.",
    type: "website",
    url: "/guide",
  },
  twitter: {
    card: "summary_large_image",
    title: "Post-Anime Reading Guide — Od-Lagna",
    description:
      "A complete guide for anime viewers transitioning to the Re:Zero novels: WN vs LN terminologies, and where to start after Seasons 1–4.",
  },
};

export default function GuidePage() {
  const guide = getReadingGuide();

  if (!guide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">
          Reading Guide Unavailable
        </h1>
        <p className="text-[var(--text-muted)]">
          The reading guide content is currently being loaded or updated.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-[var(--accent-solid)] text-white font-medium text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">Reading Guide</span>
      </nav>

      {/* Main Guide Component */}
      <PostAnimeGuide guide={guide} />
    </div>
  );
}
