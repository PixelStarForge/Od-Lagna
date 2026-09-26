import assert from "node:assert";

// Mock minimal config & dataset
const config = {
  arcs: [
    { slug: "arc-1", order: "1", name: "Prologue" },
    { slug: "arc-2", order: "2", name: "Mansion" },
    { slug: "arc-3", order: "3", name: "Royal Election" },
  ],
  ifRoutes: [
    { slug: "if-pride", name: "Pride IF" },
  ],
  characters: ["Natsuki Subaru", "Emilia", "Rem", "Ram", "Beatrice"],
  topics: ["Combat", "Authorities", "Lore", "Magic"],
};

const entries = [
  { id: "0001", question: "Sloth question?", arc: "arc-1", verified: true, dateTime: "2014-04-12", characters: ["Natsuki Subaru", "Rem"], topics: ["Combat"] },
  { id: "0002", question: "Mansion question?", arc: "arc-2", verified: false, dateTime: "2015-06-20", characters: ["Rem", "Ram"], topics: ["Magic"] },
  { id: "0003", question: "Subaru and Emilia in election", arc: "arc-3", verified: true, dateTime: "2016-08-10", characters: ["Natsuki Subaru", "Emilia"], topics: ["Authorities"] },
  { id: "0004", question: "Pride IF divergence", arc: "if-pride", verified: false, dateTime: "", characters: ["Natsuki Subaru"], topics: ["Lore"] },
];

console.log("Testing Q&A and Trivia Multi-Filter Logic...\n");
assert.strictEqual(config.arcs.length, 3);

// Test 1: Arcs Multi-Filter
{
  const qnaFilters = {
    text: '',
    verified: 'all',
    arcs: new Set(['arc-1', 'arc-2']),
    characters: new Set<string>(),
    topics: new Set<string>(),
    years: new Set<string>(),
    charMatchMode: 'any',
  };

  function matches(e: typeof entries[0]) {
    if (qnaFilters.arcs.size > 0 && !qnaFilters.arcs.has(e.arc)) return false;
    return true;
  }

  const res = entries.filter(matches);
  assert.strictEqual(res.length, 2, "Should find 2 entries matching arc-1 or arc-2");
  assert.deepStrictEqual(res.map(r => r.id), ["0001", "0002"]);
  console.log("✓ Arcs multi-filter (union of multiple arcs) passed");
}

// Test 2: Characters Multi-Filter - Match Any (OR)
{
  const qnaFilters = {
    text: '',
    verified: 'all',
    arcs: new Set<string>(),
    characters: new Set(['rem', 'emilia']),
    topics: new Set<string>(),
    years: new Set<string>(),
    charMatchMode: 'any',
  };

  function matches(e: typeof entries[0]) {
    if (qnaFilters.characters.size > 0) {
      const itemChars = (e.characters || []).map(c => c.toLowerCase());
      if (qnaFilters.charMatchMode === 'all') {
        for (const reqChar of qnaFilters.characters) {
          if (!itemChars.includes(reqChar)) return false;
        }
      } else {
        let hasAny = false;
        for (const selChar of qnaFilters.characters) {
          if (itemChars.includes(selChar)) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) return false;
      }
    }
    return true;
  }

  const res = entries.filter(matches);
  assert.strictEqual(res.length, 3, "Should match 0001, 0002, 0003 for Rem OR Emilia");
  console.log("✓ Characters multi-filter with Any (OR) mode passed");
}

// Test 3: Characters Multi-Filter - Match All (AND)
{
  const qnaFilters = {
    text: '',
    verified: 'all',
    arcs: new Set<string>(),
    characters: new Set(['natsuki subaru', 'emilia']),
    topics: new Set<string>(),
    years: new Set<string>(),
    charMatchMode: 'all',
  };

  function matches(e: typeof entries[0]) {
    if (qnaFilters.characters.size > 0) {
      const itemChars = (e.characters || []).map(c => c.toLowerCase());
      if (qnaFilters.charMatchMode === 'all') {
        for (const reqChar of qnaFilters.characters) {
          if (!itemChars.includes(reqChar)) return false;
        }
      } else {
        let hasAny = false;
        for (const selChar of qnaFilters.characters) {
          if (itemChars.includes(selChar)) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) return false;
      }
    }
    return true;
  }

  const res = entries.filter(matches);
  assert.strictEqual(res.length, 1, "Only 0003 has both Subaru AND Emilia");
  assert.strictEqual(res[0].id, "0003");
  console.log("✓ Characters multi-filter with All (AND) mode passed");
}

