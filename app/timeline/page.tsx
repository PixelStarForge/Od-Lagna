import { Metadata } from "next";
import Link from "next/link";
import { getTimelineData } from "../../lib/content-loader";
import { TimelineClient } from "../../components/TimelineClient";

export const metadata: Metadata = {
  title: "World Timeline — Complete Historical Chronology of Re:Zero | Od-Lagna",
  description:
    "Explore the complete chronological history of the Re:Zero world across 6 eras: Ancient Era, Witch Era, Great Calamity, Mystery Era, Old Era, and Modern Era with interactive zoom and canonical milestones.",
  openGraph: {
    title: "World Timeline — Od-Lagna",
    description:
      "Interactive chronological timeline of the Re:Zero world spanning centuries of lore across 6 eras with semantic importance zoom.",
    type: "website",
    url: "/timeline",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Timeline — Od-Lagna",
    description:
      "Interactive chronological timeline of the Re:Zero world spanning centuries of lore across 6 eras with semantic importance zoom.",
  },
};

export default function TimelinePage() {
  const { eras, events } = getTimelineData();

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--text-main)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold" aria-current="page">
          Timeline
        </span>
      </nav>

      {/* Main Interactive Timeline Client */}
      <TimelineClient eras={eras} events={events} />
    </div>
  );
}
