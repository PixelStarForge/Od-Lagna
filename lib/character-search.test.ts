import assert from "node:assert";
import fs from "node:fs";
import {
  getAllCharacterProfiles,
  getAllCharacterCatalogItems,
  getCharacterDetailWithRelated,
  getAllQnas,
} from "./content-loader";
import { matchesCharacterTag } from "./character-utils";

console.log("Running comprehensive character search and disambiguation tests...\n");

// 1. Verify character profiles exist separately
const profiles = getAllCharacterProfiles();
const spicaProfile = profiles.find((p) => p.id === "spica");
const natsukiSpicaProfile = profiles.find((p) => p.id === "natsuki-spica");

assert(spicaProfile !== undefined, "Spica profile (id: spica) must exist");
assert(natsukiSpicaProfile !== undefined, "Natsuki Spica profile (id: natsuki-spica) must exist");
assert.strictEqual(spicaProfile.name, "Spica");
assert.strictEqual(natsukiSpicaProfile.name, "Natsuki Spica");
assert(
  !natsukiSpicaProfile.aliases ||
    !natsukiSpicaProfile.aliases.some((a) => a.name.toLowerCase() === "spica"),
  "Natsuki Spica must NOT have alias 'Spica' to avoid collision with canon Spica"
);
console.log("✓ Character profiles 'spica' and 'natsuki-spica' exist distinctly without alias collisions");

// 2. Character detail resolution by idOrSlug
const spicaDetail = getCharacterDetailWithRelated("spica");
assert(spicaDetail !== null, "getCharacterDetailWithRelated('spica') must not be null");
assert.strictEqual(
  spicaDetail?.character.id,
  "spica",
  "getCharacterDetailWithRelated('spica') must return Spica, not Natsuki Spica"
);

const natsukiSpicaDetail = getCharacterDetailWithRelated("natsuki-spica");
assert(natsukiSpicaDetail !== null, "getCharacterDetailWithRelated('natsuki-spica') must not be null");
assert.strictEqual(
  natsukiSpicaDetail?.character.id,
  "natsuki-spica",
  "getCharacterDetailWithRelated('natsuki-spica') must return Natsuki Spica"
);
console.log("✓ getCharacterDetailWithRelated resolves distinct characters correctly");

// 3. CharactersClient activeCharacter resolution logic
const catalog = getAllCharacterCatalogItems();

function resolveActiveCharacter(characterParam: string | null) {
  if (!characterParam) return null;
  const cleanParam = characterParam.trim().toLowerCase();

  const exactId = catalog.find((c) => c.id.toLowerCase() === cleanParam);
  if (exactId) return exactId;

  const exactName = catalog.find((c) => c.name.toLowerCase() === cleanParam);
  if (exactName) return exactName;

  const exactAlias = catalog.find((c) =>
    c.aliases?.some((a) => a.name.toLowerCase() === cleanParam)
  );
  if (exactAlias) return exactAlias;

  return (
    catalog.find(
      (c) =>
        c.id.toLowerCase().includes(cleanParam) ||
        c.name.toLowerCase().includes(cleanParam) ||
        c.aliases?.some((a) => a.name.toLowerCase() === cleanParam)
    ) ?? null
  );
}

const resolvedForSpicaId = resolveActiveCharacter("spica");
assert.strictEqual(
  resolvedForSpicaId?.id,
  "spica",
  "Lookup for id 'spica' MUST resolve to character 'spica', NOT 'natsuki-spica'"
);

const resolvedForNatsukiSpicaId = resolveActiveCharacter("natsuki-spica");
assert.strictEqual(
  resolvedForNatsukiSpicaId?.id,
  "natsuki-spica",
  "Lookup for id 'natsuki-spica' MUST resolve to character 'natsuki-spica'"
);

const resolvedForSpicaName = resolveActiveCharacter("Spica");
assert.strictEqual(
  resolvedForSpicaName?.id,
  "spica",
  "Lookup for name 'Spica' MUST resolve to character 'spica'"
);

const resolvedForNatsukiSpicaName = resolveActiveCharacter("Natsuki Spica");
assert.strictEqual(
  resolvedForNatsukiSpicaName?.id,
  "natsuki-spica",
  "Lookup for name 'Natsuki Spica' MUST resolve to character 'natsuki-spica'"
);

const resolvedForBarusu = resolveActiveCharacter("Barusu");
assert.strictEqual(
  resolvedForBarusu?.id,
  "natsuki-subaru",
  "Lookup for alias 'Barusu' MUST resolve to character 'natsuki-subaru'"
);
console.log("✓ Priority-based activeCharacter resolution passed");

// 4. matchesCharacterTag distinction
assert.strictEqual(
  matchesCharacterTag(spicaProfile, "Spica"),
  true,
  "Spica profile matches tag 'Spica'"
);
assert.strictEqual(
  matchesCharacterTag(spicaProfile, "Natsuki Spica"),
  false,
  "Spica profile must not match tag 'Natsuki Spica'"
);
assert.strictEqual(
  matchesCharacterTag(natsukiSpicaProfile, "Natsuki Spica"),
  true,
  "Natsuki Spica profile matches tag 'Natsuki Spica'"
);
assert.strictEqual(
  matchesCharacterTag(natsukiSpicaProfile, "Spica"),
  false,
  "Natsuki Spica must NOT match tag 'Spica' because they are different characters"
);
console.log("✓ matchesCharacterTag correctly distinguishes Spica and Natsuki Spica");

