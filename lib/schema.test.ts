import { qnaEntrySchema, getEntrySources } from "./schema";

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

console.log("\n🎉 ALL SCHEMA TESTS PASSED!");
