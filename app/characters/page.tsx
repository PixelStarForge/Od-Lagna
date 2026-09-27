import { Suspense } from "react";
import {
  getAllCharacterCatalogItems,
  getAllArcs,
  getAllIfRoutes,
  getAllQnas,
  getAllTrivia,
} from "../../lib/content-loader";
import { CharactersClient } from "../../components/CharactersClient";

export const metadata = {
  title: "Characters — Od-Lagna",
  description:
    "Explore Re:Zero characters, their canon debut arcs, and all associated author Q&As and trivia statements.",
};

export default function CharactersPage() {
  const catalog = getAllCharacterCatalogItems();
  const arcs = getAllArcs();
  const ifRoutes = getAllIfRoutes();
  const allQnas = getAllQnas();
  const allTrivia = getAllTrivia();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading character database...
        </div>
      }
    >
      <CharactersClient
        catalog={catalog}
        arcs={arcs}
        ifRoutes={ifRoutes}
        allQnas={allQnas}
        allTrivia={allTrivia}
      />
    </Suspense>
  );
}
