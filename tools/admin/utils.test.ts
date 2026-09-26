import {
  normalizeQuestion,
  calculateSimilarity,
  findDuplicates,
  findTriviaDuplicates,
  normalizeTriviaId,
  suggestTags,
  parseQuickPaste,
} from "./utils";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Running tools/admin/utils.test.ts...\n");

// 1. normalizeQuestion
console.log("1. Testing normalizeQuestion...");
assert(
  normalizeQuestion("Aah……you are Sloth right?") === "aah you are sloth right",
  "Punctuation and ellipses should be stripped/normalized"
);
assert(
  normalizeQuestion("Aah... You are Sloth, right?!") === "aah you are sloth right",
  "Different punctuation and casing should produce identical normalized strings"
);
assert(
  normalizeQuestion("   What is  Subaru's   Authority?   ") === "what is subarus authority",
  "Whitespace and apostrophes should be normalized"
);
console.log("✓ normalizeQuestion passed");

// 2. calculateSimilarity
console.log("\n2. Testing calculateSimilarity...");
const exactSim = calculateSimilarity("What is Subaru's Authority?", "What is Subaru's Authority?");
assert(exactSim === 1.0, `Exact match should be 1.0, got ${exactSim}`);

const highSim = calculateSimilarity("What is Subaru's Authority?", "What is Subaru's authority right now?");
assert(highSim > 0.7 && highSim < 1.0, `Similar strings should have high score, got ${highSim}`);

const lowSim = calculateSimilarity("What is Subaru's Authority?", "Who is the strongest Witch of Sin?");
assert(lowSim < 0.4, `Dissimilar strings should have low score, got ${lowSim}`);
console.log("✓ calculateSimilarity passed");

// 3. findDuplicates
console.log("\n3. Testing findDuplicates...");
const entries = [
  { id: "0001", question: "Aah……you are Sloth right?" },
  { id: "0002", question: "What is Reinhard's divine protection?" },
  { id: "0003", question: "How strong is Reid Astrea?" },
];

const exactResult = findDuplicates("aah, you are sloth right?", entries);
assert(exactResult.isExactDuplicate === true, "Should detect exact duplicate");
assert(exactResult.exactMatch?.id === "0001", `Expected match 0001, got ${exactResult.exactMatch?.id}`);

// Excluding current ID when editing
const selfEditResult = findDuplicates("aah, you are sloth right?", entries, "0001");
assert(selfEditResult.isExactDuplicate === false, "Should not flag itself as duplicate");

// Similar match detection
const similarResult = findDuplicates("Approximately how strong is Reid Astrea?", entries);
assert(similarResult.isExactDuplicate === false, "Should not be exact duplicate");
assert(similarResult.similarMatches.length > 0, "Should find similar match");
assert(similarResult.similarMatches[0].id === "0003", "Top similar match should be 0003");
console.log("✓ findDuplicates passed");

// 4. suggestTags
console.log("\n4. Testing suggestTags...");
const knownChars = ["Natsuki Subaru", "Emilia", "Rem", "Reinhard van Astrea", "Beatrice"];
const sampleText = "Subaru and Emilia went to the mansion to visit Beatrice.";
const suggested = suggestTags(sampleText, knownChars);
assert(suggested.includes("Natsuki Subaru"), "Should suggest Natsuki Subaru from 'Subaru'");
assert(suggested.includes("Emilia"), "Should suggest Emilia");
assert(suggested.includes("Beatrice"), "Should suggest Beatrice");
assert(!suggested.includes("Rem"), "Should not suggest Rem");
console.log("✓ suggestTags passed");

// 5. parseQuickPaste
console.log("\n5. Testing parseQuickPaste...");
const rawPaste = `
Q: Can Reinhard defeat Satella?
A: In a battle between Reinhard and Satella, there is no end. It would result in a draw.
Date: 2014-05-18
Arc: arc-4
Source: https://twitter.com/nezumiironyanko/status/123456789
`;

const parsed = parseQuickPaste(rawPaste, {
  characters: ["Reinhard van Astrea", "Satella", "Natsuki Subaru"],
  topics: ["Combat & Tiering"],
  arcs: [{ slug: "arc-4", name: "The Everlasting Contract", order: 4 }],
  ifRoutes: [],
});

