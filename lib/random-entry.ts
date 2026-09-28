import { isArcSpoiler } from "./arc-utils";
import { fetchSearchIndex } from "./search-index";

export async function getRandomEntryId(
  spoilerArc: number,
  allowedIfRoutes: string[]
): Promise<string | null> {
  try {
    const payload = await fetchSearchIndex();
    const eligible = (payload.records || []).filter(
      (r) => !isArcSpoiler(r.arc, spoilerArc, allowedIfRoutes)
    );

    if (eligible.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * eligible.length);
    return eligible[randomIndex].id;
  } catch {
    return null;
  }
}

