import fs from "node:fs";
import path from "node:path";
import {
  AnimeCatalogEntry,
  AuthorComment,
  EpisodeCommentary,
} from "./schema";

export type { AnimeCatalogEntry, AuthorComment, EpisodeCommentary };

const CONTENT_DIR = path.join(process.cwd(), "content");
const ANIME_DIR = path.join(CONTENT_DIR, "anime");
const CONFIG_FILE = path.join(ANIME_DIR, "config.json");

// In-memory module cache for high-performance static builds and server components
let cachedAnimeCatalog: AnimeCatalogEntry[] | null = null;
const cachedSeasonEpisodes = new Map<string, EpisodeCommentary[]>();
const cachedEpisodeCommentaries = new Map<string, EpisodeCommentary | null>();
let cachedAnimeStats: {
  seasonsCount: number;
  breakTimeCount: number;
  ovasCount: number;
  totalCatalogedEpisodes: number;
  totalComments: number;
} | null = null;
let cachedEpisodeParams: { season: string; episode: string }[] | null = null;

/**
 * Clears in-memory anime cache. Useful in tests and local watch/rebuild scenarios.
 */
export function clearAnimeCache(): void {
  cachedAnimeCatalog = null;
  cachedSeasonEpisodes.clear();
  cachedEpisodeCommentaries.clear();
  cachedAnimeStats = null;
  cachedEpisodeParams = null;
}

/**
 * Returns a human-friendly badge label for a season or release.
 * e.g., "Season 01", "Director's Cut", "Season 02", "Break Time S1", "Re:Petit", etc.
 */
export function getSeasonBadgeLabel(season: AnimeCatalogEntry): string {
  if (season.id === "re-petit") return "Re:Petit";
  if (season.type === "break-time") {
    if (season.seasonNumber) return `Break Time S${season.seasonNumber}`;
    return "Break Time";
  }
  if (season.type === "ova") return "Canon OVA";
  if (season.id === "season-1-dc") return "Director's Cut";
  if (typeof season.seasonNumber === "number") {
    return `Season 0${season.seasonNumber}`;
  }
  const match = season.id.match(/^season-(\d+)$/);
  if (match) {
    return `Season 0${match[1]}`;
  }
  return `Season 0${season.order}`;
}

/**
 * Returns all anime catalog entries (seasons, OVAs, shorts) sorted by order.
 * Results are cached in-memory after first read.
 */
export function getAnimeCatalog(): AnimeCatalogEntry[] {
  if (cachedAnimeCatalog) {
    return cachedAnimeCatalog;
  }

  if (!fs.existsSync(CONFIG_FILE)) return [];
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const data = JSON.parse(raw) as AnimeCatalogEntry[];
    cachedAnimeCatalog = data.sort((a, b) => a.order - b.order);
    return cachedAnimeCatalog;
  } catch (err) {
    console.error("Failed to read anime config:", err);
    return [];
  }
}

/**
 * Returns a specific season or OVA entry by its ID.
 * Supports exact match with case-insensitive fallback.
 */
export function getAnimeSeason(id: string): AnimeCatalogEntry | null {
  if (!id) return null;
  const catalog = getAnimeCatalog();
  const normalizedId = id.trim().toLowerCase();
  return (
    catalog.find(
      (entry) => entry.id === id || entry.id.toLowerCase() === normalizedId
    ) || null
  );
}

/**
 * Reads all cataloged episode commentary files for a given season,
 * sorted by episode number.
 * Results are cached in-memory and prewarms individual episode commentary caches.
 */
