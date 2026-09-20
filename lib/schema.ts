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

export const qnaEntrySchema = z.object({
  id: z.string().min(1, "ID is required"),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  characters: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  // arc is validated dynamically against arcs.json, if-routes.json, and "general" in validator
  arc: z.string().min(1, "Arc is required"),
  source: qnaSourceSchema,
  verified: z.boolean(),
  dateTime: z.string().optional(),
  date: z.string().optional(),
});

export type QnaEntry = z.infer<typeof qnaEntrySchema>;
export type QnaSource = z.infer<typeof qnaSourceSchema>;

export interface ArcConfig {
  slug: string;
  order: number;
  name: string;
}

export interface IfRouteConfig {
  slug: string;
  name: string;
  divergesFrom: string | null;
}
