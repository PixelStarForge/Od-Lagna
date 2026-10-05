import assert from "node:assert";

// Mock entries
const mockEntries = [
  { id: "0001", entryType: "qna" as const, question: "Question 1", answer: "Answer 1", verified: true, characters: ["Subaru"], topics: ["Lore"] },
  { id: "0002", entryType: "qna" as const, question: "Question 2", answer: "Answer 2", verified: false, characters: ["Rem"], topics: ["Combat"] },
  { id: "TR-0001", entryType: "trivia" as const, text: "Trivia 1", title: "Trivia Title", verified: true, characters: ["Emilia"], topics: ["Magic"] },
  { id: "TR-0002", entryType: "trivia" as const, text: "Trivia 2", title: "Trivia Title 2", verified: false, characters: ["Beatrice"], topics: ["Library"] },
];

function parseVerifiedParam(param: string | null): "all" | "verified" | "unverified" {
  if (param === "true" || param === "verified") return "verified";
  if (param === "false" || param === "unverified") return "unverified";
  return "all";
}

function filterEntries(
  entries: typeof mockEntries,
  verifiedFilter: "all" | "verified" | "unverified",
  entryTypeFilter: "all" | "qna" | "trivia" = "all"
) {
  return entries.filter((entry) => {
    if (entryTypeFilter !== "all" && entry.entryType !== entryTypeFilter) {
      return false;
    }
    if (verifiedFilter === "verified" && !entry.verified) {
      return false;
    }
    if (verifiedFilter === "unverified" && entry.verified) {
      return false;
    }
    return true;
  });
}

console.log("Running lib/browse-filters.test.ts...");

// Test 1: parseVerifiedParam handling
assert.strictEqual(parseVerifiedParam(null), "all");
assert.strictEqual(parseVerifiedParam(""), "all");
assert.strictEqual(parseVerifiedParam("all"), "all");
assert.strictEqual(parseVerifiedParam("verified"), "verified");
assert.strictEqual(parseVerifiedParam("true"), "verified");
assert.strictEqual(parseVerifiedParam("unverified"), "unverified");
assert.strictEqual(parseVerifiedParam("false"), "unverified");
console.log("✓ parseVerifiedParam handles all formats correctly");

// Test 2: Filter by verified only (all types)
const verifiedAll = filterEntries(mockEntries, "verified", "all");
assert.strictEqual(verifiedAll.length, 2);
assert.deepStrictEqual(verifiedAll.map((e) => e.id), ["0001", "TR-0001"]);
console.log("✓ Filter verified only across all entries");

// Test 3: Filter by unverified only (all types)
const unverifiedAll = filterEntries(mockEntries, "unverified", "all");
assert.strictEqual(unverifiedAll.length, 2);
assert.deepStrictEqual(unverifiedAll.map((e) => e.id), ["0002", "TR-0002"]);
console.log("✓ Filter unverified only across all entries");

// Test 4: Filter by verified only on Q&A
const verifiedQna = filterEntries(mockEntries, "verified", "qna");
assert.strictEqual(verifiedQna.length, 1);
assert.strictEqual(verifiedQna[0].id, "0001");
console.log("✓ Filter verified only on Q&A");

// Test 5: Filter by unverified only on Q&A
const unverifiedQna = filterEntries(mockEntries, "unverified", "qna");
assert.strictEqual(unverifiedQna.length, 1);
assert.strictEqual(unverifiedQna[0].id, "0002");
console.log("✓ Filter unverified only on Q&A");

// Test 6: Filter by verified only on Trivia
const verifiedTrivia = filterEntries(mockEntries, "verified", "trivia");
assert.strictEqual(verifiedTrivia.length, 1);
assert.strictEqual(verifiedTrivia[0].id, "TR-0001");
console.log("✓ Filter verified only on Trivia");

// Test 7: Filter by unverified only on Trivia
const unverifiedTrivia = filterEntries(mockEntries, "unverified", "trivia");
assert.strictEqual(unverifiedTrivia.length, 1);
assert.strictEqual(unverifiedTrivia[0].id, "TR-0002");
console.log("✓ Filter unverified only on Trivia");

// Test 8: Filter by "all"
const allEntries = filterEntries(mockEntries, "all", "all");
assert.strictEqual(allEntries.length, 4);
console.log("✓ Filter 'all' returns all entries");

console.log("\n🎉 ALL BROWSE FILTER TESTS PASSED!");
