import {
  qnaEntrySchema,
  getEntrySources,
  contributorSchema,
  characterSchema,
  animeCatalogEntrySchema,
  authorCommentSchema,
  episodeCommentarySchema,
} from "./schema";
import {
  getAnimeCatalog,
  getAnimeSeason,
  getSeasonEpisodes,
  getEpisodeCommentary,
  getAnimeStats,
  getAllAnimeComments,
  clearAnimeCache,
} from "./anime-loader";
import {
  getAllContributors,
  getAllCharacterProfiles,
  getCharacterProfileById,
  getAllCharacterCatalogItems,
  getCharacterDetailWithRelated,
  slugifyCharacterName,
} from "./content-loader";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Running lib/schema.test.ts...\n");

// 1. Single source object (legacy backward compatibility)
console.log("1. Testing legacy single source object...");
const singleSourceEntry = {
  id: "test-0001",
  question: "Who is Rem?",
  answer: "Rem is a maid in the Roswaal mansion.",
  arc: "general",
  characters: ["Rem"],
  topics: ["General"],
  source: {
    type: "url" as const,
    value: "https://twitter.com/nezumiironyanko/status/123",
  },
  verified: true,
};
const parsedSingle = qnaEntrySchema.parse(singleSourceEntry);
const singleSources = getEntrySources(parsedSingle);
assert(singleSources.length === 1, `Expected 1 source, got ${singleSources.length}`);
assert(singleSources[0].type === "url", `Expected url, got ${singleSources[0].type}`);
assert(singleSources[0].value === "https://twitter.com/nezumiironyanko/status/123", "Value mismatch");
console.log("✓ Single source object passed");

// 2. Multiple sources via 'sources' array
console.log("\n2. Testing multiple sources via 'sources' array...");
const multiSourcesEntry = {
  id: "test-0002",
  question: "What is Return by Death?",
  answer: "Subaru's authority.",
  arc: "general",
  characters: ["Subaru"],
  topics: ["Authorities"],
  sources: [
    { type: "url" as const, value: "https://twitter.com/nezumiironyanko/status/456" },
    { type: "text" as const, value: "2018 Birthday Q&A" },
  ],
  verified: true,
};
const parsedMulti = qnaEntrySchema.parse(multiSourcesEntry);
const multiSources = getEntrySources(parsedMulti);
assert(multiSources.length === 2, `Expected 2 sources, got ${multiSources.length}`);
assert(multiSources[0].type === "url", "Expected first source to be url");
assert(multiSources[1].type === "text", "Expected second source to be text");
assert(multiSources[1].value === "2018 Birthday Q&A", "Second source value mismatch");
console.log("✓ Multiple sources via 'sources' array passed");

// 3. Multiple sources via 'source' array
console.log("\n3. Testing multiple sources via 'source' array...");
const multiSourceArrayEntry = {
  id: "test-0003",
  question: "Who is Emilia?",
  answer: "Half-elf candidate.",
  arc: "general",
  characters: ["Emilia"],
  topics: ["Royal Selection"],
  source: [
    { type: "url" as const, value: "https://twitter.com/nezumiironyanko/status/789" },
    { type: "text" as const, value: "Volume 10 Author Afterword" },
  ],
  verified: true,
};
const parsedSourceArray = qnaEntrySchema.parse(multiSourceArrayEntry);
const sourceArrayResult = getEntrySources(parsedSourceArray);
assert(sourceArrayResult.length === 2, `Expected 2 sources, got ${sourceArrayResult.length}`);
assert(sourceArrayResult[0].value === "https://twitter.com/nezumiironyanko/status/789", "Value mismatch");
assert(sourceArrayResult[1].value === "Volume 10 Author Afterword", "Value mismatch");
console.log("✓ Multiple sources via 'source' array passed");

