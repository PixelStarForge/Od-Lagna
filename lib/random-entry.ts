import { isArcSpoiler } from "./arc-utils";
import { SearchIndexRecord, SearchIndexPayload } from "./search-index";

let cachedRecords: SearchIndexRecord[] | null = null;
let fetchPromise: Promise<SearchIndexRecord[]> | null = null;

export async function getRandomEntryId(
  spoilerArc: number,
  allowedIfRoutes: string[]
): Promise<string | null> {
  if (!cachedRecords) {
    if (!fetchPromise) {
      fetchPromise = fetch("/search-index.json")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load search index");
          return res.json();
        })
        .then((payload: SearchIndexPayload | SearchIndexRecord[]) => {
          if (Array.isArray(payload)) {
            cachedRecords = payload;
          } else {
            cachedRecords = payload.records || [];
          }
          return cachedRecords;
        })
        .catch(() => {
          fetchPromise = null;
          return [];
        });
    }
    await fetchPromise;
  }

  const eligible = (cachedRecords || []).filter(
    (r) => !isArcSpoiler(r.arc, spoilerArc, allowedIfRoutes)
  );

  if (eligible.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex].id;
}
