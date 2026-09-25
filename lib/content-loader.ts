import fs from "node:fs";
import path from "node:path";
import {
  QnaEntry,
  ArcConfig,
  IfRouteConfig,
  SupplementEntry,
  StoryDetail,
  qnaEntrySchema,
  Contributor,
  contributorSchema,
  TriviaEntry,
  triviaEntrySchema,
  ArchiveEntry,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CONFIG_DIR = path.join(CONTENT_DIR, "config");
const QNA_DIR = path.join(CONTENT_DIR, "qna");
const CONTENT_TRIVIA_DIR = path.join(CONTENT_DIR, "trivia");

export interface ArcMetadata {
  slug: string;
  name: string;
  type: "canon" | "if" | "side-story" | "general";
  order?: number;
  divergesFrom?: string | null;
  timeline?: string | null;
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
  const file = path.join(CONFIG_DIR, "stories.json");
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
      type: ifRoute.type === "side-story" ? "side-story" : "if",
      divergesFrom: ifRoute.divergesFrom,
      timeline: ifRoute.timeline,
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

export function getAllContributors(): Contributor[] {
  const file = path.join(CONFIG_DIR, "contributors.json");
  if (!fs.existsSync(file)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as unknown[];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => contributorSchema.safeParse(item))
      .filter((res): res is { success: true; data: Contributor } => res.success)
      .map((res) => res.data);
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
  const entries = getAllArchiveEntries();
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

export function getIfStories(): IfRouteConfig[] {
  return getAllIfRoutes().filter((r) => (r.type ?? "if") === "if");
}

export function getSideStories(): IfRouteConfig[] {
  return getAllIfRoutes().filter((r) => r.type === "side-story");
}

export function getStory(slug: string): IfRouteConfig | null {
  return getAllIfRoutes().find((r) => r.slug === slug) ?? null;
}

export function getSupplements(slug: string): SupplementEntry[] {
  const file = path.join(CONTENT_DIR, "supplements", `${slug}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as SupplementEntry[];
  } catch {
    return [];
  }
}

export function getStoryDetail(slug: string): StoryDetail | null {
  const story = getStory(slug);
  if (!story) return null;
  return { ...story, supplements: getSupplements(slug) };
}

export function getAllTrivia(): TriviaEntry[] {
  if (!fs.existsSync(CONTENT_TRIVIA_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_TRIVIA_DIR);
  const triviaEntries: TriviaEntry[] = [];

  const validFiles = files.filter(
    (file) => file.endsWith(".json") && !file.startsWith("_")
  );

  for (const file of validFiles) {
    const fullPath = path.join(CONTENT_TRIVIA_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = JSON.parse(raw);
      const validated = triviaEntrySchema.parse(parsed);
      triviaEntries.push(validated);
    } catch (e) {
      console.warn(`[content-loader] Skipping invalid trivia file ${file}:`, e);
    }
  }

  // Sort by ID ascending (e.g. TR-0001, TR-0002)
  triviaEntries.sort((a, b) => a.id.localeCompare(b.id));

  return triviaEntries;
}

export function getTriviaById(id: string): TriviaEntry | null {
  if (!fs.existsSync(CONTENT_TRIVIA_DIR)) {
    return null;
  }
  const file = path.join(CONTENT_TRIVIA_DIR, `${id}.trivia.json`);
  if (!fs.existsSync(file)) {
    const directFile = path.join(CONTENT_TRIVIA_DIR, `${id}.json`);
    if (!fs.existsSync(directFile)) return null;
    try {
      const raw = fs.readFileSync(directFile, "utf-8");
      return triviaEntrySchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return triviaEntrySchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getAllArchiveEntries(): ArchiveEntry[] {
  const qnas: ArchiveEntry[] = getAllQnas().map((q) => ({
    entryType: "qna" as const,
    ...q,
  }));
  const trivias: ArchiveEntry[] = getAllTrivia().map((t) => ({
    entryType: "trivia" as const,
    ...t,
  }));

  return [...qnas, ...trivias];
}

