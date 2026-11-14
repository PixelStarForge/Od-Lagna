import fs from "node:fs";
import path from "node:path";
import {
  starSchema,
  constellationSchema,
  characterStarSchema,
  type StarRecord,
  type ConstellationRecord,
  type CharacterStarRecord,
} from "./constellation-schema";

const CONSTELLATIONS_DIR = path.join(process.cwd(), "content", "constellations");

export function getAllStars(): StarRecord[] {
  const file = path.join(CONSTELLATIONS_DIR, "stars.json");
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return raw.map((item: unknown) => starSchema.parse(item));
}

export function getAllConstellations(): ConstellationRecord[] {
  const file = path.join(CONSTELLATIONS_DIR, "constellations.json");
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return raw.map((item: unknown) => constellationSchema.parse(item));
}

export function getAllCharacterStars(): CharacterStarRecord[] {
  const file = path.join(CONSTELLATIONS_DIR, "character-stars.json");
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return raw.map((item: unknown) => characterStarSchema.parse(item));
}