assert(parsed.question === "Can Reinhard defeat Satella?", `Question mismatch: "${parsed.question}"`);
assert(
  parsed.answer === "In a battle between Reinhard and Satella, there is no end. It would result in a draw.",
  `Answer mismatch: "${parsed.answer}"`
);
assert(parsed.dateTime === "2014-05-18", `Date mismatch: "${parsed.dateTime}"`);
assert(parsed.arc === "arc-4", `Arc mismatch: "${parsed.arc}"`);
assert(parsed.source?.value === "https://twitter.com/nezumiironyanko/status/123456789", "Source value mismatch");
assert(parsed.source?.type === "url", "Source type mismatch");
assert(parsed.characters.includes("Reinhard van Astrea"), "Should detect Reinhard");
assert(parsed.characters.includes("Satella"), "Should detect Satella");
console.log("✓ parseQuickPaste passed");

// 6. normalizeTriviaId
console.log("\n6. Testing normalizeTriviaId...");
assert(normalizeTriviaId("15") === "TR-0015", "Should normalize '15' to 'TR-0015'");
assert(normalizeTriviaId("0015") === "TR-0015", "Should normalize '0015' to 'TR-0015'");
assert(normalizeTriviaId("TR-15") === "TR-0015", "Should normalize 'TR-15' to 'TR-0015'");
assert(normalizeTriviaId("TR-0015") === "TR-0015", "Should keep 'TR-0015' canonical");
assert(normalizeTriviaId("tr-0016") === "TR-0016", "Should normalize lowercase 'tr-0016'");
assert(normalizeTriviaId("16") === "TR-0016", "Should normalize '16' to 'TR-0016'");
console.log("✓ normalizeTriviaId passed");

// 7. findTriviaDuplicates
console.log("\n7. Testing findTriviaDuplicates for TR-0015 and TR-0016...");
const triviaEntries = [
  {
    id: "TR-0015",
    text: "Tappei had to really insist on keeping on the Anime keeping the scene in where Ram shoves her fingers down Subaru's throat, to help him vomit.",
  },
  {
    id: "TR-0016",
    text: "Julius, Ferris and Reinhard are \"The Three Knights\", like how Chisha, Cecilus and Vincent are \"The Three Crows\" and Subaru and his gang are \"The Three Idiots\".",
  },
];

// Verify 15 and 16 are not duplicates of each other
const diffCheck = findTriviaDuplicates(triviaEntries[0].text, triviaEntries, "TR-0015");
assert(diffCheck.isExactDuplicate === false, "TR-0015 should not collide with TR-0016");

const diffCheck2 = findTriviaDuplicates(triviaEntries[1].text, triviaEntries, "TR-0016");
assert(diffCheck2.isExactDuplicate === false, "TR-0016 should not collide with TR-0015");

// Verify self-edit exclusion works with canonical and un-prefixed IDs
assert(findTriviaDuplicates(triviaEntries[0].text, triviaEntries, "TR-0015").isExactDuplicate === false, "Should exclude TR-0015 with canonical ID");
assert(findTriviaDuplicates(triviaEntries[0].text, triviaEntries, "15").isExactDuplicate === false, "Should exclude TR-0015 with un-prefixed '15'");
assert(findTriviaDuplicates(triviaEntries[0].text, triviaEntries, "0015").isExactDuplicate === false, "Should exclude TR-0015 with padded '0015'");
assert(findTriviaDuplicates(triviaEntries[1].text, triviaEntries, "TR-0016").isExactDuplicate === false, "Should exclude TR-0016 with canonical ID");
assert(findTriviaDuplicates(triviaEntries[1].text, triviaEntries, "16").isExactDuplicate === false, "Should exclude TR-0016 with un-prefixed '16'");

// Verify duplicate detection still catches actual duplicate
const dup15 = findTriviaDuplicates(triviaEntries[0].text, triviaEntries);
assert(dup15.isExactDuplicate === true && dup15.exactMatch?.id === "TR-0015", "Should detect exact duplicate TR-0015 when not self-editing");
const dup16 = findTriviaDuplicates(triviaEntries[1].text, triviaEntries);
assert(dup16.isExactDuplicate === true && dup16.exactMatch?.id === "TR-0016", "Should detect exact duplicate TR-0016 when not self-editing");
console.log("✓ findTriviaDuplicates passed");

console.log("\n🎉 ALL TESTS PASSED!");
