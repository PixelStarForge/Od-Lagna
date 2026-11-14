import { z } from "zod";

export const starSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  bayer: z.string().min(1),
  constellationId: z.string().min(2),
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
  magnitude: z.number(),
  spectralClass: z.string().min(1),
  distanceLy: z.number().positive(),
});

export type StarRecord = z.infer<typeof starSchema>;

export const constellationSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(1),
  englishName: z.string().min(1),
  family: z.string().min(1),
  lines: z.array(z.tuple([z.string(), z.string()])),
});

export type ConstellationRecord = z.infer<typeof constellationSchema>;

export const characterStarSchema = z.object({
  characterId: z.string().min(1),
  characterName: z.string().min(1),
  starId: z.string().min(1),
  starName: z.string().min(1),
  constellationId: z.string().min(2),
  arc: z.string().min(1),
  affiliation: z.string().min(1),
  loreTitle: z.string().min(1),
  loreDescription: z.string().min(1),
  characterPageUrl: z.string().min(1),
});

export type CharacterStarRecord = z.infer<typeof characterStarSchema>;

