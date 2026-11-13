import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = path.resolve(__dirname, "..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const CARGO_TOML_PATH = path.join(ROOT_DIR, "src-tauri", "Cargo.toml");

function parseSemver(v: string) {
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
  };
}

function calculateNextVersion(current: string, bumpType: string): string {
  const parsed = parseSemver(current);
  if (!parsed) {
    throw new Error(`Current version "${current}" is not valid semver.`);
  }

  const { major, minor, patch } = parsed;

  switch (bumpType.toLowerCase()) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      if (!parseSemver(bumpType)) {
        throw new Error(
          `Invalid bump target "${bumpType}". Must be "patch", "minor", "major", or a valid semver (e.g. "0.1.8").`
        );
      }
      return bumpType;
  }
}

function main() {
  const args = process.argv.slice(2);
  const shouldCommit = args.includes("--commit");
  const filteredArgs = args.filter((a) => !a.startsWith("--"));

  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error(`Error: package.json not found at ${PACKAGE_JSON_PATH}`);
    process.exit(1);
  }

  const pkgRaw = fs.readFileSync(PACKAGE_JSON_PATH, "utf-8");
  const pkg = JSON.parse(pkgRaw);
  const currentVersion = pkg.version;

  if (filteredArgs.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`Current version: ${currentVersion}\n`);
    console.log(`Usage: npm run bump <patch | minor | major | <version>> [--commit]\n`);
    console.log(`Examples:`);
    console.log(`  npm run bump patch          # -> ${calculateNextVersion(currentVersion, "patch")}`);
    console.log(`  npm run bump minor          # -> ${calculateNextVersion(currentVersion, "minor")}`);
    console.log(`  npm run bump major          # -> ${calculateNextVersion(currentVersion, "major")}`);
    console.log(`  npm run bump 0.2.5          # explicit version`);
    console.log(`  npm run bump patch --commit # update files and create git commit + tag`);
    process.exit(0);
  }

  const bumpType = filteredArgs[0];
  const newVersion = calculateNextVersion(currentVersion, bumpType);

  console.log(`\nBumping version: ${currentVersion} -> ${newVersion}\n`);

  // 1. Update package.json
  const updatedPkgRaw = pkgRaw.replace(
    /"version":\s*"[^"]+"/,
    `"version": "${newVersion}"`
  );
  fs.writeFileSync(PACKAGE_JSON_PATH, updatedPkgRaw, "utf-8");
  console.log(`✓ Updated package.json`);

  // 2. Update src-tauri/Cargo.toml
  if (fs.existsSync(CARGO_TOML_PATH)) {
    const cargoRaw = fs.readFileSync(CARGO_TOML_PATH, "utf-8");
    const updatedCargoRaw = cargoRaw.replace(
      /^version\s*=\s*"[^"]+"/m,
      `version = "${newVersion}"`
    );
    fs.writeFileSync(CARGO_TOML_PATH, updatedCargoRaw, "utf-8");
    console.log(`✓ Updated src-tauri/Cargo.toml`);

    // 3. Sync Cargo.lock
    try {
      console.log(`Syncing src-tauri/Cargo.lock...`);
      execSync("cargo check --manifest-path src-tauri/Cargo.toml", {
        stdio: "ignore",
        cwd: ROOT_DIR,
      });
      console.log(`✓ Synced src-tauri/Cargo.lock`);
    } catch {
      console.warn(`⚠ Warning: cargo check failed or cargo not found. Please sync Cargo.lock manually.`);
    }
  }

  // 4. Git commit & tag
  if (shouldCommit) {
    try {
      execSync(
        `git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock`,
        { stdio: "inherit", cwd: ROOT_DIR }
      );
      execSync(
        `git commit -m "chore(release): bump version to ${newVersion}"`,
        { stdio: "inherit", cwd: ROOT_DIR }
      );
      execSync(
        `git tag -a v${newVersion} -m "Release v${newVersion}"`,
        { stdio: "inherit", cwd: ROOT_DIR }
      );
      console.log(`\n✓ Git commit and tag created: v${newVersion}`);
      console.log(`\nTo push to origin:\n  git push origin main --follow-tags\n`);
    } catch (err) {
      console.error(`\nFailed to create git commit/tag:`, err);
      process.exit(1);
    }
  } else {
    console.log(`\nAll files updated! Next, commit and tag:`);
    console.log(`  git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock`);
    console.log(`  git commit -m "chore(release): bump version to ${newVersion}"`);
    console.log(`  git tag -a v${newVersion} -m "Release v${newVersion}"`);
    console.log(`  git push origin main --follow-tags\n`);
  }
}

main();

