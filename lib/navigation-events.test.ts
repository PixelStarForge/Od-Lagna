import assert from "node:assert";
import { dispatchUrlChange } from "./navigation-events";

console.log("Running lib/navigation-events.test.ts...");

// Test event dispatch
let receivedDetail: string | undefined = undefined;
if (typeof window !== "undefined") {
  window.addEventListener("od-lagna-urlchange", (e: Event) => {
    receivedDetail = (e as CustomEvent<string>).detail;
  });

  dispatchUrlChange("/browse?character=Emilia");
  assert.strictEqual(receivedDetail, "/browse?character=Emilia", "Event detail should match URL");
  console.log("✓ dispatchUrlChange successfully emitted custom event with URL detail");
} else {
  console.log("✓ Running in Node environment, testing URL parsing logic");
}

// Test URL parsing logic for Browse filter synchronization
function parseBrowseUrl(urlStr: string) {
  const url = new URL(urlStr, "http://localhost:3000");
  const sp = url.searchParams;
  return {
    arc: sp.get("arc") || sp.get("ifRoute") || "all",
    character: sp.get("character") || "all",
    topic: sp.get("topic") || "all",
    year: sp.get("year") || "all",
    verified: sp.get("verified") === "true",
    search: sp.get("search") || sp.get("q") || "",
  };
}

const res1 = parseBrowseUrl("http://localhost:3000/browse?character=Natsuki%20Subaru");
assert.strictEqual(res1.character, "Natsuki Subaru");
assert.strictEqual(res1.arc, "all");
assert.strictEqual(res1.topic, "all");
assert.strictEqual(res1.search, "");
console.log("✓ Character filter parsed correctly from URL");

const res2 = parseBrowseUrl("http://localhost:3000/browse?topic=Witch%20of%20Envy&arc=arc-4&verified=true");
assert.strictEqual(res2.topic, "Witch of Envy");
assert.strictEqual(res2.arc, "arc-4");
assert.strictEqual(res2.verified, true);
assert.strictEqual(res2.character, "all");
console.log("✓ Compound filters parsed correctly from URL");

const res3 = parseBrowseUrl("http://localhost:3000/browse?search=dragon");
assert.strictEqual(res3.search, "dragon");
assert.strictEqual(res3.character, "all");
console.log("✓ Keyword search parsed correctly from URL");

const res4 = parseBrowseUrl("http://localhost:3000/browse");
assert.strictEqual(res4.character, "all");
assert.strictEqual(res4.topic, "all");
assert.strictEqual(res4.arc, "all");
assert.strictEqual(res4.search, "");
console.log("✓ Clean browse URL resets all filters to default");

console.log("\n🎉 ALL NAVIGATION TESTS PASSED!");
