import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { qnaEntrySchema, ArcConfig, IfRouteConfig, QnaEntry } from "../../lib/schema";
import { findDuplicates, suggestTags, parseQuickPaste } from "./utils";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4321;
const ROOT_DIR = path.resolve(__dirname, "../..");
const CONTENT_CONFIG_DIR = path.join(ROOT_DIR, "content", "config");
const CONTENT_QNA_DIR = path.join(ROOT_DIR, "content", "qna");

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

function getConfigs() {
  const arcsFile = path.join(CONTENT_CONFIG_DIR, "arcs.json");
  const ifRoutesFile = path.join(CONTENT_CONFIG_DIR, "if-routes.json");
  const charsFile = path.join(CONTENT_CONFIG_DIR, "characters.json");
  const topicsFile = path.join(CONTENT_CONFIG_DIR, "topics.json");

  const arcs: ArcConfig[] = fs.existsSync(arcsFile) ? JSON.parse(fs.readFileSync(arcsFile, "utf-8")) : [];
  const ifRoutes: IfRouteConfig[] = fs.existsSync(ifRoutesFile) ? JSON.parse(fs.readFileSync(ifRoutesFile, "utf-8")) : [];
  const characters: string[] = fs.existsSync(charsFile) ? JSON.parse(fs.readFileSync(charsFile, "utf-8")) : [];
  const topics: string[] = fs.existsSync(topicsFile) ? JSON.parse(fs.readFileSync(topicsFile, "utf-8")) : [];

  return { arcs, ifRoutes, characters, topics };
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