// 4. Precedence: 'sources' takes precedence if both provided
console.log("\n4. Testing precedence when both 'sources' and 'source' are provided...");
const bothEntry = {
  id: "test-0004",
  question: "Test question",
  answer: "Test answer",
  arc: "general",
  characters: [],
  topics: [],
  source: { type: "text" as const, value: "Legacy fallback" },
  sources: [
    { type: "url" as const, value: "https://primary.source/1" },
    { type: "url" as const, value: "https://secondary.source/2" },
  ],
  verified: false,
};
const parsedBoth = qnaEntrySchema.parse(bothEntry);
const bothResult = getEntrySources(parsedBoth);
assert(bothResult.length === 2, `Expected 2 sources, got ${bothResult.length}`);
assert(bothResult[0].value === "https://primary.source/1", "Expected sources to take precedence");
console.log("✓ Precedence test passed");

// 5. Validation failure when neither 'source' nor 'sources' is present
console.log("\n5. Testing validation rejection when neither 'source' nor 'sources' is provided...");
const missingSourceEntry = {
  id: "test-0005",
  question: "Missing source?",
  answer: "Yes",
  arc: "general",
  characters: [],
  topics: [],
  verified: false,
};
const missingResult = qnaEntrySchema.safeParse(missingSourceEntry);
assert(!missingResult.success, "Schema should fail when no source/sources provided");
console.log("✓ Missing source validation failure passed");

// 6. Validation failure on invalid source type in sources array
console.log("\n6. Testing validation rejection on invalid source type in sources array...");
const invalidTypeEntry = {
  id: "test-0006",
  question: "Invalid type?",
  answer: "Yes",
  arc: "general",
  characters: [],
  topics: [],
  sources: [
    { type: "video", value: "https://youtube.com/..." },
  ],
  verified: false,
};
const invalidTypeResult = qnaEntrySchema.safeParse(invalidTypeEntry);
assert(!invalidTypeResult.success, "Schema should fail when source type is invalid");
console.log("✓ Invalid source type validation failure passed");

// 7. Testing contributor schema with all fields
console.log("\n7. Testing contributor schema with all fields...");
const validContributorFull = {
  username: "u/Affectionate_Run6250",
  platform: "Reddit",
  url: "https://www.reddit.com/user/Affectionate_Run6250",
  description: "Curated and provided the master compilation document.",
  contribution: "Master Q&A Compilation Document",
};
const parsedContributorFull = contributorSchema.parse(validContributorFull);
assert(parsedContributorFull.username === "u/Affectionate_Run6250", "Username mismatch");
assert(parsedContributorFull.platform === "Reddit", "Platform mismatch");
assert(parsedContributorFull.url === "https://www.reddit.com/user/Affectionate_Run6250", "URL mismatch");
assert(parsedContributorFull.description === "Curated and provided the master compilation document.", "Description mismatch");
assert(parsedContributorFull.contribution === "Master Q&A Compilation Document", "Contribution mismatch");
console.log("✓ Full contributor passed");

// 8. Testing contributor schema with optional url omitted
console.log("\n8. Testing contributor schema with optional url omitted...");
const validContributorNoUrl = {
  username: "AnonymousHelper",
  platform: "Discord",
  description: "Helped fix several translation typos in Arc 4.",
  contribution: "Arc 4 Typo Fixes",
};
const parsedContributorNoUrl = contributorSchema.parse(validContributorNoUrl);
assert(parsedContributorNoUrl.username === "AnonymousHelper", "Username mismatch");
assert(parsedContributorNoUrl.url === undefined, "URL should be undefined");
console.log("✓ Contributor without optional url passed");

// 9. Testing contributor schema validation failures for missing required fields
console.log("\n9. Testing contributor schema failure on missing required fields...");
const missingUsernameResult = contributorSchema.safeParse({
  platform: "Twitter",
  description: "Desc",
  contribution: "Contribution",
});
assert(!missingUsernameResult.success, "Should fail when username is missing");

const missingPlatformResult = contributorSchema.safeParse({
  username: "test",
  description: "Desc",
  contribution: "Contribution",
});
assert(!missingPlatformResult.success, "Should fail when platform is missing");

const missingDescResult = contributorSchema.safeParse({
  username: "test",
  platform: "Twitter",
  contribution: "Contribution",
});
assert(!missingDescResult.success, "Should fail when description is missing");

const optionalContributionResult = contributorSchema.safeParse({
  username: "test",
  platform: "Twitter",
  description: "Desc",
});
assert(optionalContributionResult.success, "Should succeed when optional contribution is omitted");
console.log("✓ Contributor validation tests passed");

