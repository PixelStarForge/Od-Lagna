import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { qnaEntrySchema, ArcConfig, IfRouteConfig, QnaEntry } from "../../lib/schema";

const PORT = 4321;
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
  if (pathname === "/" && req.method === "GET") {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Od-Lagna — Local Q&amp;A Admin Tool</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #ef4444;
      --accent-hover: #dc2626;
      --input: #0f172a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }
    
    /* Layout */
    #sidebar { width: 340px; background: var(--card); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
    #main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 2rem; }
    
    /* Sidebar header */
    .side-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .side-header h2 { font-size: 1rem; font-weight: 700; }
    .btn-new { background: var(--accent); color: white; border: none; border-radius: 6px; padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .btn-new:hover { background: var(--accent-hover); }
    
    .search-box { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
    .search-box input { width: 100%; padding: 0.5rem; background: var(--input); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.85rem; }
    
    #entry-list { flex: 1; overflow-y: auto; list-style: none; }
    #entry-list li { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
    #entry-list li:hover { background: rgba(255,255,255,0.05); }
    #entry-list li.active { background: rgba(239, 68, 68, 0.15); border-left: 3px solid var(--accent); }
    .entry-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-bottom: 0.25rem; }
    .entry-q { font-size: 0.85rem; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    /* Form */
    .form-container { max-width: 800px; margin: 0 auto; width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.4rem; }
    input[type="text"], textarea, select { width: 100%; padding: 0.6rem 0.8rem; background: var(--input); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem; }
    input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); }
    textarea { min-height: 120px; font-family: inherit; resize: vertical; line-height: 1.5; }
    .hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem; }
    
    /* Tag autocomplete & pills */
    .autocomplete-wrap { position: relative; }
    .autocomplete-list { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #1e293b; border: 1px solid var(--border); border-radius: 6px; max-height: 180px; overflow-y: auto; z-index: 50; display: none; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
    .autocomplete-item { padding: 0.5rem 0.75rem; font-size: 0.85rem; color: #f8fafc; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .autocomplete-item:hover { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    
    .tag-box { margin-top: 0.5rem; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem; }
    .tag-box-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .tag-box-head span { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
    .tag-box-filter { max-width: 160px; font-size: 0.75rem !important; padding: 0.25rem 0.5rem !important; }
    .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.35rem; max-height: 130px; overflow-y: auto; }
    .tag-pill { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; cursor: pointer; transition: all 0.15s ease; user-select: none; }
    .tag-pill:hover { border-color: #64748b; color: #f8fafc; background: #334155; }
    .tag-pill.active { background: rgba(239, 68, 68, 0.2); border-color: var(--accent); color: #fca5a5; font-weight: 600; }

    .actions { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .btn-save { background: var(--accent); color: white; border: none; border-radius: 6px; padding: 0.6rem 1.4rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
    .btn-save:hover { background: var(--accent-hover); }
    .btn-delete { background: transparent; color: #f87171; border: 1px solid #7f1d1d; border-radius: 6px; padding: 0.6rem 1.2rem; font-size: 0.85rem; cursor: pointer; }
    .btn-delete:hover { background: #450a0a; }
    
    #status-msg { margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: 6px; display: none; font-size: 0.85rem; }
    #status-msg.success { background: #064e3b; color: #a7f3d0; display: block; }
    #status-msg.error { background: #7f1d1d; color: #fecaca; display: block; }

    /* Date selector components */
    .sub-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; display: block; }
    .btn-date-action { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
    .btn-date-action:hover { background: rgba(255, 255, 255, 0.16); color: var(--text); border-color: #64748b; }
    .date-panel { background: rgba(15, 23, 42, 0.45); border: 1px solid var(--border); border-radius: 8px; padding: 0.85rem; }
    .date-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .date-grid { display: grid; grid-template-columns: 85px 145px 115px 125px; gap: 0.75rem; align-items: end; }
    @media (max-width: 640px) { .date-grid { grid-template-columns: 1fr 1fr; } }
    .date-preview-box { margin-top: 0.55rem; font-size: 0.75rem; color: var(--text-muted); font-family: monospace; padding: 0.35rem 0.5rem; border-radius: 4px; background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; gap: 0.5rem; }
    .date-preview-val { color: #38bdf8; font-weight: 600; }
  </style>
</head>
<body>
  <div id="sidebar">
    <div class="side-header">
      <h2>Od-Lagna Admin</h2>
      <button class="btn-new" onclick="createNew()">+ New Q&amp;A</button>
    </div>
    <div class="search-box">
      <input type="text" id="filter-input" placeholder="Filter entries..." oninput="renderEntryList()">
    </div>
    <ul id="entry-list"></ul>
  </div>

  <div id="main">
    <div class="form-container">
      <div class="form-header">
        <h2 id="form-title">Create New Q&amp;A</h2>
        <span id="entry-badge" style="font-family: monospace; font-size: 0.85rem; color: var(--text-muted);">ID: Auto-assigned</span>
      </div>

      <div id="status-msg"></div>

      <form id="qna-form" onsubmit="handleSave(event)">
        <input type="hidden" id="entry-id">

        <div class="form-group">
          <label for="question">Question</label>
          <textarea id="question" required placeholder="The fan or interviewer question..."></textarea>
        </div>

        <div class="form-group">
          <label for="answer">Author Answer</label>
          <textarea id="answer" style="min-height: 160px;" required placeholder="Tappei Nagatsuki's direct answer..."></textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label for="arc">Story Arc / IF Route</label>
            <select id="arc" required></select>
          </div>

          <div class="form-group">
            <label for="verified">Verification Status</label>
            <label style="display: flex; align-items: center; gap: 0.5rem; text-transform: none; color: var(--text); font-weight: normal; margin-top: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="verified">
              <span>Verified Primary Source</span>
            </label>
          </div>
        </div>

        <!-- Date & Time Selector Separated by Day -> Month -> Year -->
        <div class="form-group date-panel">
          <div class="date-panel-head">
            <label style="margin-bottom: 0;">Statement Date &amp; Time (Optional)</label>
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn-date-action" onclick="setTodayDate()">Today</button>
              <button type="button" class="btn-date-action" onclick="clearDateFields()">Clear</button>
            </div>
          </div>

          <div class="date-grid">
            <div>
              <label for="date-day" class="sub-label">Day</label>
              <select id="date-day" onchange="updateDatePreview()"></select>
            </div>

            <div>
              <label for="date-month" class="sub-label">Month</label>
              <select id="date-month" onchange="updateDatePreview()">
                <option value="">Month</option>
                <option value="01">01 - Jan</option>
                <option value="02">02 - Feb</option>
                <option value="03">03 - Mar</option>
                <option value="04">04 - Apr</option>
                <option value="05">05 - May</option>
                <option value="06">06 - Jun</option>
                <option value="07">07 - Jul</option>
                <option value="08">08 - Aug</option>
                <option value="09">09 - Sep</option>
                <option value="10">10 - Oct</option>
                <option value="11">11 - Nov</option>
                <option value="12">12 - Dec</option>
              </select>
            </div>

            <div>
              <label for="date-year" class="sub-label">Year</label>
              <select id="date-year" onchange="handleYearChange()"></select>
            </div>

            <div>
              <label for="date-time-val" class="sub-label">Time (Optional)</label>
              <input type="time" id="date-time-val" onchange="updateDatePreview()">
            </div>
          </div>

          <div id="date-preview-box" class="date-preview-box">
            <span>Stored ISO:</span>
            <span id="date-preview-text" class="date-preview-val">None</span>
            <span id="date-preview-human" style="color: var(--text-muted); font-family: sans-serif; font-size: 0.72rem;"></span>
          </div>
        </div>

        <!-- Characters with Autocomplete and Tag Cloud -->
        <div class="form-group">
          <label for="characters">Characters (Comma-separated)</label>
          <div class="autocomplete-wrap">
            <input type="text" id="characters" placeholder="e.g. Subaru Natsuki, Emilia, Echidna" autocomplete="off">
            <div id="char-autocomplete" class="autocomplete-list"></div>
          </div>
          <div class="tag-box">
            <div class="tag-box-head">
              <span>Known Characters (click to toggle):</span>
              <input type="text" id="char-filter" class="tag-box-filter" placeholder="Filter..." oninput="renderTagClouds()">
            </div>
            <div id="character-chips" class="tag-cloud"></div>
          </div>
          <p class="hint">Click tags above to toggle them, or type to search with autocomplete. New tags are automatically registered on save.</p>
        </div>

        <!-- Topics with Autocomplete and Tag Cloud -->
        <div class="form-group">
          <label for="topics">Topics (Comma-separated)</label>
          <div class="autocomplete-wrap">
            <input type="text" id="topics" placeholder="e.g. Authorities, Contracts & Spirits, Greed IF" autocomplete="off">
            <div id="topic-autocomplete" class="autocomplete-list"></div>
          </div>
          <div class="tag-box">
            <div class="tag-box-head">
              <span>Known Topics (click to toggle):</span>
              <input type="text" id="topic-filter" class="tag-box-filter" placeholder="Filter..." oninput="renderTagClouds()">
            </div>
            <div id="topic-chips" class="tag-cloud"></div>
          </div>
          <p class="hint">Click tags above to toggle them, or type to search with autocomplete. New tags are automatically registered on save.</p>
        </div>

        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 1rem;">
          <div class="form-group">
            <label for="source-type">Source Type</label>
            <select id="source-type">
              <option value="url">URL Link</option>
              <option value="text">Free Text</option>
            </select>
          </div>

          <div class="form-group">
            <label for="source-value">Source Citation / URL</label>
            <input type="text" id="source-value" placeholder="https://x.com/... or 2018 Birthday Q&A">
          </div>
        </div>

        <div class="actions">
          <button type="button" id="btn-delete" class="btn-delete" style="display: none;" onclick="handleDelete()">Delete Entry</button>
          <div style="flex: 1;"></div>
          <button type="submit" class="btn-save">Save Q&amp;A Entry</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let entries = [];
    let config = { arcs: [], ifRoutes: [], characters: [], topics: [] };
    let currentId = null;

    async function init() {
      await reloadConfigAndEntries();
      populateArcSelect();
      populateDaySelect();
      populateYearSelect();
      setupAutocomplete('characters', 'char-autocomplete', 'characters');
      setupAutocomplete('topics', 'topic-autocomplete', 'topics');
      createNew();
    }

    async function reloadConfigAndEntries() {
      const [cfgRes, listRes] = await Promise.all([
        fetch('/api/config').then(r => r.json()),
        fetch('/api/entries').then(r => r.json())
      ]);
      config = cfgRes;
      entries = listRes;
      renderTagClouds();
    }

    function populateArcSelect() {
      const select = document.getElementById('arc');
      select.innerHTML = '<option value="general">General / No Story Spoilers</option>';

      const optGroupArcs = document.createElement('optgroup');
      optGroupArcs.label = 'Canonical Arcs';
      config.arcs.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.slug;
        opt.textContent = 'Arc ' + a.order + ': ' + a.name;
        optGroupArcs.appendChild(opt);
      });
      select.appendChild(optGroupArcs);

      const optGroupIf = document.createElement('optgroup');
      optGroupIf.label = 'IF / What-If Timelines';
      config.ifRoutes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.slug;
        opt.textContent = r.name;
        optGroupIf.appendChild(opt);
      });
      select.appendChild(optGroupIf);
    }

    function renderTagClouds() {
      renderCloud('characters', config.characters || [], 'character-chips', 'char-filter');
      renderCloud('topics', config.topics || [], 'topic-chips', 'topic-filter');
    }

    function renderCloud(inputId, allTags, containerId, filterId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const filterVal = (document.getElementById(filterId)?.value || '').toLowerCase().trim();
      const currentTags = getSelectedTagsSet(inputId);

      container.innerHTML = '';
      const matchingTags = allTags.filter(t => !filterVal || t.toLowerCase().includes(filterVal));

      if (matchingTags.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem; padding: 0.25rem;">No matching tags.</span>';
        return;
      }

      matchingTags.forEach(tag => {
        const pill = document.createElement('button');
        pill.type = 'button';
        const isSelected = currentTags.has(tag.toLowerCase());
        pill.className = 'tag-pill' + (isSelected ? ' active' : '');
        pill.textContent = (isSelected ? '✓ ' : '+ ') + tag;
        pill.title = isSelected ? 'Click to remove tag' : 'Click to add tag';
        pill.onclick = (e) => {
          e.preventDefault();
          toggleTag(inputId, tag);
        };
        container.appendChild(pill);
      });
    }

    function getSelectedTagsSet(inputId) {
      const val = document.getElementById(inputId)?.value || '';
      return new Set(val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    }

    function toggleTag(inputId, tag) {
      const input = document.getElementById(inputId);
      const tags = input.value.split(',').map(s => s.trim()).filter(Boolean);
      const existingIdx = tags.findIndex(t => t.toLowerCase() === tag.toLowerCase());

      if (existingIdx >= 0) {
        tags.splice(existingIdx, 1);
      } else {
        tags.push(tag);
      }

      input.value = tags.length > 0 ? tags.join(', ') + ', ' : '';
      renderTagClouds();
    }

    function setupAutocomplete(inputId, dropdownId, configKey) {
      const input = document.getElementById(inputId);
      const dropdown = document.getElementById(dropdownId);

      input.addEventListener('input', () => {
        renderTagClouds();

        const val = input.value;
        const cursor = input.selectionStart || val.length;
        const textBefore = val.slice(0, cursor);
        const lastComma = textBefore.lastIndexOf(',');
        const currentQuery = textBefore.slice(lastComma + 1).trim().toLowerCase();

        if (!currentQuery) {
          dropdown.style.display = 'none';
          return;
        }

        const list = config[configKey] || [];
        const matches = list.filter(item => item.toLowerCase().includes(currentQuery));

        if (matches.length === 0) {
          dropdown.style.display = 'none';
          return;
        }

        dropdown.innerHTML = '';
        matches.slice(0, 10).forEach(item => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          div.textContent = item;
          div.onmousedown = (e) => {
            e.preventDefault();
            insertAutocomplete(inputId, item, lastComma);
            dropdown.style.display = 'none';
          };
          dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
      });

      input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 250);
      });
    }

    function insertAutocomplete(inputId, selectedTag, lastCommaIndex) {
      const input = document.getElementById(inputId);
      const val = input.value;
      const before = lastCommaIndex >= 0 ? val.slice(0, lastCommaIndex + 1).trim() + ' ' : '';
      
      const afterIndex = val.indexOf(',', lastCommaIndex + 1);
      const after = afterIndex >= 0 ? val.slice(afterIndex) : '';

      const currentTags = (before + selectedTag + (after ? after : '')).split(',').map(s => s.trim()).filter(Boolean);
      const uniqueTags = [];
      const seen = new Set();
      for (const t of currentTags) {
        const lower = t.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          uniqueTags.push(t);
        }
      }

      input.value = uniqueTags.join(', ') + ', ';
      renderTagClouds();
      input.focus();
      if (input.setSelectionRange) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    function renderEntryList() {
      const list = document.getElementById('entry-list');
      const filter = document.getElementById('filter-input').value.toLowerCase();
      list.innerHTML = '';

      const filtered = entries.filter(e => 
        e.id.includes(filter) || 
        e.question.toLowerCase().includes(filter) || 
        e.arc.toLowerCase().includes(filter)
      );

      if (filtered.length === 0) {
        list.innerHTML = '<li style="color: var(--text-muted); text-align: center; padding: 2rem;">No entries found.</li>';
        return;
      }

      filtered.forEach(e => {
        const li = document.createElement('li');
        if (e.id === currentId) li.className = 'active';
        li.onclick = () => loadEntry(e.id);
        const dateTag = e.dateTime ? ' • ' + (e.dateTime.length > 10 ? e.dateTime.slice(0, 10) : e.dateTime) : '';
        li.innerHTML = 
          '<div class="entry-meta"><span>#' + e.id + '</span><span>' + e.arc + dateTag + '</span></div>' +
          '<div class="entry-q">' + (e.question || 'Untitled') + '</div>';
        list.appendChild(li);
      });
    }

    async function createNew() {
      currentId = null;
      document.getElementById('form-title').textContent = 'Create New Q&A';
      document.getElementById('entry-badge').textContent = 'ID: Auto-assigned on save';
      document.getElementById('btn-delete').style.display = 'none';
      document.getElementById('qna-form').reset();
      document.getElementById('entry-id').value = '';
      clearDateFields();
      hideStatus();
      renderEntryList();
      renderTagClouds();
    }

    async function loadEntry(id) {
      currentId = id;
      hideStatus();
      renderEntryList();

      const res = await fetch('/api/entries/' + id);
      if (!res.ok) {
        showStatus('Failed to load entry ' + id, 'error');
        return;
      }

      const data = await res.json();
      document.getElementById('form-title').textContent = 'Edit Entry #' + data.id;
      document.getElementById('entry-badge').textContent = 'ID: #' + data.id;
      document.getElementById('btn-delete').style.display = 'block';

      document.getElementById('entry-id').value = data.id;
      document.getElementById('question').value = data.question;
      document.getElementById('answer').value = data.answer;
      document.getElementById('arc').value = data.arc;
      document.getElementById('verified').checked = !!data.verified;
      setDateFromValue(data.dateTime || data.date || '');
      document.getElementById('characters').value = (data.characters || []).join(', ');
      document.getElementById('topics').value = (data.topics || []).join(', ');
      document.getElementById('source-type').value = data.source ? data.source.type : 'url';
      document.getElementById('source-value').value = data.source ? (data.source.value || '') : '';
      renderTagClouds();
    }

    async function handleSave(event) {
      event.preventDefault();
      hideStatus();

      const chars = document.getElementById('characters').value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const topics = document.getElementById('topics').value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const dayVal = document.getElementById('date-day').value;
      const monthVal = document.getElementById('date-month').value;
      const yearVal = document.getElementById('date-year').value;

      if ((dayVal || monthVal) && !yearVal) {
        showStatus('Please select a Year to complete the date.', 'error');
        return;
      }

      const dateTimeVal = getCombinedDateTime();
      const payload = {
        question: document.getElementById('question').value.trim(),
        answer: document.getElementById('answer').value.trim(),
        arc: document.getElementById('arc').value,
        verified: document.getElementById('verified').checked,
        ...(dateTimeVal ? { dateTime: dateTimeVal } : {}),
        characters: chars,
        topics: topics,
        source: {
          type: document.getElementById('source-type').value,
          value: document.getElementById('source-value').value.trim()
        }
      };

      const isEdit = !!currentId;
      const url = isEdit ? '/api/entries/' + currentId : '/api/entries';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          showStatus(data.error || 'Validation or write failed', 'error');
          return;
        }

        showStatus('Entry #' + data.entry.id + ' saved successfully!', 'success');
        
        await reloadConfigAndEntries();
        await loadEntry(data.entry.id);
      } catch (err) {
        showStatus(err.message, 'error');
      }
    }

    async function handleDelete() {
      if (!currentId) return;
      const confirmed = confirm('Are you sure you want to permanently delete Q&A entry #' + currentId + '?');
      if (!confirmed) return;

      try {
        const res = await fetch('/api/entries/' + currentId, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          showStatus(data.error || 'Failed to delete entry', 'error');
          return;
        }

        showStatus('Entry #' + currentId + ' deleted successfully.', 'success');
        await reloadConfigAndEntries();
        createNew();
      } catch (err) {
        showStatus(err.message, 'error');
      }
    }

    function showStatus(msg, type) {
      const el = document.getElementById('status-msg');
      el.textContent = msg;
      el.className = type;
    }

    function hideStatus() {
      const el = document.getElementById('status-msg');
      el.className = '';
      el.style.display = 'none';
    }

    /* Date & Time helper routines */
    const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function populateDaySelect() {
      const sel = document.getElementById('date-day');
      sel.innerHTML = '<option value="">Day</option>';
      for (let d = 1; d <= 31; d++) {
        const opt = document.createElement('option');
        const val = String(d).padStart(2, '0');
        opt.value = val;
        opt.textContent = val;
        sel.appendChild(opt);
      }
    }

    function populateYearSelect() {
      const sel = document.getElementById('date-year');
      sel.innerHTML = '<option value="">Year</option>';
      const currentYear = new Date().getFullYear();
      for (let y = currentYear + 1; y >= 2011; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        sel.appendChild(opt);
      }
      const optOther = document.createElement('option');
      optOther.value = 'other';
      optOther.textContent = 'Other Year...';
      sel.appendChild(optOther);
    }

    function ensureYearInSelect(y) {
      if (!y) return;
      const sel = document.getElementById('date-year');
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === y) return;
      }
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      sel.insertBefore(opt, sel.lastElementChild);
    }

    function handleYearChange() {
      const sel = document.getElementById('date-year');
      if (sel.value === 'other') {
        const custom = prompt('Enter 4-digit Year (e.g. 2008):');
        if (custom && /^\\d{4}$/.test(custom.trim())) {
          const cleanYear = custom.trim();
          ensureYearInSelect(cleanYear);
          sel.value = cleanYear;
        } else {
          sel.value = '';
        }
      }
      updateDatePreview();
    }

    function getCombinedDateTime() {
      const day = document.getElementById('date-day').value;
      const month = document.getElementById('date-month').value;
      const year = document.getElementById('date-year').value;
      const time = document.getElementById('date-time-val').value;

      if (!year) return '';

      if (month && day) {
        let res = year + '-' + month + '-' + day;
        if (time) {
          res += 'T' + (time.length === 5 ? time + ':00' : time);
        }
        return res;
      }

      if (month) {
        return year + '-' + month;
      }

      return year;
    }

    function updateDatePreview() {
      const day = document.getElementById('date-day').value;
      const month = document.getElementById('date-month').value;
      const year = document.getElementById('date-year').value;
      const time = document.getElementById('date-time-val').value;
      const isoText = document.getElementById('date-preview-text');
      const humanText = document.getElementById('date-preview-human');

      const iso = getCombinedDateTime();
      if (!iso) {
        if (day || month) {
          isoText.textContent = 'Incomplete (Select Year)';
          isoText.style.color = '#f87171';
          humanText.textContent = '';
        } else {
          isoText.textContent = 'None';
          isoText.style.color = 'var(--text-muted)';
          humanText.textContent = '';
        }
        return;
      }

      isoText.textContent = iso;
      isoText.style.color = '#38bdf8';

      if (year && month && day) {
        const mIdx = parseInt(month, 10);
        const mName = MONTH_NAMES[mIdx] || month;
        const dNum = parseInt(day, 10);
        let human = '(' + mName + ' ' + dNum + ', ' + year;
        if (time) human += ' at ' + time;
        human += ')';
        humanText.textContent = human;
      } else if (year && month) {
        const mIdx = parseInt(month, 10);
        humanText.textContent = '(' + (MONTH_NAMES[mIdx] || month) + ' ' + year + ')';
      } else if (year) {
        humanText.textContent = '(' + year + ')';
      }
    }

    function setDateFromValue(val) {
      clearDateFields();
      if (!val || typeof val !== 'string') return;
      const trimmed = val.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(\\d{4})(?:-(\\d{2}))?(?:-(\\d{2}))?(?:[T\\s](\\d{2}:\\d{2}))?/);
      if (match) {
        const y = match[1];
        const m = match[2] || '';
        const d = match[3] || '';
        const t = match[4] || '';

        ensureYearInSelect(y);
        document.getElementById('date-year').value = y;
        document.getElementById('date-month').value = m;
        document.getElementById('date-day').value = d;
        document.getElementById('date-time-val').value = t;
      }
      updateDatePreview();
    }

    function setTodayDate() {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = String(now.getFullYear());
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      ensureYearInSelect(y);
      document.getElementById('date-year').value = y;
      document.getElementById('date-month').value = m;
      document.getElementById('date-day').value = d;
      document.getElementById('date-time-val').value = hh + ':' + mm;
      updateDatePreview();
    }

    function clearDateFields() {
      document.getElementById('date-day').value = '';
      document.getElementById('date-month').value = '';
      document.getElementById('date-year').value = '';
      document.getElementById('date-time-val').value = '';
      updateDatePreview();
    }

    init();
  </script>
</body>
</html>`;

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
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
