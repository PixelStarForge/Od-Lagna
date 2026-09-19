import fs from "node:fs";
import path from "node:path";
import { qnaEntrySchema, ArcConfig, IfRouteConfig } from "../lib/schema";

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_CONFIG_DIR = path.join(ROOT_DIR, "content", "config");
const CONTENT_QNA_DIR = path.join(ROOT_DIR, "content", "qna");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

export interface SearchIndexRecord {
  id: string;
  question: string;
  answerSnippet: string;
  answerSearchText: string;
  characters: string[];
  topics: string[];
  arc: string;
  arcName: string;
  verified: boolean;
}

export interface SearchIndexPayload {
  records: SearchIndexRecord[];
  characters: string[];
  topics: string[];
}

function getArcNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  map.set("general", "General / No Story Spoilers");

  const arcsFile = path.join(CONTENT_CONFIG_DIR, "arcs.json");
  if (fs.existsSync(arcsFile)) {
    const arcs: ArcConfig[] = JSON.parse(fs.readFileSync(arcsFile, "utf-8"));
    for (const a of arcs) {
      map.set(a.slug, `Arc ${a.order}: ${a.name}`);
    }
  }

  const ifRoutesFile = path.join(CONTENT_CONFIG_DIR, "if-routes.json");
  if (fs.existsSync(ifRoutesFile)) {
    const ifRoutes: IfRouteConfig[] = JSON.parse(fs.readFileSync(ifRoutesFile, "utf-8"));
    for (const r of ifRoutes) {
      map.set(r.slug, r.name);
    }
  }

  return map;
}

function getRegisteredTags(): { characters: string[]; topics: string[] } {
  const charsFile = path.join(CONTENT_CONFIG_DIR, "characters.json");
  const topicsFile = path.join(CONTENT_CONFIG_DIR, "topics.json");

  const characters: string[] = fs.existsSync(charsFile) ? JSON.parse(fs.readFileSync(charsFile, "utf-8")) : [];
  const topics: string[] = fs.existsSync(topicsFile) ? JSON.parse(fs.readFileSync(topicsFile, "utf-8")) : [];

  return { characters, topics };
}

export function buildSearchIndex(): SearchIndexPayload {
  const records: SearchIndexRecord[] = [];
  const arcMap = getArcNameMap();
  const { characters: configChars, topics: configTopics } = getRegisteredTags();

  const characterSet = new Set<string>(configChars);
  const topicSet = new Set<string>(configTopics);

  if (fs.existsSync(CONTENT_QNA_DIR)) {
    const files = fs.readdirSync(CONTENT_QNA_DIR);
    const validFiles = files.filter(
      (file) => file.endsWith(".json") && !file.startsWith("_")
    );

    for (const file of validFiles) {
      const fullPath = path.join(CONTENT_QNA_DIR, file);
      try {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(raw);
        const entry = qnaEntrySchema.parse(parsed);

        const cleanAnswer = entry.answer.replace(/\s+/g, " ").trim();
        const snippet =
          cleanAnswer.length > 200
            ? cleanAnswer.slice(0, 197) + "..."
            : cleanAnswer;

        entry.characters.forEach((c) => characterSet.add(c));
        entry.topics.forEach((t) => topicSet.add(t));

        records.push({
          id: entry.id,
          question: entry.question,
          answerSnippet: snippet,
          answerSearchText: cleanAnswer,
          characters: entry.characters,
          topics: entry.topics,
          arc: entry.arc,
          arcName: arcMap.get(entry.arc) || entry.arc,
          verified: entry.verified,
        });
      } catch (err) {
        console.error(`Error indexing file ${file}:`, err);
      }
    }
  }

  return {
    records,
    characters: Array.from(characterSet).sort(),
    topics: Array.from(topicSet).sort(),
  };
}

function run() {
  console.log("Generating comprehensive search index for Fuse.js...");
  const payload = buildSearchIndex();

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const outputPath = path.join(PUBLIC_DIR, "search-index.json");
  fs.writeFileSync(outputPath, JSON.stringify(payload), "utf-8");

  const stat = fs.statSync(outputPath);
  console.log(
    `✓ Search index written to public/search-index.json (${payload.records.length} records, ${payload.characters.length} characters, ${payload.topics.length} topics, ${(stat.size / 1024).toFixed(2)} KB)`
  );
}

if (require.main === module) {
  run();
}
