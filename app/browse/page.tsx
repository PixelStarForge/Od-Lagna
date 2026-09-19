import { Suspense } from "react";
import {
  getAllQnas,
  getAllArcs,
  getAllIfRoutes,
  getAllCharacters,
  getAllTopics,
} from "../../lib/content-loader";
import { BrowseClient } from "../../components/BrowseClient";

export const metadata = {
  title: "Browse Archive — Od-Lagna",
  description:
    "Filter and search every Re:Zero author Q&A by arc, IF route, character, and topic with spoiler protection.",
};

export default function BrowsePage() {
  const allQnas = getAllQnas();
  const arcs = getAllArcs();
  const ifRoutes = getAllIfRoutes();
  const characters = getAllCharacters();
  const topics = getAllTopics();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-sm text-[var(--text-faint)] font-mono">
          Loading archive index...
        </div>
      }
    >
      <BrowseClient
        allQnas={allQnas}
        arcs={arcs}
        ifRoutes={ifRoutes}
        characters={characters}
        topics={topics}
      />
    </Suspense>
  );
}