// Test 4: Topics Multi-Filter
{
  const qnaFilters = {
    topics: new Set(['combat', 'lore']),
  };

  function matches(e: typeof entries[0]) {
    if (qnaFilters.topics.size > 0) {
      const itemTopics = (e.topics || []).map(t => t.toLowerCase());
      let hasAny = false;
      for (const selTopic of qnaFilters.topics) {
        if (itemTopics.includes(selTopic)) {
          hasAny = true;
          break;
        }
      }
      if (!hasAny) return false;
    }
    return true;
  }

  const res = entries.filter(matches);
  assert.strictEqual(res.length, 2, "0001 (Combat) and 0004 (Lore) match");
  console.log("✓ Topics multi-filter passed");
}

// Test 5: Years Multi-Filter (including undated)
{
  const qnaFilters = {
    years: new Set(['2014', 'undated']),
  };

  function matches(e: typeof entries[0]) {
    if (qnaFilters.years.size > 0) {
      const rawDate = e.dateTime || '';
      const matchYear = rawDate.match(/^(\d{4})/);
      const yearStr = matchYear ? matchYear[1] : 'undated';
      if (!qnaFilters.years.has(yearStr)) return false;
    }
    return true;
  }

  const res = entries.filter(matches);
  assert.strictEqual(res.length, 2, "0001 (2014) and 0004 (undated) match");
  console.log("✓ Years multi-filter passed");
}

// Test 6: Combined Multi-Dimensions (Arc + Verified + Topic)
{
  const qnaFilters = {
    verified: 'verified',
    arcs: new Set(['arc-1', 'arc-3']),
    topics: new Set(['combat', 'authorities']),
  };

  function matches(e: typeof entries[0]) {
    if (qnaFilters.verified === 'verified' && !e.verified) return false;
    if (qnaFilters.arcs.size > 0 && !qnaFilters.arcs.has(e.arc)) return false;
    if (qnaFilters.topics.size > 0) {
      const itemTopics = (e.topics || []).map(t => t.toLowerCase());
      let hasAny = false;
      for (const selTopic of qnaFilters.topics) {
        if (itemTopics.includes(selTopic)) {
          hasAny = true;
          break;
        }
      }
      if (!hasAny) return false;
    }
    return true;
  }

  const res = entries.filter(matches);
  assert.strictEqual(res.length, 2, "0001 and 0003 match");
  console.log("✓ Combined multi-dimensional filtering passed");
}

// Test 7: Prev / Next Navigation Logic
{
  const filteredList = ["0001", "0003"];
  
  function getNav(currentId: string) {
    const idx = filteredList.indexOf(currentId);
    return {
      canPrev: idx > 0,
      prevId: idx > 0 ? filteredList[idx - 1] : null,
      canNext: idx >= 0 && idx < filteredList.length - 1,
      nextId: idx >= 0 && idx < filteredList.length - 1 ? filteredList[idx + 1] : null,
    };
  }

  const nav1 = getNav("0001");
  assert.strictEqual(nav1.canPrev, false);
  assert.strictEqual(nav1.canNext, true);
  assert.strictEqual(nav1.nextId, "0003");

  const nav2 = getNav("0003");
  assert.strictEqual(nav2.canPrev, true);
  assert.strictEqual(nav2.prevId, "0001");
  assert.strictEqual(nav2.canNext, false);

  console.log("✓ Prev / Next sequential navigation passed");
}

console.log("\n🎉 ALL MULTI-FILTER TESTS PASSED SUCCESSFULLY!");
