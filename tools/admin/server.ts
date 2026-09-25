import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { qnaEntrySchema, triviaEntrySchema, ArcConfig, IfRouteConfig, SupplementEntry, QnaEntry, TriviaEntry } from "../../lib/schema";
import { findDuplicates, findTriviaDuplicates, suggestTags, parseQuickPaste, parseTriviaQuickPaste } from "./utils";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4321;
const ROOT_DIR = path.resolve(__dirname, "../..");
const CONTENT_CONFIG_DIR = path.join(ROOT_DIR, "content", "config");
const CONTENT_QNA_DIR = path.join(ROOT_DIR, "content", "qna");
const CONTENT_TRIVIA_DIR = path.join(ROOT_DIR, "content", "trivia");
const CONTENT_SUPPLEMENTS_DIR = path.join(ROOT_DIR, "content", "supplements");

function getNextSequentialId(): string {
  if (!fs.existsSync(CONTENT_QNA_DIR)) {
    fs.mkdirSync(CONTENT_QNA_DIR, { recursive: true });
    return "0001";
  }

  const files = fs.readdirSync(CONTENT_QNA_DIR);
  const ids: number[] = [];

  for (const file of files) {
    if (file.endsWith(".json") && !file.startsWith("_")) {
      const base = file.replace(/\.qna\.json$/, "").replace(/\.json$/, "");
      const num = parseInt(base, 10);
      if (!isNaN(num)) {
        ids.push(num);
      }
    }
  }

  if (ids.length === 0) {
    return "0001";
  }

  const maxId = Math.max(...ids);
  return String(maxId + 1).padStart(4, "0");
}

function getNextTriviaId(): string {
  if (!fs.existsSync(CONTENT_TRIVIA_DIR)) {
    fs.mkdirSync(CONTENT_TRIVIA_DIR, { recursive: true });
    return "TR-0001";
  }

  const files = fs.readdirSync(CONTENT_TRIVIA_DIR);
  const ids: number[] = [];

  for (const file of files) {
    if (file.endsWith(".json") && !file.startsWith("_")) {
      const match = file.match(/^TR-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) ids.push(num);
      }
    }
  }

  if (ids.length === 0) return "TR-0001";
  const maxId = Math.max(...ids);
  return `TR-${String(maxId + 1).padStart(4, "0")}`;
}

function getConfigs() {
  const arcsFile = path.join(CONTENT_CONFIG_DIR, "arcs.json");
  const ifRoutesFile = path.join(CONTENT_CONFIG_DIR, "stories.json");
  const charsFile = path.join(CONTENT_CONFIG_DIR, "characters.json");
  const topicsFile = path.join(CONTENT_CONFIG_DIR, "topics.json");

  const arcs: ArcConfig[] = fs.existsSync(arcsFile) ? JSON.parse(fs.readFileSync(arcsFile, "utf-8")) : [];
  const ifRoutes: IfRouteConfig[] = fs.existsSync(ifRoutesFile) ? JSON.parse(fs.readFileSync(ifRoutesFile, "utf-8")) : [];
  const characters: string[] = fs.existsSync(charsFile) ? JSON.parse(fs.readFileSync(charsFile, "utf-8")) : [];
  const topics: string[] = fs.existsSync(topicsFile) ? JSON.parse(fs.readFileSync(topicsFile, "utf-8")) : [];

  return { arcs, ifRoutes, characters, topics };
}

