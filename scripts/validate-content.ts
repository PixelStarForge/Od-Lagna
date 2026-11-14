import fs from "node:fs";
import path from "node:path";
import {
  qnaEntrySchema,
  ArcConfig,
  IfRouteConfig,
  contributorSchema,
  triviaEntrySchema,
  characterSchema,
  animeCatalogEntrySchema,
  episodeCommentarySchema,
  twitterShortStorySchema,
  readingGuideSchema,
  timelineEraSchema,
  timelineEventSchema,
  timelineIfRouteSchema,
} from "../lib/schema";
import {
  starSchema,
  constellationSchema,
  characterStarSchema,
} from "../lib/constellation-schema";

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_CONFIG_DIR = path.join(ROOT_DIR, "content", "config");
const CONTENT_QNA_DIR = path.join(ROOT_DIR, "content", "qna");
const CONTENT_TRIVIA_DIR = path.join(ROOT_DIR, "content", "trivia");
const CONTENT_CHARACTERS_DIR = path.join(ROOT_DIR, "content", "characters");
const CONTENT_TWITTER_STORIES_DIR = path.join(ROOT_DIR, "content", "twitter-short-stories");
const CONTENT_TIMELINE_DIR = path.join(ROOT_DIR, "content", "timeline");
const CONTENT_CONSTELLATIONS_DIR = path.join(ROOT_DIR, "content", "constellations");

function getValidArcSlugs(): Set<string> {
  const arcsFile = path.join(CONTENT_CONFIG_DIR, "arcs.json");
  const ifRoutesFile = path.join(CONTENT_CONFIG_DIR, "stories.json");

  const slugs = new Set<string>(["general"]);

  if (fs.existsSync(arcsFile)) {
    const arcs: ArcConfig[] = JSON.parse(fs.readFileSync(arcsFile, "utf-8"));
    for (const a of arcs) {
      slugs.add(a.slug);
    }
  }

  if (fs.existsSync(ifRoutesFile)) {
    const ifRoutes: IfRouteConfig[] = JSON.parse(fs.readFileSync(ifRoutesFile, "utf-8"));
    for (const r of ifRoutes) {
      slugs.add(r.slug);
    }
  }

  return slugs;
}

