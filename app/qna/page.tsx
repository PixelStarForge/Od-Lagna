import { Suspense } from "react";
import { getAllQnas, getAllTrivia } from "../../lib/content-loader";
import { QnaDetailClient } from "./QnaDetailClient";

export const metadata = {
  title: "Entry Detail — Od-Lagna",
  description: "View full details and recommendations for this Re:Zero author Q&A or trivia statement.",
};

export default function QnaPage() {
  const allQnas = getAllQnas();
  const allTrivia = getAllTrivia();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-12 text-sm text-[var(--text-muted)] font-mono">
          Loading archive statement...
        </div>
      }
    >
      <QnaDetailClient allQnas={allQnas} allTrivia={allTrivia} />
    </Suspense>
  );
}
