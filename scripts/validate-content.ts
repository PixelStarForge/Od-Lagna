import fs from "node:fs";
import path from "node:path";
import { qnaEntrySchema, ArcConfig, IfRouteConfig, contributorSchema } from "../lib/schema";

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_CONFIG_DIR = path.join(ROOT_DIR, "content", "config");
const CONTENT_QNA_DIR = path.join(ROOT_DIR, "content", "qna");

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

function run() {
  console.log("Validating Q&A content in content/qna/...");
  const qnaResult = validateQnaDirectory();

  console.log("Validating contributors in content/config/contributors.json...");
  const contributorsResult = validateContributors();

  const allErrors = [...qnaResult.errors, ...contributorsResult.errors];

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