// 10. Testing getAllContributors from content-loader
console.log("\n10. Testing getAllContributors() loader...");
const contributors = getAllContributors();
assert(Array.isArray(contributors), "Expected contributors to be an array");
assert(contributors.length === 4, `Expected 4 contributors, got ${contributors.length}`);
assert(contributors[0].username === "Mildly_Confused_NPC", "Expected first contributor to match");
assert(contributors[1].username === "u/Affectionate_Run6250", "Expected second contributor to match");
assert(contributors[2].username === "Historical-Weird7591", "Expected third contributor to match");
assert(contributors[3].username === "Ehknee", "Expected fourth contributor to match");
console.log("✓ getAllContributors() loader passed");

// 11. Testing characterSchema
console.log("\n11. Testing characterSchema...");
const validAuthChar = {
  id: "test-auth",
  name: "Auth Character",
  arc: "arc-1",
  aliases: [{ name: "Test Alias", arc: "arc-2" }],
  race: "Human",
  description: "A test character description",
  authorities: [{ name: "Authority of Sloth", arc: "arc-4" }],
};
const parsedAuthChar = characterSchema.parse(validAuthChar);
assert(parsedAuthChar.id === "test-auth", "Character ID mismatch");
assert(parsedAuthChar.race === "Human", "Race mismatch");
assert(parsedAuthChar.aliases[0].name === "Test Alias", "Alias name mismatch");

const validDpChar = {
  id: "test-dp",
  name: "DP Character",
  arc: "arc-1",
  description: "A test character description",
  divineProtections: [{ name: "Sword Saint", arc: "arc-1" }],
};
assert(characterSchema.safeParse(validDpChar).success, "Should succeed with divineProtections only");

const bothPowersChar = {
  id: "test-both",
  name: "Both Powers Character",
  arc: "arc-1",
  description: "A test character description",
  divineProtections: [{ name: "Sword Saint", arc: "arc-1" }],
  authorities: [{ name: "Authority of Sloth", arc: "arc-4" }],
};
const bothPowersResult = characterSchema.safeParse(bothPowersChar);
assert(!bothPowersResult.success, "Must reject character having both Divine Protections and Authorities");

const invalidChar = {
  id: "",
  name: "",
};
const invalidCharResult = characterSchema.safeParse(invalidChar);
assert(!invalidCharResult.success, "Should fail on missing required fields for character");
console.log("✓ characterSchema validation tests passed");

// 12. Testing slugifyCharacterName
console.log("\n12. Testing slugifyCharacterName...");
assert(slugifyCharacterName("Natsuki Subaru") === "natsuki-subaru", "Subaru slug mismatch");
assert(slugifyCharacterName("Petelgeuse Romanée-Conti") === "petelgeuse-romanee-conti", "Petelgeuse diacritics slug mismatch");
assert(slugifyCharacterName("Al (Aldebaran)") === "al-aldebaran", "Aldebaran parenthesis slug mismatch");
console.log("✓ slugifyCharacterName passed");

// 13. Testing character profile loaders
console.log("\n13. Testing getAllCharacterProfiles() and getCharacterProfileById()...");
const profiles = getAllCharacterProfiles();
assert(profiles.length >= 1, "Expected at least 1 character profile");
const subaru = getCharacterProfileById("natsuki-subaru");
assert(subaru !== null, "Expected to find Natsuki Subaru profile");
assert(subaru?.name === "Natsuki Subaru", "Subaru name mismatch");
assert(subaru?.arc === "arc-1", "Subaru arc mismatch");
console.log("✓ character profile loaders passed");

// 14. Testing catalog and detail with related
console.log("\n14. Testing getAllCharacterCatalogItems() and getCharacterDetailWithRelated()...");
const catalog = getAllCharacterCatalogItems();
assert(catalog.length >= 1, "Expected catalog to contain characters with profiles");
const subaruInCatalog = catalog.find((c) => c.id === "natsuki-subaru");
assert(subaruInCatalog !== undefined, "Subaru must exist in catalog");
assert(subaruInCatalog?.hasFullProfile === true, "Subaru should have hasFullProfile = true");

