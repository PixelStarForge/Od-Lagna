import { Suspense } from "react";
import { getAllAnimeComments, getAnimeCatalog } from "../../../lib/anime-loader";
import { getAllCharacters, getAllTopics } from "../../../lib/content-loader";
import { AnimeBrowseClient } from "../../../components/AnimeBrowseClient";

export const metadata = {
  title: "Browse Anime Commentary — Od-Lagna",
  description:
    "Search and filter every author broadcast live-tweet and episode commentary across all Re:Zero seasons, OVAs, characters, and topics.",
};

export default function AnimeBrowsePage() {
  const allComments = getAllAnimeComments();
  const seasons = getAnimeCatalog();
  const characters = getAllCharacters();
  const topics = getAllTopics();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading anime commentary archive...
        </div>
      }
    >
      <AnimeBrowseClient
        allComments={allComments}
        seasons={seasons}
        characters={characters}
        topics={topics}
      />
    </Suspense>
  );
}