export function validateQnaDirectory(dirPath = CONTENT_QNA_DIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validArcSlugs = getValidArcSlugs();
  const seenIds = new Map<string, string>(); // id -> filename

  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [] };
  }

  const entries = fs.readdirSync(dirPath);
  const jsonFiles = entries.filter((file) => file.endsWith(".json") && !file.startsWith("_"));

  for (const filename of jsonFiles) {
    const fullPath = path.join(dirPath, filename);
    let parsed: unknown;

    try {
      const rawContent = fs.readFileSync(fullPath, "utf-8");
      parsed = JSON.parse(rawContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${filename}] Invalid JSON format: ${msg}`);
      continue;
    }

    const result = qnaEntrySchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
      errors.push(`[${filename}] Schema validation failed: ${issues}`);
      continue;
    }

    const data = result.data;

    // Validate expected filename: {id}.qna.json
    const expectedFilename = `${data.id}.qna.json`;
    if (filename !== expectedFilename) {
      errors.push(
        `[${filename}] Filename mismatch: Entry ID is "${data.id}", expected filename to be "${expectedFilename}"`
      );
    }

    // Validate ID uniqueness
    if (seenIds.has(data.id)) {
      errors.push(
        `[${filename}] Duplicate ID "${data.id}": Already declared in "${seenIds.get(data.id)}"`
      );
    } else {
      seenIds.set(data.id, filename);
    }

    // Dynamically validate arc slug
    if (!validArcSlugs.has(data.arc)) {
      errors.push(
        `[${filename}] Invalid arc "${data.arc}": Must be one of [${Array.from(validArcSlugs).sort().join(", ")}]`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateContributors(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const file = path.join(CONTENT_CONFIG_DIR, "contributors.json");
  if (!fs.existsSync(file)) {
    return { valid: true, errors: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`[contributors.json] Invalid JSON format: ${msg}`);
    return { valid: false, errors };
  }

  if (!Array.isArray(parsed)) {
    errors.push(`[contributors.json] File content must be a JSON array`);
    return { valid: false, errors };
  }

  parsed.forEach((item, index) => {
    const result = contributorSchema.safeParse(item);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ");
      errors.push(`[contributors.json #${index + 1}] Schema validation failed: ${issues}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateReadingGuide(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const guideFile = path.join(CONTENT_CONFIG_DIR, "reading-guide.json");

  if (!fs.existsSync(guideFile)) {
    return { valid: true, errors: [] };
  }

  let parsed: unknown;
  try {
    const raw = fs.readFileSync(guideFile, "utf-8");
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`[content/config/reading-guide.json] Invalid JSON format: ${msg}`);
    return { valid: false, errors };
  }

  const result = readingGuideSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    errors.push(`[content/config/reading-guide.json] Schema validation failed: ${issues}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateTriviaDirectory(dirPath = CONTENT_TRIVIA_DIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validArcSlugs = getValidArcSlugs();
  const seenIds = new Map<string, string>();

  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [] };
  }

  const entries = fs.readdirSync(dirPath);
  const jsonFiles = entries.filter((file) => file.endsWith(".json") && !file.startsWith("_"));

  for (const filename of jsonFiles) {
    const fullPath = path.join(dirPath, filename);
    let parsed: unknown;

    try {
      const rawContent = fs.readFileSync(fullPath, "utf-8");
      parsed = JSON.parse(rawContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${filename}] Invalid JSON format: ${msg}`);
      continue;
    }

    const result = triviaEntrySchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ");
      errors.push(`[${filename}] Schema validation failed: ${issues}`);
      continue;
    }

    const data = result.data;
    const expectedId = filename.replace(/\.trivia\.json$/, "").replace(/\.json$/, "");
    if (data.id !== expectedId) {
      errors.push(`[${filename}] ID mismatch: JSON contains id "${data.id}", expected "${expectedId}"`);
    }

    if (seenIds.has(data.id)) {
      errors.push(`[${filename}] Duplicate trivia ID "${data.id}" already defined in "${seenIds.get(data.id)}"`);
    } else {
      seenIds.set(data.id, filename);
    }

    if (!validArcSlugs.has(data.arc)) {
      errors.push(`[${filename}] Unknown arc slug: "${data.arc}". Valid arc slugs are: ${Array.from(validArcSlugs).sort().join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCharactersDirectory(dirPath = CONTENT_CHARACTERS_DIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validArcSlugs = getValidArcSlugs();
  const seenIds = new Map<string, string>();

  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [] };
  }

  const entries = fs.readdirSync(dirPath);
  const jsonFiles = entries.filter((file) => file.endsWith(".json") && !file.startsWith("_"));

  for (const filename of jsonFiles) {
    const fullPath = path.join(dirPath, filename);
    let parsed: unknown;

    try {
      const rawContent = fs.readFileSync(fullPath, "utf-8");
      parsed = JSON.parse(rawContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${filename}] Invalid JSON format: ${msg}`);
      continue;
    }

    const result = characterSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ");
      errors.push(`[${filename}] Schema validation failed: ${issues}`);
      continue;
    }

    const data = result.data;
    const expectedId = filename.replace(/\.json$/, "");
    if (data.id !== expectedId) {
      errors.push(`[${filename}] ID mismatch: JSON contains id "${data.id}", expected "${expectedId}"`);
    }

    if (seenIds.has(data.id)) {
      errors.push(`[${filename}] Duplicate character ID "${data.id}" already defined in "${seenIds.get(data.id)}"`);
    } else {
      seenIds.set(data.id, filename);
    }

    if (!validArcSlugs.has(data.arc)) {
      errors.push(`[${filename}] Unknown arc slug: "${data.arc}". Valid arc slugs are: ${Array.from(validArcSlugs).sort().join(", ")}`);
    }

    for (const alias of data.aliases) {
      if (!validArcSlugs.has(alias.arc)) {
        errors.push(`[${filename}] Unknown arc slug "${alias.arc}" for alias "${alias.name}". Valid arc slugs are: ${Array.from(validArcSlugs).sort().join(", ")}`);
      }
    }

    if (data.divineProtections) {
      for (const dp of data.divineProtections) {
        if (!validArcSlugs.has(dp.arc)) {
          errors.push(`[${filename}] Unknown arc slug "${dp.arc}" for divine protection "${dp.name}". Valid arc slugs are: ${Array.from(validArcSlugs).sort().join(", ")}`);
        }
      }
    }

    if (data.authorities) {
      for (const auth of data.authorities) {
        if (!validArcSlugs.has(auth.arc)) {
          errors.push(`[${filename}] Unknown arc slug "${auth.arc}" for authority "${auth.name}". Valid arc slugs are: ${Array.from(validArcSlugs).sort().join(", ")}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateAnimeContent(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validArcSlugs = getValidArcSlugs();
  const animeDir = path.join(ROOT_DIR, "content", "anime");
  const configFile = path.join(animeDir, "config.json");

  if (!fs.existsSync(animeDir) || !fs.existsSync(configFile)) {
    return { valid: true, errors: [] };
  }

  // 1. Validate config.json
  let configRaw: unknown;
  try {
    configRaw = JSON.parse(fs.readFileSync(configFile, "utf-8"));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`[anime/config.json] Invalid JSON format: ${msg}`);
    return { valid: false, errors };
  }

  if (!Array.isArray(configRaw)) {
    errors.push(`[anime/config.json] Must be a JSON array of anime catalog entries`);
    return { valid: false, errors };
  }

  const validSeasonIds = new Set<string>();

  configRaw.forEach((entry, idx) => {
    const result = animeCatalogEntrySchema.safeParse(entry);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ");
      errors.push(`[anime/config.json #${idx + 1}] Schema validation failed: ${issues}`);
      return;
    }

    const data = result.data;
    if (validSeasonIds.has(data.id)) {
      errors.push(`[anime/config.json] Duplicate season id "${data.id}"`);
    } else {
      validSeasonIds.add(data.id);
    }

    for (const arc of data.arcs) {
      if (!validArcSlugs.has(arc)) {
        errors.push(
          `[anime/config.json ${data.id}] Invalid arc slug "${arc}". Valid arcs: ${Array.from(validArcSlugs).sort().join(", ")}`
        );
      }
    }
  });

  // 2. Validate all season directories and episode files
  const entries = fs.readdirSync(animeDir, { withFileTypes: true });
  for (const dirEntry of entries) {
    if (!dirEntry.isDirectory()) continue;
    const seasonId = dirEntry.name;
    if (!validSeasonIds.has(seasonId)) {
      errors.push(`[anime/${seasonId}] Directory found without corresponding entry in config.json`);
      continue;
    }

    const seasonDir = path.join(animeDir, seasonId);
    const files = fs.readdirSync(seasonDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json") && !f.startsWith("_"));

    for (const filename of jsonFiles) {
      const epNumStr = filename.replace(/\.json$/, "");
      if (!/^\d+$/.test(epNumStr)) {
        errors.push(`[anime/${seasonId}/${filename}] Filename must be a number followed by .json (e.g. 1.json)`);
        continue;
      }
      const epNum = parseInt(epNumStr, 10);
      const filePath = path.join(seasonDir, filename);

      let parsed: unknown;
      try {
        parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[anime/${seasonId}/${filename}] Invalid JSON format: ${msg}`);
        continue;
      }

      const result = episodeCommentarySchema.safeParse(parsed);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
          .join("; ");
        errors.push(`[anime/${seasonId}/${filename}] Schema validation failed: ${issues}`);
        continue;
      }

      const ep = result.data;
      if (ep.seasonId !== seasonId) {
        errors.push(
          `[anime/${seasonId}/${filename}] seasonId mismatch: JSON specifies "${ep.seasonId}", expected "${seasonId}"`
        );
      }
      if (ep.episodeNumber !== epNum) {
        errors.push(
          `[anime/${seasonId}/${filename}] episodeNumber mismatch: JSON specifies ${ep.episodeNumber}, expected ${epNum}`
        );
      }

      // Check comments numbering integrity
      const seenCommentIds = new Set<number>();
      for (let i = 0; i < ep.comments.length; i++) {
        const comment = ep.comments[i];
        if (seenCommentIds.has(comment.id)) {
          errors.push(
            `[anime/${seasonId}/${filename}] Duplicate comment ID #${comment.id}`
          );
        } else {
          seenCommentIds.add(comment.id);
        }
        if (comment.id !== i + 1) {
          errors.push(
            `[anime/${seasonId}/${filename}] Non-sequential comment ID #${comment.id}, expected #${i + 1}`
          );
        }

        // Validate character and topic tags if present
        for (const char of comment.characters) {
          if (!char || !char.trim()) {
            errors.push(
              `[anime/${seasonId}/${filename}] Empty character tag found in comment #${comment.id}`
            );
          }
        }
        for (const topic of comment.topics) {
          if (!topic || !topic.trim()) {
            errors.push(
              `[anime/${seasonId}/${filename}] Empty topic tag found in comment #${comment.id}`
            );
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTwitterShortStoriesDirectory(dirPath = CONTENT_TWITTER_STORIES_DIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validArcSlugs = getValidArcSlugs();
  const seenIds = new Map<string, string>();

  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [] };
  }

  const entries = fs.readdirSync(dirPath);
  const jsonFiles = entries.filter((file) => file.endsWith(".json") && !file.startsWith("_"));

  for (const filename of jsonFiles) {
    const fullPath = path.join(dirPath, filename);
    let parsed: unknown;

    try {
      const rawContent = fs.readFileSync(fullPath, "utf-8");
      parsed = JSON.parse(rawContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${filename}] Invalid JSON format: ${msg}`);
      continue;
    }

    const result = twitterShortStorySchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ");
      errors.push(`[${filename}] Schema validation failed: ${issues}`);
      continue;
    }

    const data = result.data;
    const expectedId = filename.replace(/\.json$/, "");
    if (data.id !== expectedId) {
      errors.push(`[${filename}] ID mismatch: JSON contains id "${data.id}", expected "${expectedId}"`);
    }

    if (seenIds.has(data.id)) {
      errors.push(`[${filename}] Duplicate twitter short story ID "${data.id}" already defined in "${seenIds.get(data.id)}"`);
    } else {
      seenIds.set(data.id, filename);
    }

    if (data.arc && !validArcSlugs.has(data.arc)) {
      errors.push(`[${filename}] Unknown arc slug: "${data.arc}". Valid arc slugs are: ${Array.from(validArcSlugs).sort().join(", ")}`);
    }

    for (const char of data.characters) {
      if (!char || !char.trim()) {
        errors.push(`[${filename}] Empty character tag found in story ${data.id}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTimelineContent(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!fs.existsSync(CONTENT_TIMELINE_DIR)) {
    errors.push("Missing directory content/timeline/");
    return { valid: false, errors };
  }

  const erasFile = path.join(CONTENT_TIMELINE_DIR, "eras.json");
  if (!fs.existsSync(erasFile)) {
    errors.push("Missing required file content/timeline/eras.json");
    return { valid: false, errors };
  }

  const validEraIds = new Set<string>();
  try {
    const raw = fs.readFileSync(erasFile, "utf-8");
    const parsed = JSON.parse(raw);
    const result = timelineEraSchema.array().safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`[eras.json] Schema error at ${issue.path.join(".")}: ${issue.message}`);
      }
    } else {
      for (const era of result.data) {
        if (validEraIds.has(era.id)) {
          errors.push(`[eras.json] Duplicate era ID "${era.id}"`);
        }
        validEraIds.add(era.id);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`[eras.json] Failed to read or parse: ${msg}`);
  }

  const files = fs.readdirSync(CONTENT_TIMELINE_DIR);
  const seenEventIds = new Map<string, string>();

  for (const filename of files) {
    if (filename === "eras.json" || !filename.endsWith(".json") || filename.startsWith("_")) {
      continue;
    }
    const fullPath = path.join(CONTENT_TIMELINE_DIR, filename);
    if (fs.statSync(fullPath).isDirectory()) {
      continue;
    }
    const expectedEraId = filename.replace(/\.json$/, "");

    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = JSON.parse(raw);
      const result = timelineEventSchema.array().safeParse(parsed);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(`[${filename}] Schema error at ${issue.path.join(".")}: ${issue.message}`);
        }
        continue;
      }

      for (const event of result.data) {
        if (seenEventIds.has(event.id)) {
          errors.push(`[${filename}] Duplicate event ID "${event.id}" already seen in "${seenEventIds.get(event.id)}"`);
        } else {
          seenEventIds.set(event.id, filename);
        }

        if (!validEraIds.has(event.eraId)) {
          errors.push(`[${filename}] Unknown eraId "${event.eraId}" on event "${event.id}"`);
        }

        if (event.eraId !== expectedEraId) {
          errors.push(`[${filename}] Event "${event.id}" has eraId "${event.eraId}" but is in file "${filename}"`);
        }

        if (event.importance < 1 || event.importance > 5) {
          errors.push(`[${filename}] Event "${event.id}" has invalid importance factor ${event.importance} (must be 1-5)`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${filename}] Failed to read or parse: ${msg}`);
    }
  }

  // Validate IF divergence routes in content/timeline/ifs/
  const ifsDir = path.join(CONTENT_TIMELINE_DIR, "ifs");
  if (fs.existsSync(ifsDir)) {
    const ifFiles = fs.readdirSync(ifsDir);
    for (const ifFile of ifFiles) {
      if (!ifFile.endsWith(".json")) continue;
      const ifPath = path.join(ifsDir, ifFile);
      try {
        const raw = fs.readFileSync(ifPath, "utf-8");
        const parsed = JSON.parse(raw);
        const result = timelineIfRouteSchema.safeParse(parsed);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push(`[ifs/${ifFile}] Schema error at ${issue.path.join(".")}: ${issue.message}`);
          }
        } else {
          // Verify that divergence event exists in canon timeline
          if (!seenEventIds.has(result.data.divergesFromEventId)) {
            errors.push(`[ifs/${ifFile}] Divergence event "${result.data.divergesFromEventId}" not found in any canon era`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[ifs/${ifFile}] Failed to read or parse: ${msg}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateConstellationsDirectory(dirPath = CONTENT_CONSTELLATIONS_DIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!fs.existsSync(dirPath)) {
    return { valid: true, errors: [] };
  }

  const starsFile = path.join(dirPath, "stars.json");
  const constellationsFile = path.join(dirPath, "constellations.json");
  const characterStarsFile = path.join(dirPath, "character-stars.json");

  const validStarIds = new Set<string>();

  if (fs.existsSync(starsFile)) {
    try {
      const stars = JSON.parse(fs.readFileSync(starsFile, "utf-8"));
      if (!Array.isArray(stars)) {
        errors.push("stars.json must be an array");
      } else {
        stars.forEach((s, idx) => {
          const res = starSchema.safeParse(s);
          if (!res.success) {
            errors.push(`stars.json [${idx}]: ${res.error.message}`);
          } else {
            validStarIds.add(res.data.id);
          }
        });
      }
    } catch (e: unknown) {
      errors.push(`stars.json failed to parse: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (fs.existsSync(constellationsFile)) {
    try {
      const constellations = JSON.parse(fs.readFileSync(constellationsFile, "utf-8"));
      if (!Array.isArray(constellations)) {
        errors.push("constellations.json must be an array");
      } else {
        constellations.forEach((c, idx) => {
          const res = constellationSchema.safeParse(c);
          if (!res.success) {
            errors.push(`constellations.json [${idx}]: ${res.error.message}`);
          } else {
            for (const [starA, starB] of res.data.lines) {
              if (!validStarIds.has(starA)) {
                errors.push(`constellations.json [${c.id}]: star '${starA}' in lines does not exist in stars.json`);
              }
              if (!validStarIds.has(starB)) {
                errors.push(`constellations.json [${c.id}]: star '${starB}' in lines does not exist in stars.json`);
              }
            }
          }
        });
      }
    } catch (e: unknown) {
      errors.push(`constellations.json failed to parse: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (fs.existsSync(characterStarsFile)) {
    try {
      const charStars = JSON.parse(fs.readFileSync(characterStarsFile, "utf-8"));
      if (!Array.isArray(charStars)) {
        errors.push("character-stars.json must be an array");
      } else {
        charStars.forEach((cs, idx) => {
          const res = characterStarSchema.safeParse(cs);
          if (!res.success) {
            errors.push(`character-stars.json [${idx}]: ${res.error.message}`);
          } else {
            if (!validStarIds.has(res.data.starId)) {
              errors.push(`character-stars.json [${cs.characterId}]: star '${res.data.starId}' does not exist in stars.json`);
            }
          }
        });
      }
    } catch (e: unknown) {
      errors.push(`character-stars.json failed to parse: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function run() {
  console.log("Validating Q&A content in content/qna/...");
  const qnaResult = validateQnaDirectory();

  console.log("Validating trivia content in content/trivia/...");
  const triviaResult = validateTriviaDirectory();

  console.log("Validating characters in content/characters/...");
  const charactersResult = validateCharactersDirectory();

  console.log("Validating contributors in content/config/contributors.json...");
  const contributorsResult = validateContributors();

  console.log("Validating anime content in content/anime/...");
  const animeResult = validateAnimeContent();

  console.log("Validating twitter short stories in content/twitter-short-stories/...");
  const twitterStoriesResult = validateTwitterShortStoriesDirectory();

  console.log("Validating reading guide in content/config/reading-guide.json...");
  const readingGuideResult = validateReadingGuide();

  console.log("Validating world timeline in content/timeline/...");
  const timelineResult = validateTimelineContent();

  console.log("Validating constellations in content/constellations/...");
  const constellationsResult = validateConstellationsDirectory();

  const allErrors = [
    ...qnaResult.errors,
    ...triviaResult.errors,
    ...charactersResult.errors,
    ...contributorsResult.errors,
    ...readingGuideResult.errors,
    ...animeResult.errors,
    ...twitterStoriesResult.errors,
    ...timelineResult.errors,
    ...constellationsResult.errors,
  ];

  if (allErrors.length > 0) {
    console.error(`\n❌ Content validation failed with ${allErrors.length} error(s):`);
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log("✓ All content files passed validation successfully.");
}

if (require.main === module) {
  run();
}