function getStoriesConfig(): IfRouteConfig[] {
  const file = path.join(CONTENT_CONFIG_DIR, "stories.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function saveStoriesConfig(stories: IfRouteConfig[]) {
  const file = path.join(CONTENT_CONFIG_DIR, "stories.json");
  fs.writeFileSync(file, JSON.stringify(stories, null, 2), "utf-8");
}

function getStorySupplements(slug: string): SupplementEntry[] {
  const file = path.join(CONTENT_SUPPLEMENTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveStorySupplements(slug: string, supplements: SupplementEntry[]) {
  if (!fs.existsSync(CONTENT_SUPPLEMENTS_DIR)) {
    fs.mkdirSync(CONTENT_SUPPLEMENTS_DIR, { recursive: true });
  }
  const file = path.join(CONTENT_SUPPLEMENTS_DIR, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(supplements, null, 2), "utf-8");
}

function updateTagRegistries(newCharacters: string[], newTopics: string[]) {
  const charsFile = path.join(CONTENT_CONFIG_DIR, "characters.json");
  const topicsFile = path.join(CONTENT_CONFIG_DIR, "topics.json");

  const cleanChars = newCharacters.map((s) => s.trim()).filter((s) => s.length >= 2);
  const cleanTopics = newTopics.map((s) => s.trim()).filter((s) => s.length >= 2);

  if (fs.existsSync(charsFile)) {
    const existingChars: string[] = JSON.parse(fs.readFileSync(charsFile, "utf-8"));
    const charSet = new Set([...existingChars, ...cleanChars]);
    const sortedChars = Array.from(charSet).sort();
    fs.writeFileSync(charsFile, JSON.stringify(sortedChars, null, 2), "utf-8");
  }

  if (fs.existsSync(topicsFile)) {
    const existingTopics: string[] = JSON.parse(fs.readFileSync(topicsFile, "utf-8"));
    const topicSet = new Set([...existingTopics, ...cleanTopics]);
    const sortedTopics = Array.from(topicSet).sort();
    fs.writeFileSync(topicsFile, JSON.stringify(sortedTopics, null, 2), "utf-8");
  }
}

function getAllEntriesSummary() {
  if (!fs.existsSync(CONTENT_QNA_DIR)) return [];
  const files = fs.readdirSync(CONTENT_QNA_DIR);
  const validFiles = files.filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  const list = [];
  for (const file of validFiles) {
    try {
      const fullPath = path.join(CONTENT_QNA_DIR, file);
      const data: QnaEntry = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      list.push({
        id: data.id,
        question: data.question,
        arc: data.arc,
        verified: data.verified,
        dateTime: data.dateTime || data.date,
        filename: file,
      });
    } catch {
      // ignore malformed files
    }
  }

  list.sort((a, b) => a.id.localeCompare(b.id));
  return list;
}

function getAllTriviaSummary() {
  if (!fs.existsSync(CONTENT_TRIVIA_DIR)) return [];
  const files = fs.readdirSync(CONTENT_TRIVIA_DIR);
  const validFiles = files.filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  const list = [];
  for (const file of validFiles) {
    try {
      const fullPath = path.join(CONTENT_TRIVIA_DIR, file);
      const data: TriviaEntry = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      list.push({
        id: data.id,
        title: data.title || "",
        text: data.text,
        arc: data.arc,
        verified: data.verified,
        dateTime: data.dateTime || data.date,
        characters: data.characters || [],
        topics: data.topics || [],
        filename: file,
      });
    } catch {
      // ignore
    }
  }

  list.sort((a, b) => a.id.localeCompare(b.id));
  return list;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers for local tools
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === "/api/config" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getConfigs()));
    return;
  }

  if (pathname === "/api/next-id" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ nextId: getNextSequentialId() }));
    return;
  }

  if (pathname === "/api/entries" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getAllEntriesSummary()));
    return;
  }

  if (pathname.startsWith("/api/entries/") && req.method === "GET") {
    const id = pathname.replace("/api/entries/", "");
    const filePath = path.join(CONTENT_QNA_DIR, `${id}.qna.json`);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(fs.readFileSync(filePath, "utf-8"));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Entry not found" }));
    }
    return;
  }

  // Duplicate check API
  if (pathname === "/api/check-duplicate" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { question, currentId } = JSON.parse(body || "{}");
        const allEntries = getAllEntriesSummary();
        const dupResult = findDuplicates(question || "", allEntries, currentId || null);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(dupResult));
      } catch (err: unknown) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // Quick-paste parser API
  if (pathname === "/api/parse-quick-paste" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { rawText } = JSON.parse(body || "{}");
        const configs = getConfigs();
        const parsed = parseQuickPaste(rawText || "", configs);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, parsed }));
      } catch (err: unknown) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // Tag suggestions API
  if (pathname === "/api/suggest-tags" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { text } = JSON.parse(body || "{}");
        const configs = getConfigs();
        const characters = suggestTags(text || "", configs.characters);
        const topics = suggestTags(text || "", configs.topics);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ characters, topics }));
      } catch (err: unknown) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // Create entry
  if (pathname === "/api/entries" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed.id) {
          parsed.id = getNextSequentialId();
        }

        // Schema validation
        const validated = qnaEntrySchema.parse(parsed);

        // Arc validation
        const configs = getConfigs();
        const validArcs = new Set<string>([
          "general",
          ...configs.arcs.map((a) => a.slug),
          ...configs.ifRoutes.map((r) => r.slug),
        ]);

        if (!validArcs.has(validated.arc)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Invalid arc "${validated.arc}"` }));
          return;
        }

        // Duplicate question check (Normalized match)
        const allEntries = getAllEntriesSummary();
        const dupCheck = findDuplicates(validated.question, allEntries);
        if (dupCheck.isExactDuplicate && dupCheck.exactMatch) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `Duplicate question rejected: matches existing entry #${dupCheck.exactMatch.id}`,
              duplicateId: dupCheck.exactMatch.id,
            })
          );
          return;
        }

        const targetFile = path.join(CONTENT_QNA_DIR, `${validated.id}.qna.json`);
        fs.writeFileSync(targetFile, JSON.stringify(validated, null, 2), "utf-8");

        // Update characters.json and topics.json registries
        updateTagRegistries(validated.characters, validated.topics);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, entry: validated }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  // Update entry
  if (pathname.startsWith("/api/entries/") && req.method === "PUT") {
    const id = pathname.replace("/api/entries/", "");
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        parsed.id = id; // Ensure ID matches URL

        const validated = qnaEntrySchema.parse(parsed);

        const configs = getConfigs();
        const validArcs = new Set<string>([
          "general",
          ...configs.arcs.map((a) => a.slug),
          ...configs.ifRoutes.map((r) => r.slug),
        ]);

        if (!validArcs.has(validated.arc)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Invalid arc "${validated.arc}"` }));
          return;
        }

        // Duplicate question check (Normalized match, excluding current entry)
        const allEntries = getAllEntriesSummary();
        const dupCheck = findDuplicates(validated.question, allEntries, id);
        if (dupCheck.isExactDuplicate && dupCheck.exactMatch) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `Duplicate question rejected: matches existing entry #${dupCheck.exactMatch.id}`,
              duplicateId: dupCheck.exactMatch.id,
            })
          );
          return;
        }

        const targetFile = path.join(CONTENT_QNA_DIR, `${validated.id}.qna.json`);
        fs.writeFileSync(targetFile, JSON.stringify(validated, null, 2), "utf-8");

        updateTagRegistries(validated.characters, validated.topics);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, entry: validated }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  // Delete entry
  if (pathname.startsWith("/api/entries/") && req.method === "DELETE") {
    const id = pathname.replace("/api/entries/", "");
    const targetFile = path.join(CONTENT_QNA_DIR, `${id}.qna.json`);

    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: `Deleted entry ${id}` }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Entry file not found" }));
    }
    return;
  }

  // --- Trivia APIs ---

  if (pathname === "/api/trivia/next-id" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ nextId: getNextTriviaId() }));
    return;
  }

  if (pathname === "/api/trivia" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getAllTriviaSummary()));
    return;
  }

  // Duplicate check API for Trivia
  if (pathname === "/api/check-trivia-duplicate" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { text, currentId } = JSON.parse(body || "{}");
        const allTrivia = getAllTriviaSummary();
        const dupResult = findTriviaDuplicates(text || "", allTrivia, currentId || null);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(dupResult));
      } catch (err: unknown) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // Quick-paste parser API for Trivia
  if (pathname === "/api/parse-trivia-quick-paste" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { rawText } = JSON.parse(body || "{}");
        const configs = getConfigs();
        const parsed = parseTriviaQuickPaste(rawText || "", configs);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, parsed }));
      } catch (err: unknown) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (pathname.startsWith("/api/trivia/") && req.method === "GET") {
    const rawId = pathname.replace("/api/trivia/", "");
    const id = rawId.toUpperCase();
    const candidateFiles = [
      path.join(CONTENT_TRIVIA_DIR, `${id}.trivia.json`),
      path.join(CONTENT_TRIVIA_DIR, `${id}.json`),
      path.join(CONTENT_TRIVIA_DIR, `${rawId}.trivia.json`),
      path.join(CONTENT_TRIVIA_DIR, `${rawId}.json`),
    ];
    const targetFile = candidateFiles.find((f) => fs.existsSync(f));

    if (targetFile) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(fs.readFileSync(targetFile, "utf-8"));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Trivia entry not found" }));
    }
    return;
  }

  if (pathname === "/api/trivia" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        if (!parsed.id) {
          parsed.id = getNextTriviaId();
        } else {
          parsed.id = parsed.id.toUpperCase().trim();
        }

        const validated = triviaEntrySchema.parse(parsed);

        const configs = getConfigs();
        const validArcs = new Set<string>([
          "general",
          ...configs.arcs.map((a) => a.slug),
          ...configs.ifRoutes.map((r) => r.slug),
        ]);

        if (!validArcs.has(validated.arc)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Invalid arc "${validated.arc}"` }));
          return;
        }

        // Duplicate statement check (Normalized match)
        const allTrivia = getAllTriviaSummary();
        const dupCheck = findTriviaDuplicates(validated.text, allTrivia);
        if (dupCheck.isExactDuplicate && dupCheck.exactMatch) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `Duplicate statement rejected: matches existing entry #${dupCheck.exactMatch.id}`,
              duplicateId: dupCheck.exactMatch.id,
            })
          );
          return;
        }

        if (!fs.existsSync(CONTENT_TRIVIA_DIR)) {
          fs.mkdirSync(CONTENT_TRIVIA_DIR, { recursive: true });
        }

        const targetFile = path.join(CONTENT_TRIVIA_DIR, `${validated.id}.trivia.json`);
        fs.writeFileSync(targetFile, JSON.stringify(validated, null, 2), "utf-8");

        updateTagRegistries(validated.characters, validated.topics);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, entry: validated }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  if (pathname.startsWith("/api/trivia/") && req.method === "PUT") {
    const rawId = pathname.replace("/api/trivia/", "");
    const id = rawId.toUpperCase();
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        parsed.id = id;

        const validated = triviaEntrySchema.parse(parsed);

        const configs = getConfigs();
        const validArcs = new Set<string>([
          "general",
          ...configs.arcs.map((a) => a.slug),
          ...configs.ifRoutes.map((r) => r.slug),
        ]);

        if (!validArcs.has(validated.arc)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Invalid arc "${validated.arc}"` }));
          return;
        }

        // Duplicate statement check (exclude current id)
        const allTrivia = getAllTriviaSummary();
        const dupCheck = findTriviaDuplicates(validated.text, allTrivia, id);
        if (dupCheck.isExactDuplicate && dupCheck.exactMatch) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `Duplicate statement rejected: matches existing entry #${dupCheck.exactMatch.id}`,
              duplicateId: dupCheck.exactMatch.id,
            })
          );
          return;
        }

        if (!fs.existsSync(CONTENT_TRIVIA_DIR)) {
          fs.mkdirSync(CONTENT_TRIVIA_DIR, { recursive: true });
        }

        const targetFile = path.join(CONTENT_TRIVIA_DIR, `${validated.id}.trivia.json`);
        fs.writeFileSync(targetFile, JSON.stringify(validated, null, 2), "utf-8");

        updateTagRegistries(validated.characters, validated.topics);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, entry: validated }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  if (pathname.startsWith("/api/trivia/") && req.method === "DELETE") {
    const rawId = pathname.replace("/api/trivia/", "");
    const id = rawId.toUpperCase();
    const candidateFiles = [
      path.join(CONTENT_TRIVIA_DIR, `${id}.trivia.json`),
      path.join(CONTENT_TRIVIA_DIR, `${id}.json`),
      path.join(CONTENT_TRIVIA_DIR, `${rawId}.trivia.json`),
      path.join(CONTENT_TRIVIA_DIR, `${rawId}.json`),
    ];
    const targetFile = candidateFiles.find((f) => fs.existsSync(f));

    if (targetFile) {
      fs.unlinkSync(targetFile);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: `Deleted trivia entry ${id}` }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Trivia entry file not found" }));
    }
    return;
  }

  // --- Stories & Supplements APIs ---

  // List all stories or create a new story
  if (pathname === "/api/stories") {
    if (req.method === "GET") {
      const stories = getStoriesConfig();
      const result = stories.map((s) => ({
        ...s,
        supplementCount: getStorySupplements(s.slug).length,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body || "{}");
          if (!parsed.slug || !parsed.name) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Slug and name are required" }));
            return;
          }
          const slug = parsed.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
          const stories = getStoriesConfig();
          if (stories.some((s) => s.slug === slug)) {
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `Story slug "${slug}" already exists` }));
            return;
          }
          const storyType = parsed.type === "side-story" ? "side-story" : "if";
          const newStory: IfRouteConfig = {
            slug,
            name: parsed.name.trim(),
            divergesFrom: storyType === "if" ? (parsed.divergesFrom || null) : undefined,
            timeline: storyType === "side-story" ? (parsed.timeline || null) : undefined,
            type: storyType,
            description: parsed.description || "",
            datePublished: parsed.datePublished || "",
          };
          stories.push(newStory);
          saveStoriesConfig(stories);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, story: newStory }));
        } catch (err: unknown) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
      return;
    }
  }

  // Story & Supplement detail routes
  const storyMatch = pathname.match(/^\/api\/stories\/([a-zA-Z0-9_-]+)(?:\/supplements(?:\/([a-zA-Z0-9_-]+))?)?$/);
  if (storyMatch) {
    const storySlug = storyMatch[1];
    const isSupplements = pathname.includes("/supplements");
    const supplementId = storyMatch[2];

    // Story operations: /api/stories/:slug
    if (!isSupplements) {
      if (req.method === "GET") {
        const stories = getStoriesConfig();
        const story = stories.find((s) => s.slug === storySlug);
        if (!story) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Story not found" }));
          return;
        }
        const supplements = getStorySupplements(storySlug);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ...story, supplements }));
        return;
      }

      if (req.method === "PUT") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body || "{}");
            const stories = getStoriesConfig();
            const idx = stories.findIndex((s) => s.slug === storySlug);
            if (idx === -1) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Story not found" }));
              return;
            }
            const storyType = parsed.type !== undefined ? (parsed.type === "side-story" ? "side-story" : "if") : (stories[idx].type || "if");
            stories[idx] = {
              ...stories[idx],
              name: parsed.name !== undefined ? parsed.name.trim() : stories[idx].name,
              divergesFrom: storyType === "if" ? (parsed.divergesFrom !== undefined ? (parsed.divergesFrom || null) : (stories[idx].divergesFrom || null)) : undefined,
              timeline: storyType === "side-story" ? (parsed.timeline !== undefined ? (parsed.timeline || null) : (stories[idx].timeline || null)) : undefined,
              type: storyType,
              description: parsed.description !== undefined ? parsed.description : (stories[idx].description || ""),
              datePublished: parsed.datePublished !== undefined ? parsed.datePublished : (stories[idx].datePublished || ""),
            };
            saveStoriesConfig(stories);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, story: stories[idx] }));
          } catch (err: unknown) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
        return;
      }

      if (req.method === "DELETE") {
        const stories = getStoriesConfig();
        const filtered = stories.filter((s) => s.slug !== storySlug);
        if (filtered.length === stories.length) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Story not found" }));
          return;
        }
        saveStoriesConfig(filtered);
        const suppFile = path.join(CONTENT_SUPPLEMENTS_DIR, `${storySlug}.json`);
        if (fs.existsSync(suppFile)) {
          fs.unlinkSync(suppFile);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: `Deleted story ${storySlug}` }));
        return;
      }
    }

    // Supplement collection operations: /api/stories/:slug/supplements
    if (isSupplements && !supplementId) {
      if (req.method === "GET") {
        const supplements = getStorySupplements(storySlug);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(supplements));
        return;
      }

      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body || "{}");
            if (!parsed.title || !parsed.content) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Title and content are required" }));
              return;
            }
            const supplements = getStorySupplements(storySlug);
            let maxNum = 0;
            for (const item of supplements) {
              const m = item.id.match(/^s?(\d+)$/);
              if (m) {
                const n = parseInt(m[1], 10);
                if (n > maxNum) maxNum = n;
              }
            }
            const newId = parsed.id && parsed.id.trim()
              ? parsed.id.trim()
              : `s${String(maxNum + 1).padStart(3, "0")}`;

            const newSupplement: SupplementEntry = {
              id: newId,
              title: parsed.title.trim(),
              content: parsed.content.trim(),
              source: parsed.source && parsed.source.type ? parsed.source : { type: "text", value: "" },
              date: parsed.date ? parsed.date.trim() : undefined,
            };

            supplements.push(newSupplement);
            saveStorySupplements(storySlug, supplements);
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, supplement: newSupplement }));
          } catch (err: unknown) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
        return;
      }
    }

    // Single supplement operations: /api/stories/:slug/supplements/:id
    if (isSupplements && supplementId) {
      if (req.method === "PUT") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body || "{}");
            const supplements = getStorySupplements(storySlug);
            const idx = supplements.findIndex((s) => s.id === supplementId);
            if (idx === -1) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Supplement not found" }));
              return;
            }
            supplements[idx] = {
              ...supplements[idx],
              title: parsed.title !== undefined ? parsed.title.trim() : supplements[idx].title,
              content: parsed.content !== undefined ? parsed.content.trim() : supplements[idx].content,
              source: parsed.source !== undefined ? parsed.source : supplements[idx].source,
              date: parsed.date !== undefined ? parsed.date.trim() : supplements[idx].date,
            };
            saveStorySupplements(storySlug, supplements);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, supplement: supplements[idx] }));
          } catch (err: unknown) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
        return;
      }

      if (req.method === "DELETE") {
        const supplements = getStorySupplements(storySlug);
        const filtered = supplements.filter((s) => s.id !== supplementId);
        if (filtered.length === supplements.length) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Supplement not found" }));
          return;
        }
        saveStorySupplements(storySlug, filtered);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: `Deleted supplement ${supplementId}` }));
        return;
      }
    }
  }

  // Serve Single-Page Admin HTML GUI
  if (pathname === "/" && (req.method === "GET" || req.method === "HEAD")) {
    const htmlPath = path.join(__dirname, "index.html");
    if (!fs.existsSync(htmlPath)) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("index.html not found");
      return;
    }
    const html = fs.readFileSync(htmlPath, "utf-8");
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(html, "utf-8"),
    });
    if (req.method === "HEAD") {
      res.end();
    } else {
      res.end(html);
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n======================================================`);
  console.log(` Od-Lagna Local Admin Tool`);
  console.log(` Running locally at: http://localhost:${PORT}`);
  console.log(` (Local dev only — never exposed or deployed to production)`);
  console.log(`======================================================\n`);
});
