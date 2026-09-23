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
  entry: Pick<QnaEntry, "source" | "sources">
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
