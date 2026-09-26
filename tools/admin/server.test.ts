import path from "node:path";
import { IfRouteConfig } from "../../lib/schema";

console.log("Running tools/admin/server.test.ts...\n");

async function runTests() {
  // Spawn test server dynamically
  const { spawn } = await import("node:child_process");
  const serverProcess = spawn("./node_modules/.bin/tsx", ["tools/admin/server.ts"], {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, PORT: "4329" }, // or default 4321
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server start timeout")), 8000);
    serverProcess.stdout.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Running locally at")) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProcess.stderr.on("data", (data) => {
      console.error("Server stderr:", data.toString());
    });
  });

  console.log("✓ Admin server started successfully on http://localhost:4321");

  try {
    // 1. Test GET /api/config
    const cfgRes = await fetch("http://127.0.0.1:4329/api/config");
    if (!cfgRes.ok) throw new Error(`GET /api/config failed: ${cfgRes.status}`);
    const cfg = await cfgRes.json();
    if (!Array.isArray(cfg.arcs) || !Array.isArray(cfg.characters)) {
      throw new Error("Invalid config structure");
    }
    console.log(`✓ GET /api/config passed (${cfg.arcs.length} arcs, ${cfg.characters.length} characters)`);

    // 2. Test GET /api/entries
    const entriesRes = await fetch("http://127.0.0.1:4329/api/entries");
    if (!entriesRes.ok) throw new Error(`GET /api/entries failed: ${entriesRes.status}`);
    const entries = await entriesRes.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error("No entries returned");
    }
    console.log(`✓ GET /api/entries passed (${entries.length} entries loaded)`);

    // 3. Test POST /api/check-duplicate for exact duplicate
    const exactCheckRes = await fetch("http://127.0.0.1:4329/api/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "aah, you are sloth right?" }),
    });
    const exactCheck = await exactCheckRes.json();
    if (!exactCheck.isExactDuplicate || exactCheck.exactMatch?.id !== "0001") {
      throw new Error(`Expected exact duplicate match for 0001, got ${JSON.stringify(exactCheck)}`);
    }
    console.log("✓ POST /api/check-duplicate detected exact duplicate #0001");

    // 4. Test POST /api/check-duplicate excluding currentId
    const selfCheckRes = await fetch("http://127.0.0.1:4329/api/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "aah, you are sloth right?", currentId: "0001" }),
    });
    const selfCheck = await selfCheckRes.json();
    if (selfCheck.isExactDuplicate) {
      throw new Error("Should not detect self as duplicate when currentId is provided");
    }
    console.log("✓ POST /api/check-duplicate correctly ignores self-edit ID");

    // 5. Test POST /api/entries strict rejection for duplicate question
    const dupSaveRes = await fetch("http://127.0.0.1:4329/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Aah……you are Sloth right?",
        answer: "A new duplicate attempt answer.",
        arc: "general",
        verified: false,
        characters: [],
        topics: [],
        source: { type: "text", value: "" },
      }),
    });
    if (dupSaveRes.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict, got ${dupSaveRes.status}`);
    }
    const dupErr = await dupSaveRes.json();
    if (!dupErr.error.includes("Duplicate question rejected")) {
      throw new Error(`Unexpected error message: ${JSON.stringify(dupErr)}`);
    }
    console.log("✓ POST /api/entries strictly blocked duplicate save with HTTP 409 Conflict");

    // 6. Test POST /api/parse-quick-paste
    const parseRes = await fetch("http://127.0.0.1:4329/api/parse-quick-paste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText:
          "Q: What is Emilia's favorite food?\nA: Pickled bell peppers.\nDate: 2017-09-23\nArc: general\nSource: https://twitter.com/nezumiironyanko/123",
      }),
    });
    const parseData = await parseRes.json();
    if (!parseData.success || !parseData.parsed.characters.includes("Emilia")) {
      throw new Error(`Quick paste failed or didn't detect Emilia: ${JSON.stringify(parseData)}`);
    }
    console.log("✓ POST /api/parse-quick-paste parsed fields and detected Emilia");

    // 7. Test POST /api/suggest-tags
    const tagRes = await fetch("http://127.0.0.1:4329/api/suggest-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Did Subaru make a contract with Beatrice during Arc 4?",
      }),
    });
    const tagData = await tagRes.json();
    if (
      !tagData.characters.includes("Natsuki Subaru") ||
      !tagData.characters.includes("Beatrice")
    ) {
      throw new Error(`Failed to suggest Natsuki Subaru or Beatrice: ${JSON.stringify(tagData)}`);
    }
    console.log("✓ POST /api/suggest-tags suggested Natsuki Subaru and Beatrice");

    // 8. Test GET / HTML page
    const htmlRes = await fetch("http://127.0.0.1:4329/");
    if (!htmlRes.ok) throw new Error(`GET / failed: ${htmlRes.status}`);
    const htmlText = await htmlRes.text();
    if (
      !htmlText.includes("⚡ Paste") ||
      !htmlText.includes("Clone as Template") ||
      !htmlText.includes("duplicate-warning") ||
      !htmlText.includes("Stories & Supplements") ||
      !htmlText.includes("+ Add Source") ||
      !htmlText.includes("sources-list")
    ) {
      throw new Error("HTML missing required UI elements");
    }
    console.log("✓ GET / returned HTML containing all convenience, duplicate, multi-source, and stories UI elements");

    // 9. Test GET /api/stories
    const storiesRes = await fetch("http://127.0.0.1:4329/api/stories");
    if (!storiesRes.ok) throw new Error(`GET /api/stories failed: ${storiesRes.status}`);
    const stories = (await storiesRes.json()) as IfRouteConfig[];
    if (!Array.isArray(stories) || stories.length === 0) {
      throw new Error("Expected non-empty stories array");
    }
    const pride = stories.find((s) => s.slug === "if-pride");
    const scorpion = stories.find((s) => s.slug === "scorpion-tales");
    if (!pride || pride.type !== "if") {
      throw new Error(`Pride IF missing or invalid type: ${JSON.stringify(pride)}`);
    }
    if (!scorpion || scorpion.type !== "side-story") {
      throw new Error(`Scorpion Tales missing or invalid type: ${JSON.stringify(scorpion)}`);
    }
    console.log(`✓ GET /api/stories passed (${stories.length} stories loaded, types validated)`);

    // 10. Test GET /api/stories/if-pride
    const prideRes = await fetch("http://127.0.0.1:4329/api/stories/if-pride");
    if (!prideRes.ok) throw new Error(`GET /api/stories/if-pride failed: ${prideRes.status}`);
    const prideDetail = await prideRes.json();
    if (prideDetail.slug !== "if-pride" || !Array.isArray(prideDetail.supplements)) {
      throw new Error("Invalid story detail structure");
    }
    console.log("✓ GET /api/stories/if-pride passed with valid structure");

    // 11. Test POST /api/stories/if-pride/supplements
    const createSuppRes = await fetch("http://127.0.0.1:4329/api/stories/if-pride/supplements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Integration Supplement",
        content: "Temporary supplement for integration testing.",
        source: { type: "text", value: "Test Source" },
        date: "2026-09-23",
      }),
    });
    if (!createSuppRes.ok) throw new Error(`POST supplement failed: ${createSuppRes.status}`);
    const createdSupp = await createSuppRes.json();
    if (!createdSupp.success || !createdSupp.supplement?.id) {
      throw new Error("Failed to create supplement");
    }
    const testSuppId = createdSupp.supplement.id;
    console.log(`✓ POST /api/stories/if-pride/supplements created supplement #${testSuppId}`);

    // 12. Test PUT /api/stories/if-pride/supplements/:id
    const updateSuppRes = await fetch(`http://127.0.0.1:4329/api/stories/if-pride/supplements/${testSuppId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Updated Integration Supplement",
        content: "Updated content for testing.",
      }),
    });
    if (!updateSuppRes.ok) throw new Error(`PUT supplement failed: ${updateSuppRes.status}`);
    const updatedSupp = await updateSuppRes.json();
    if (updatedSupp.supplement?.title !== "Updated Integration Supplement") {
      throw new Error("Failed to update supplement title");
    }
    console.log(`✓ PUT /api/stories/if-pride/supplements/${testSuppId} updated supplement`);

    // 13. Test DELETE /api/stories/if-pride/supplements/:id
    const deleteSuppRes = await fetch(`http://127.0.0.1:4329/api/stories/if-pride/supplements/${testSuppId}`, {
      method: "DELETE",
    });
    if (!deleteSuppRes.ok) throw new Error(`DELETE supplement failed: ${deleteSuppRes.status}`);
    console.log(`✓ DELETE /api/stories/if-pride/supplements/${testSuppId} cleanly removed test supplement`);

    // 14. Test GET /api/trivia/15 and /api/trivia/TR-0016
    const triv15Res = await fetch("http://127.0.0.1:4329/api/trivia/15");
    if (!triv15Res.ok) throw new Error(`GET /api/trivia/15 failed: ${triv15Res.status}`);
    const triv15 = await triv15Res.json();
    if (triv15.id !== "TR-0015") throw new Error(`Expected TR-0015, got ${triv15.id}`);
    console.log("✓ GET /api/trivia/15 normalized ID and retrieved TR-0015");

    const triv16Res = await fetch("http://127.0.0.1:4329/api/trivia/TR-0016");
    if (!triv16Res.ok) throw new Error(`GET /api/trivia/TR-0016 failed: ${triv16Res.status}`);
    const triv16 = await triv16Res.json();
    if (triv16.id !== "TR-0016") throw new Error(`Expected TR-0016, got ${triv16.id}`);
    console.log("✓ GET /api/trivia/TR-0016 retrieved TR-0016");

    // 15. Test POST /api/check-trivia-duplicate
    const checkTriv15Res = await fetch("http://127.0.0.1:4329/api/check-trivia-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: triv15.text,
        currentId: "15",
      }),
    });
    const checkTriv15 = await checkTriv15Res.json();
    if (checkTriv15.isExactDuplicate) {
      throw new Error("Self-edit check for trivia 15 should not be marked as duplicate");
    }
    console.log("✓ POST /api/check-trivia-duplicate excluded self with currentId='15'");

    const checkTriv16Res = await fetch("http://127.0.0.1:4329/api/check-trivia-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: triv16.text,
        currentId: "TR-0016",
      }),
    });
    const checkTriv16 = await checkTriv16Res.json();
    if (checkTriv16.isExactDuplicate) {
      throw new Error("Self-edit check for trivia 16 should not be marked as duplicate");
    }
    console.log("✓ POST /api/check-trivia-duplicate excluded self with currentId='TR-0016'");

    // 16. Test PUT /api/trivia/15 and PUT /api/trivia/TR-0016
    const putTriv15Res = await fetch("http://127.0.0.1:4329/api/trivia/15", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(triv15),
    });
    if (!putTriv15Res.ok) {
      const err = await putTriv15Res.json();
      throw new Error(`PUT /api/trivia/15 failed: ${JSON.stringify(err)}`);
    }
    console.log("✓ PUT /api/trivia/15 succeeded without duplicate conflict");

    const putTriv16Res = await fetch("http://127.0.0.1:4329/api/trivia/TR-0016", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(triv16),
    });
    if (!putTriv16Res.ok) {
      const err = await putTriv16Res.json();
      throw new Error(`PUT /api/trivia/TR-0016 failed: ${JSON.stringify(err)}`);
    }
    // 17. Test GET /, /admin.css, and /admin.js static asset serving
    const staticHtmlRes = await fetch("http://127.0.0.1:4329/");
    if (!staticHtmlRes.ok) throw new Error(`GET / failed: ${staticHtmlRes.status}`);
    const htmlContent = await staticHtmlRes.text();
    if (!htmlContent.includes("/admin.css") || !htmlContent.includes("/admin.js")) {
      throw new Error("index.html does not link to /admin.css or /admin.js");
    }
    console.log("✓ GET / returned index.html linking to /admin.css and /admin.js");

    const cssRes = await fetch("http://127.0.0.1:4329/admin.css");
    if (!cssRes.ok) throw new Error(`GET /admin.css failed: ${cssRes.status}`);
    const cssContentType = cssRes.headers.get("content-type");
    if (!cssContentType?.includes("text/css")) {
      throw new Error(`Expected text/css Content-Type, got ${cssContentType}`);
    }
    const cssText = await cssRes.text();
    if (!cssText.includes(":root")) {
      throw new Error("admin.css content does not look like CSS");
    }
    console.log(`✓ GET /admin.css returned valid stylesheet (${cssText.length} bytes)`);

    const jsRes = await fetch("http://127.0.0.1:4329/admin.js");
    if (!jsRes.ok) throw new Error(`GET /admin.js failed: ${jsRes.status}`);
    const jsContentType = jsRes.headers.get("content-type");
    if (!jsContentType?.includes("application/javascript")) {
      throw new Error(`Expected application/javascript Content-Type, got ${jsContentType}`);
    }
    const jsText = await jsRes.text();
    if (!jsText.includes("function init") && !jsText.includes("init()")) {
      throw new Error("admin.js content does not look like JS");
    }
    console.log(`✓ GET /admin.js returned valid JavaScript bundle (${jsText.length} bytes)`);

    console.log("\n🎉 ALL ADMIN SERVER INTEGRATION TESTS PASSED!");
  } finally {
    serverProcess.kill("SIGTERM");
  }
}

runTests().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
