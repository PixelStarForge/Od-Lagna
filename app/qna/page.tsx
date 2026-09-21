import { Suspense } from "react";
import { getAllQnas } from "../../lib/content-loader";
import { QnaDetailClient } from "./QnaDetailClient";

export const metadata = {
  title: "Q&A Detail — Od-Lagna",
  description: "View full details and recommendations for this Re:Zero author Q&A statement.",
};

export default function QnaPage() {
  const allQnas = getAllQnas();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-12 text-sm text-[var(--text-muted)] font-mono">
          Loading Q&amp;A statement...
        </div>
      }
    >
      <QnaDetailClient allQnas={allQnas} />
    </Suspense>
  );
}
