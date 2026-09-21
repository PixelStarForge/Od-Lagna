import {
  normalizeQuestion,
  calculateSimilarity,
  findDuplicates,
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
  { id: "0003", question: "How strong is Reid van Astrea?" },
];

const exactResult = findDuplicates("aah, you are sloth right?", entries);
assert(exactResult.isExactDuplicate === true, "Should detect exact duplicate");
assert(exactResult.exactMatch?.id === "0001", `Expected match 0001, got ${exactResult.exactMatch?.id}`);

// Excluding current ID when editing
const selfEditResult = findDuplicates("aah, you are sloth right?", entries, "0001");
assert(selfEditResult.isExactDuplicate === false, "Should not flag itself as duplicate");

// Similar match detection
const similarResult = findDuplicates("Approximately how strong is Reid van Astrea?", entries);
assert(similarResult.isExactDuplicate === false, "Should not be exact duplicate");
assert(similarResult.similarMatches.length > 0, "Should find similar match");
assert(similarResult.similarMatches[0].id === "0003", "Top similar match should be 0003");
console.log("✓ findDuplicates passed");

// 4. suggestTags
console.log("\n4. Testing suggestTags...");
const knownChars = ["Subaru Natsuki", "Emilia", "Rem", "Reinhard van Astrea", "Beatrice"];
const sampleText = "Subaru and Emilia went to the mansion to visit Beatrice.";
const suggested = suggestTags(sampleText, knownChars);
assert(suggested.includes("Subaru Natsuki"), "Should suggest Subaru Natsuki from 'Subaru'");
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
  characters: ["Reinhard van Astrea", "Satella", "Subaru Natsuki"],
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

console.log("\n🎉 ALL TESTS PASSED!");
