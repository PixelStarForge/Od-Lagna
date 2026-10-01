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
} from "../lib/schema";

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_CONFIG_DIR = path.join(ROOT_DIR, "content", "config");
const CONTENT_QNA_DIR = path.join(ROOT_DIR, "content", "qna");
const CONTENT_TRIVIA_DIR = path.join(ROOT_DIR, "content", "trivia");
const CONTENT_CHARACTERS_DIR = path.join(ROOT_DIR, "content", "characters");

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
      }
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

  const allErrors = [
    ...qnaResult.errors,
    ...triviaResult.errors,
    ...charactersResult.errors,
    ...contributorsResult.errors,
    ...animeResult.errors,
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

