import { Suspense } from "react";
import { getAllQnas, getAllTrivia } from "../../lib/content-loader";
import { SavedClient } from "../../components/SavedClient";

export const metadata = {
  title: "Saved Lore & Bookmarks — Od-Lagna",
  description:
    "Your private, locally saved Re:Zero author Q&A and trivia statements with instant filtering, spoiler protection, export, and cross-device sharing.",
};

export default function SavedPage() {
  const allQnas = getAllQnas();
  const allTrivia = getAllTrivia();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading saved bookmarks...
        </div>
      }
    >
      <SavedClient allQnas={allQnas} allTrivia={allTrivia} />
    </Suspense>
  );
}