// 5. SearchModal ranking simulation
function matchSearchModalProfiles(query: string, characterProfiles: typeof profiles) {
  const q = query.trim().toLowerCase();
  const cleanQ = q.replace(/^#/, "").replace(/^qna[\s#-]+/i, "").trim();
  const tokens = q.split(/\s+/).filter(Boolean);

  return characterProfiles
    .map((prof) => {
      const nameLower = prof.name.toLowerCase();
      const idLower = prof.id.toLowerCase();
      const jpLower = (prof.japaneseName || "").toLowerCase();
      const aliasesLower = (prof.aliases || []).map((a) => a.name.toLowerCase());
      const hay = `${nameLower} ${jpLower} ${aliasesLower.join(" ")}`;

      const matches =
        tokens.length <= 1
          ? hay.includes(q) || (cleanQ && hay.includes(cleanQ))
          : tokens.every((tok) => hay.includes(tok));

      if (!matches) return null;

      let score = 0;
      if (nameLower === q || idLower === q || (cleanQ && (nameLower === cleanQ || idLower === cleanQ))) {
        score += 1000;
      } else if (nameLower.startsWith(q) || idLower.startsWith(q)) {
        score += 500;
      } else if (jpLower === q || jpLower === cleanQ) {
        score += 400;
      } else if (aliasesLower.includes(q) || (cleanQ && aliasesLower.includes(cleanQ))) {
        score += 300;
      } else if (nameLower.includes(q)) {
        score += 200;
      } else if (aliasesLower.some((a) => a.includes(q))) {
        score += 100;
      }

      return { prof, score };
    })
    .filter((item): item is { prof: (typeof profiles)[number]; score: number } => item !== null)
    .sort((a, b) => b.score - a.score || a.prof.name.localeCompare(b.prof.name))
    .map((item) => item.prof);
}

const spicaSearchMatches = matchSearchModalProfiles("spica", profiles);
assert(spicaSearchMatches.length >= 2, "Expected matches for 'spica'");
assert.strictEqual(
  spicaSearchMatches[0].id,
  "spica",
  "SearchModal top result for 'spica' MUST be 'spica', NOT 'natsuki-spica'"
);
assert.strictEqual(
  spicaSearchMatches[1].id,
  "natsuki-spica",
  "SearchModal second result for 'spica' should be 'natsuki-spica'"
);

const natsukiSpicaSearchMatches = matchSearchModalProfiles("natsuki spica", profiles);
assert(natsukiSpicaSearchMatches.length >= 1, "Expected matches for 'natsuki spica'");
assert.strictEqual(
  natsukiSpicaSearchMatches[0].id,
  "natsuki-spica",
  "SearchModal top result for 'natsuki spica' MUST be 'natsuki-spica'"
);
console.log("✓ SearchModal ranking correctly prioritizes exact matches");

// 6. Q&A attribution checks
const allQnas = getAllQnas();
const qna0158 = allQnas.find((q) => q.id === "0158");
const qna0160 = allQnas.find((q) => q.id === "0160");
const qna1419 = allQnas.find((q) => q.id === "1419");
const qna4178 = allQnas.find((q) => q.id === "4178");

assert(qna0158 && qna0158.characters.includes("Natsuki Spica"), "QnA 0158 must tag Natsuki Spica");
assert(qna0160 && qna0160.characters.includes("Natsuki Rigel") && qna0160.characters.includes("Natsuki Spica"), "QnA 0160 must tag Natsuki Spica");
assert(qna1419 && qna1419.characters.includes("Natsuki Spica"), "QnA 1419 must tag Natsuki Spica");
assert(qna4178 && qna4178.characters.includes("Spica") && !qna4178.characters.includes("Natsuki Spica"), "QnA 4178 must tag Spica");

console.log("✓ Q&A tagging accurately reflects character identities");

// 7. Verify search-index.json contains both character profiles
const searchIndexRaw = fs.readFileSync("public/search-index.json", "utf8");
const searchIndex = JSON.parse(searchIndexRaw);
const indexProfiles: { id: string; name: string }[] = searchIndex.characterProfiles || [];
const indexedSpica = indexProfiles.find((p) => p.id === "spica");
const indexedNatsukiSpica = indexProfiles.find((p) => p.id === "natsuki-spica");

assert(indexedSpica !== undefined, "public/search-index.json must contain Spica profile");
assert(indexedNatsukiSpica !== undefined, "public/search-index.json must contain Natsuki Spica profile");
assert.strictEqual(indexedSpica.name, "Spica");
assert.strictEqual(indexedNatsukiSpica.name, "Natsuki Spica");
console.log("✓ public/search-index.json contains both profiles cleanly");

console.log("\n==============================================");
console.log("All 7 verification test suites passed cleanly!");
console.log("==============================================");