export function getSeasonEpisodes(seasonId: string): EpisodeCommentary[] {
  if (!seasonId) return [];
  if (cachedSeasonEpisodes.has(seasonId)) {
    return cachedSeasonEpisodes.get(seasonId)!;
  }

  const seasonDir = path.join(ANIME_DIR, seasonId);
  if (!fs.existsSync(seasonDir)) {
    cachedSeasonEpisodes.set(seasonId, []);
    return [];
  }

  try {
    const files = fs
      .readdirSync(seasonDir)
      .filter((file) => file.endsWith(".json") && !file.startsWith("_"));
    const episodes: EpisodeCommentary[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(seasonDir, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as EpisodeCommentary;

        // Defensive normalization
        if (Array.isArray(parsed.comments)) {
          parsed.comments = parsed.comments.map((c) => ({
            id: c.id,
            text: c.text,
            source: c.source || (c as unknown as { sourceUrl?: string }).sourceUrl || "",
          }));
        } else {
          parsed.comments = [];
        }

        episodes.push(parsed);

        // Prewarm individual episode cache
        const epKey = `${seasonId}:${parsed.episodeNumber}`;
        cachedEpisodeCommentaries.set(epKey, parsed);
      } catch (err) {
        console.error(`Error parsing episode file ${file}:`, err);
      }
    }

    const sorted = episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    cachedSeasonEpisodes.set(seasonId, sorted);
    return sorted;
  } catch (err) {
    console.error(`Error reading season directory ${seasonId}:`, err);
    return [];
  }
}

/**
 * Normalizes episode number parameter into standard integer string.
 * Strips leading zeros ("01" -> "1").
 */
function normalizeEpisodeKey(episodeNumber: number | string): string {
  const num = Number(episodeNumber);
  if (!isNaN(num) && Number.isInteger(num)) {
    return String(num);
  }
  return String(episodeNumber).trim();
}

/**
 * Retrieves a single episode's commentary file.
 * Handles both number and string types, normalizes leading zeroes ("01" -> "1"),
 * and caches results in-memory.
 */
export function getEpisodeCommentary(
  seasonId: string,
  episodeNumber: number | string
): EpisodeCommentary | null {
  if (!seasonId || episodeNumber === undefined || episodeNumber === null) {
    return null;
  }

  const normalizedEp = normalizeEpisodeKey(episodeNumber);
  const cacheKey = `${seasonId}:${normalizedEp}`;

  if (cachedEpisodeCommentaries.has(cacheKey)) {
    return cachedEpisodeCommentaries.get(cacheKey) || null;
  }

  const filePath = path.join(ANIME_DIR, seasonId, `${normalizedEp}.json`);
  if (!fs.existsSync(filePath)) {
    cachedEpisodeCommentaries.set(cacheKey, null);
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as EpisodeCommentary;

    // Defensive normalization
    if (Array.isArray(parsed.comments)) {
      parsed.comments = parsed.comments.map((c) => ({
        id: c.id,
        text: c.text,
        source: c.source || (c as unknown as { sourceUrl?: string }).sourceUrl || "",
      }));
    } else {
      parsed.comments = [];
    }

    cachedEpisodeCommentaries.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error(`Error reading episode commentary at ${filePath}:`, err);
    cachedEpisodeCommentaries.set(cacheKey, null);
    return null;
  }
}

/**
 * Aggregates summary statistics across all cataloged anime content.
 * Memoized in-memory after first calculation.
 */
export function getAnimeStats() {
  if (cachedAnimeStats) {
    return cachedAnimeStats;
  }

  const catalog = getAnimeCatalog();
  let totalComments = 0;
  let totalCatalogedEpisodes = 0;

  for (const entry of catalog) {
    const episodes = getSeasonEpisodes(entry.id);
    totalCatalogedEpisodes += episodes.length;
    for (const ep of episodes) {
      totalComments += ep.comments?.length || 0;
    }
  }

  const seasonsCount = catalog.filter((c) => c.type === "season").length;
  const breakTimeCount = catalog.filter((c) => c.type === "break-time").length;
  const ovasCount = catalog.filter((c) => c.type === "ova").length;

  cachedAnimeStats = {
    seasonsCount,
    breakTimeCount,
    ovasCount,
    totalCatalogedEpisodes,
    totalComments,
  };

  return cachedAnimeStats;
}

/**
 * Returns all static route parameters for every cataloged episode across all seasons.
 * Cached in-memory to prevent repeated calculations during static builds.
 */
export function getAllEpisodeParams(): { season: string; episode: string }[] {
  if (cachedEpisodeParams) {
    return cachedEpisodeParams;
  }

  const catalog = getAnimeCatalog();
  const params: { season: string; episode: string }[] = [];

  for (const entry of catalog) {
    const episodes = getSeasonEpisodes(entry.id);
    for (const ep of episodes) {
      params.push({
        season: entry.id,
        episode: String(ep.episodeNumber),
      });
    }
  }

  cachedEpisodeParams = params;
  return params;
}
