import fs from "node:fs";
import path from "node:path";
import { QnaEntry, ArcConfig, IfRouteConfig, qnaEntrySchema } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CONFIG_DIR = path.join(CONTENT_DIR, "config");
const QNA_DIR = path.join(CONTENT_DIR, "qna");

export interface ArcMetadata {
  slug: string;
  name: string;
  type: "canon" | "if" | "general";
  order?: number;
  divergesFrom?: string | null;
}

export interface ContentStats {
  totalCount: number;
  verifiedCount: number;
  arcCounts: Record<string, number>;
}

export function getAllArcs(): ArcConfig[] {
  const file = path.join(CONFIG_DIR, "arcs.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as ArcConfig[];
  } catch {
    return [];
  }
}

export function getAllIfRoutes(): IfRouteConfig[] {
  const file = path.join(CONFIG_DIR, "if-routes.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as IfRouteConfig[];
  } catch {
    return [];
  }
}

export function getArcMetadata(slug: string): ArcMetadata {
  if (slug === "general") {
    return {
      slug: "general",
      name: "General / No Story Spoilers",
      type: "general",
    };
  }

  const canonArcs = getAllArcs();
  const canon = canonArcs.find((a) => a.slug === slug);
  if (canon) {
    return {
      slug: canon.slug,
      name: canon.name,
      type: "canon",
      order: canon.order,
    };
  }

  const ifRoutes = getAllIfRoutes();
  const ifRoute = ifRoutes.find((r) => r.slug === slug);
  if (ifRoute) {
    return {
      slug: ifRoute.slug,
      name: ifRoute.name,
      type: "if",
      divergesFrom: ifRoute.divergesFrom,
    };
  }

  return {
    slug,
    name: slug,
    type: "general",
  };
}

export function getAllCharacters(): string[] {
  const file = path.join(CONFIG_DIR, "characters.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as string[];
  } catch {
    return [];
  }
}

export function getAllTopics(): string[] {
  const file = path.join(CONFIG_DIR, "topics.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as string[];
  } catch {
    return [];
  }
}

export function getAllQnas(): QnaEntry[] {
  if (!fs.existsSync(QNA_DIR)) {
    return [];
  }

  const files = fs.readdirSync(QNA_DIR);
  const qnaEntries: QnaEntry[] = [];

  // Exclude test/example files prefixed with _ and non-json files
  const validFiles = files.filter(
    (file) => file.endsWith(".json") && !file.startsWith("_")
  );

  for (const file of validFiles) {
    const fullPath = path.join(QNA_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = JSON.parse(raw);
      const validated = qnaEntrySchema.parse(parsed);
      qnaEntries.push(validated);
    } catch (err) {
      console.error(`Failed to load QnA file: ${file}`, err);
    }
  }

  return qnaEntries;
}

export function getContentStats(): ContentStats {
  const entries = getAllQnas();
  const totalCount = entries.length;
  const verifiedCount = entries.filter((e) => e.verified).length;
  const arcCounts: Record<string, number> = {};

  for (const entry of entries) {
    arcCounts[entry.arc] = (arcCounts[entry.arc] || 0) + 1;
  }

  return {
    totalCount,
    verifiedCount,
    arcCounts,
  };
}
