import fs from "node:fs";
import path from "node:path";
import { qnaEntrySchema, ArcConfig, IfRouteConfig } from "../lib/schema";

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

function run() {
  console.log("Validating Q&A content in content/qna/...");
  const { valid, errors } = validateQnaDirectory();

  if (!valid) {
    console.error(`\n❌ Content validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log("✓ All content files passed validation successfully.");
}

if (require.main === module) {
  run();
}
