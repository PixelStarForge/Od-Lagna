import { z } from "zod";

/**
 * Zod is used here strictly as a build-time and development validation tool
 * to enforce schema integrity on static Q&A JSON files in content/qna/.
 * It prevents malformed data from ever entering the static build.
 */
export const qnaSourceSchema = z.object({
  type: z.enum(["url", "text"], {
    message: "Source type must be either 'url' or 'text'",
  }),
  value: z.string().optional(),
});

export const qnaEntrySchema = z
  .object({
    id: z.string().min(1, "ID is required"),
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
    characters: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    // arc is validated dynamically against arcs.json, stories.json, and "general" in validator
    arc: z.string().min(1, "Arc is required"),
    source: z.union([qnaSourceSchema, z.array(qnaSourceSchema)]).optional(),
    sources: z.array(qnaSourceSchema).optional(),
    verified: z.boolean(),
    dateTime: z.string().optional(),
    date: z.string().optional(),
  })
  .refine(
    (data) =>
      data.source !== undefined ||
      (Array.isArray(data.sources) && data.sources.length > 0),
    {
      message: "Either 'source' or 'sources' is required",
      path: ["source"],
    }
  );

export type QnaEntry = z.infer<typeof qnaEntrySchema>;
export type QnaSource = z.infer<typeof qnaSourceSchema>;

/**
 * Returns a normalized array of sources from a QnaEntry,
 * supporting single object 'source', array 'source', or array 'sources'.
 */
export function getEntrySources(
  entry:
    | Pick<QnaEntry, "source" | "sources">
    | Pick<TriviaEntry, "source" | "sources">
): QnaSource[] {
  if (Array.isArray(entry.sources) && entry.sources.length > 0) {
    return entry.sources;
  }
  if (Array.isArray(entry.source)) {
    return entry.source;
  }
  if (entry.source) {
    return [entry.source];
  }
  return [];
}

export interface ArcConfig {
  slug: string;
  order: number;
  name: string;
}

export interface IfRouteConfig {
  slug: string;
  name: string;
  divergesFrom?: string | null;
  timeline?: string | null;
  type?: "if" | "side-story";
  description?: string;
  datePublished?: string;
}

export interface SupplementEntry {
  id: string;
  title: string;
  content: string;
  source: { type: "url" | "text"; value?: string };
  date?: string;
}

export interface StoryDetail extends IfRouteConfig {
  supplements: SupplementEntry[];
}

export const contributorSchema = z.object({
  username: z.string().min(1, "Username is required"),
  platform: z.string().min(1, "Platform is required"),
  url: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  contribution: z.string().optional(),
  avatar: z.string().optional(),
});

export type Contributor = z.infer<typeof contributorSchema>;

export const triviaEntrySchema = z
  .object({
    id: z.string().regex(/^TR-\d{4,}$/, "ID must follow TR-XXXX format (e.g. TR-0001)"),
    title: z.string().optional(),
    text: z.string().min(1, "Trivia/Comment text is required"),
    arc: z.string().min(1, "Arc is required"),
    characters: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    source: z.union([qnaSourceSchema, z.array(qnaSourceSchema)]).optional(),
    sources: z.array(qnaSourceSchema).optional(),
    verified: z.boolean(),
    dateTime: z.string().optional(),
    date: z.string().optional(),
  })
  .refine(
    (data) =>
      data.source !== undefined ||
      (Array.isArray(data.sources) && data.sources.length > 0),
    {
      message: "Either 'source' or 'sources' is required",
      path: ["source"],
    }
  );

export type TriviaEntry = z.infer<typeof triviaEntrySchema>;

export type ArchiveEntry =
  | ({ entryType: "qna" } & QnaEntry)
  | ({ entryType: "trivia" } & TriviaEntry);

export const characterLoreItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  arc: z.string().min(1, "Arc is required"),
});

export type CharacterLoreItem = z.infer<typeof characterLoreItemSchema>;

export const characterSchema = z
  .object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required"),
    arc: z.string().min(1, "Arc is required"),
    japaneseName: z.string().optional(),
    aliases: z.array(characterLoreItemSchema).default([]),
    gender: z.string().optional(),
    birthday: z.string().optional(),
    age: z.string().optional(),
    race: z.string().optional(),
    affiliation: z.array(z.string()).default([]),
    description: z.string().min(1, "Description is required"),
    link: z.string().url("Must be a valid URL").optional(),
    divineProtections: z.array(characterLoreItemSchema).optional(),
    authorities: z.array(characterLoreItemSchema).optional(),
  })
  .refine(
    (data) => {
      const hasDp = Array.isArray(data.divineProtections) && data.divineProtections.length > 0;
      const hasAuth = Array.isArray(data.authorities) && data.authorities.length > 0;
      return !(hasDp && hasAuth);
    },
    {
      message: "A character cannot possess both Divine Protections and Authorities at the same time.",
      path: ["divineProtections"],
    }
  );

export type CharacterDetail = z.infer<typeof characterSchema>;

export const animeCatalogEntrySchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  japaneseTitle: z.string().optional(),
  type: z.enum(["season", "ova", "break-time"]),
  order: z.number().int().positive(),
  seasonNumber: z.number().int().positive().optional(),
  arcs: z.array(z.string()).default([]),
  episodesCount: z.number().int().nonnegative().nullable().optional(),
  year: z.string().min(1, "Year is required"),
  status: z.enum(["completed", "in-progress", "announced", "planned"]),
  synopsis: z.string().min(1, "Synopsis is required"),
  duration: z.string().optional(),
  timeline: z.string().optional(),
  studio: z.string().optional(),
  broadcast: z.string().optional(),
});

export type AnimeCatalogEntry = z.infer<typeof animeCatalogEntrySchema>;

export const authorCommentSchema = z.object({
  id: z.number().int().positive(),
  text: z.string().min(1, "Comment text is required"),
  source: z.string().optional().default(""),
  characters: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
});

export type AuthorComment = z.infer<typeof authorCommentSchema>;

export const episodeCommentarySchema = z.object({
  id: z.string().min(1, "ID is required"),
  seasonId: z.string().min(1, "Season ID is required"),
  episodeNumber: z.number().int().nonnegative(),
  title: z.object({
    en: z.string().min(1, "English title is required"),
    jp: z.string().optional(),
  }),
  airDate: z.string().optional().default(""),
  translationSource: z
    .object({
      type: z.enum(["reddit", "url", "text"]),
      name: z.string().optional(),
      url: z.string().url("Must be a valid URL"),
    })
    .optional(),
  comments: z.array(authorCommentSchema).default([]),
});

export type EpisodeCommentary = z.infer<typeof episodeCommentarySchema>;

export interface FlatAnimeComment extends AuthorComment {
  seasonId: string;
  seasonTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  airDate?: string;
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