const subaruDetail = getCharacterDetailWithRelated("natsuki-subaru");
assert(subaruDetail !== null, "Expected subaruDetail to be returned");
assert(subaruDetail?.character.name === "Natsuki Subaru", "Detail character name mismatch");
assert(Array.isArray(subaruDetail?.qnas), "Expected related Q&As array");
assert(Array.isArray(subaruDetail?.trivia), "Expected related trivia array");
console.log("✓ catalog and detail with related tests passed");

// 15. Testing anime schemas and loader
console.log("\n15. Testing anime schemas and loaders...");
const animeCatalog = getAnimeCatalog();
assert(animeCatalog.length === 5, `Expected 5 anime catalog entries, got ${animeCatalog.length}`);
const s1 = getAnimeSeason("season-1");
assert(s1 !== null && s1.title === "Season 1", "Expected Season 1 entry");
const s1CaseInsensitive = getAnimeSeason("SEASON-1");
assert(s1CaseInsensitive !== null && s1CaseInsensitive.id === "season-1", "Expected case-insensitive match");

const s4Episodes = getSeasonEpisodes("season-4");
assert(s4Episodes.length === 19, `Expected 19 episodes for Season 4, got ${s4Episodes.length}`);
const s4Ep1 = getEpisodeCommentary("season-4", 1);
assert(s4Ep1 !== null && s4Ep1.episodeNumber === 1, "Expected Season 4 Episode 1");
const s4Ep1Str = getEpisodeCommentary("season-4", "01");
assert(s4Ep1Str !== null && s4Ep1Str.episodeNumber === 1, "Expected '01' to normalize to episode 1");

const stats = getAnimeStats();
assert(stats.totalCatalogedEpisodes === 98, `Expected 98 total episodes, got ${stats.totalCatalogedEpisodes}`);
assert(stats.totalComments === 4085, `Expected 4085 author comments, got ${stats.totalComments}`);

// Test authorCommentSchema with and without tags
const untaggedComment = authorCommentSchema.parse({
  id: 1,
  text: "Untagged live-tweet.",
});
assert(Array.isArray(untaggedComment.characters) && untaggedComment.characters.length === 0, "Expected empty characters array by default");
assert(Array.isArray(untaggedComment.topics) && untaggedComment.topics.length === 0, "Expected empty topics array by default");

const taggedComment = authorCommentSchema.parse({
  id: 2,
  text: "Subaru and Emilia in the capital.",
  source: "https://x.com/example",
  characters: ["Natsuki Subaru", "Emilia"],
  topics: ["Lore", "Emilia Camp"],
});
assert(taggedComment.characters.length === 2 && taggedComment.characters[0] === "Natsuki Subaru", "Expected characters to be preserved");
assert(taggedComment.topics.length === 2 && taggedComment.topics[1] === "Emilia Camp", "Expected topics to be preserved");

const allAnimeComments = getAllAnimeComments();
assert(Array.isArray(allAnimeComments), "Expected getAllAnimeComments() to return an array");
assert(allAnimeComments.length === 4085, `Expected 4085 total anime comments, got ${allAnimeComments.length}`);
assert(allAnimeComments[0].seasonId === "season-1", "Expected first comment to have seasonId");
assert(typeof allAnimeComments[0].episodeNumber === "number", "Expected first comment to have episodeNumber");
console.log("✓ anime schemas and loaders passed");

// 16. Testing in-memory cache and clearAnimeCache()
console.log("\n16. Testing anime in-memory caching...");
const cat1 = getAnimeCatalog();
const cat2 = getAnimeCatalog();
assert(cat1 === cat2, "Expected cached anime catalog reference equality");

const eps1 = getSeasonEpisodes("season-1");
const eps2 = getSeasonEpisodes("season-1");
assert(eps1 === eps2, "Expected cached season episodes reference equality");

clearAnimeCache();
const cat3 = getAnimeCatalog();
assert(cat3.length === 5, "Expected re-populated catalog after clearAnimeCache()");
console.log("✓ anime in-memory cache passed");

console.log("\n🎉 ALL SCHEMA TESTS PASSED!");
