import { ArcConfig, IfRouteConfig } from "../../lib/schema";

/**
 * Normalizes text for duplicate detection:
 * converts to lowercase, removes accents/diacritics, apostrophes, punctuation, and collapses spaces.
 */
export function normalizeQuestion(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .replace(/[’']/g, "") // remove apostrophes so "Subaru's" -> "subarus"
    .replace(/[“”"«»]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // replace all other symbols/punctuation with space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates similarity between two strings (0.0 to 1.0)
 * using Sørensen–Dice coefficient on unigrams and word bigrams.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeQuestion(str1);
  const norm2 = normalizeQuestion(str2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const words1 = norm1.split(" ").filter(Boolean);
  const words2 = norm2.split(" ").filter(Boolean);

  if (words1.length === 0 || words2.length === 0) return 0.0;

  // Build unigrams + bigrams multiset
  const getTokens = (words: string[]): string[] => {
    const tokens: string[] = [];
    for (let i = 0; i < words.length; i++) {
      tokens.push("u:" + words[i]);
      if (i < words.length - 1) {
        tokens.push("b:" + words[i] + "_" + words[i + 1]);
      }
    }
    return tokens;
  };

  const tokens1 = getTokens(words1);
  const tokens2 = getTokens(words2);

  const freq1 = new Map<string, number>();
  for (const t of tokens1) {
    freq1.set(t, (freq1.get(t) || 0) + 1);
  }

  let intersection = 0;
  for (const t of tokens2) {
    const count = freq1.get(t);
    if (count && count > 0) {
      intersection++;
      freq1.set(t, count - 1);
    }
  }

  const similarity = (2.0 * intersection) / (tokens1.length + tokens2.length);
  return Math.round(similarity * 100) / 100;
}

export interface DuplicateCheckResult {
  isExactDuplicate: boolean;
  exactMatch?: { id: string; question: string };
  similarMatches: Array<{ id: string; question: string; similarity: number }>;
}

/**
 * Evaluates candidate question against all existing entries.
 */
export function findDuplicates(
  candidateQuestion: string,
  entries: Array<{ id: string; question: string }>,
  currentId?: string | null
): DuplicateCheckResult {
  const normCandidate = normalizeQuestion(candidateQuestion);
  if (!normCandidate) {
    return { isExactDuplicate: false, similarMatches: [] };
  }

  let exactMatch: { id: string; question: string } | undefined;
  const similarMatches: Array<{ id: string; question: string; similarity: number }> = [];

  for (const entry of entries) {
    if (currentId && entry.id === currentId) {
      continue;
    }

    const normEntry = normalizeQuestion(entry.question);
    if (normCandidate === normEntry) {
      exactMatch = entry;
      break;
    }

    const similarity = calculateSimilarity(candidateQuestion, entry.question);
    if (similarity >= 0.55) {
      similarMatches.push({
        id: entry.id,
        question: entry.question,
        similarity,
      });
    }
  }

  if (exactMatch) {
    return {
      isExactDuplicate: true,
      exactMatch,
      similarMatches: [],
    };
  }

  similarMatches.sort((a, b) => b.similarity - a.similarity);

  return {
    isExactDuplicate: false,
    similarMatches: similarMatches.slice(0, 5),
  };
}

const GENERIC_NAME_PARTS = new Set(["van", "von", "the", "san", "sama", "kun", "chan", "sir"]);

/**
 * Scans text to suggest matching tags from a known tag list.
 */
export function suggestTags(text: string, knownTags: string[]): string[] {
  if (!text || !knownTags || knownTags.length === 0) return [];

  const lowerText = text.toLowerCase();
  const matched = new Set<string>();

  for (const tag of knownTags) {
    const lowerTag = tag.toLowerCase().trim();
    if (!lowerTag) continue;

    // Direct full substring match
    if (lowerTag.length >= 3 && lowerText.includes(lowerTag)) {
      matched.add(tag);
      continue;
    }

    // For multi-word character names: check significant single names
    const parts = lowerTag.split(/[\s-]+/).filter((p) => p.length >= 4 && !GENERIC_NAME_PARTS.has(p));
    for (const part of parts) {
      const regex = new RegExp(`\\b${part}\\b`, "i");
      if (regex.test(lowerText)) {
        matched.add(tag);
        break;
      }
    }
  }

  return Array.from(matched);
}

export interface ParsedQuickPaste {
  question: string;
  answer: string;
  dateTime?: string;
  arc?: string;
  source?: { type: "url" | "text"; value: string };
  characters: string[];
  topics: string[];
  verified?: boolean;
}

/**
 * Intelligently parses raw pasted text (e.g. Q&A tweets, interviews, discord notes)
 * into structured QnaEntry fields.
 */
export function parseQuickPaste(
  rawText: string,
  config?: {
    arcs?: ArcConfig[];
    ifRoutes?: IfRouteConfig[];
    characters?: string[];
    topics?: string[];
  }
): ParsedQuickPaste {
  const lines = rawText.split(/\r?\n/);
  let question = "";
  let answer = "";
  let dateTime = "";
  let arc = "";
  let sourceValue = "";
  let sourceType: "url" | "text" = "url";
  let explicitChars: string[] = [];
  let explicitTopics: string[] = [];
  let verified: boolean | undefined = undefined;

  let currentMode: "question" | "answer" | null = null;
  const questionLines: string[] = [];
  const answerLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentMode === "question") questionLines.push("");
      if (currentMode === "answer") answerLines.push("");
      continue;
    }

    // Question prefix match
    const qMatch = trimmed.match(/^(?:Q|Question|Fan|Interviewer|Query)[\s.:：-]\s*(.*)$/i);
    if (qMatch) {
      currentMode = "question";
      if (qMatch[1]) questionLines.push(qMatch[1]);
      continue;
    }

    // Answer prefix match
    const aMatch = trimmed.match(/^(?:A|Answer|Nagatsuki|Tappei|Author)[\s.:：-]\s*(.*)$/i);
    if (aMatch) {
      currentMode = "answer";
      if (aMatch[1]) answerLines.push(aMatch[1]);
      continue;
    }

    // Date prefix match
    const dateMatch = trimmed.match(/^(?:Date|Time|Timestamp)[\s.:：-]\s*(.*)$/i);
    if (dateMatch) {
      dateTime = dateMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Arc prefix match
    const arcMatch = trimmed.match(/^(?:Arc|Route|Timeline)[\s.:：-]\s*(.*)$/i);
    if (arcMatch) {
      arc = arcMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Source prefix match
    const srcMatch = trimmed.match(/^(?:Source|Link|URL|Ref)[\s.:：-]\s*(.*)$/i);
    if (srcMatch) {
      sourceValue = srcMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Characters prefix match
    const charMatch = trimmed.match(/^(?:Characters?|Chars?)[\s.:：-]\s*(.*)$/i);
    if (charMatch) {
      explicitChars = charMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      currentMode = null;
      continue;
    }

    // Topics prefix match
    const topicMatch = trimmed.match(/^(?:Topics?|Tags?)[\s.:：-]\s*(.*)$/i);
    if (topicMatch) {
      explicitTopics = topicMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      currentMode = null;
      continue;
    }

    // Verified prefix match
    const verMatch = trimmed.match(/^Verified[\s.:：-]\s*(yes|true|no|false)/i);
    if (verMatch) {
      verified = verMatch[1].toLowerCase() === "yes" || verMatch[1].toLowerCase() === "true";
      currentMode = null;
      continue;
    }

    // Accumulate multi-line question / answer
    if (currentMode === "question") {
      questionLines.push(trimmed);
    } else if (currentMode === "answer") {
      answerLines.push(trimmed);
    } else {
      // If neither mode is active yet, maybe URL on its own line
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        sourceValue = trimmed;
      }
    }
  }

  question = questionLines.join("\n").trim();
  answer = answerLines.join("\n").trim();

  // If question is still empty, look for double-break fallback
  if (!question && !answer && rawText.trim()) {
    const blocks = rawText.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    if (blocks.length >= 2) {
      question = blocks[0];
      answer = blocks.slice(1).join("\n\n");
    } else {
      question = rawText.trim();
    }
  }

  // Detect URL from text if sourceValue still empty
  if (!sourceValue) {
    const urlMatch = rawText.match(/https?:\/\/[^\s)]+/i);
    if (urlMatch) {
      sourceValue = urlMatch[0];
      sourceType = "url";
    }
  } else {
    sourceType = sourceValue.startsWith("http") ? "url" : "text";
  }

  // Detect Date if not explicitly found
  if (!dateTime) {
    // Check YYYY-MM-DD
    const isoMatch = rawText.match(/\b(\d{4})[-/](\d{2})[-/](\d{2})\b/);
    if (isoMatch) {
      dateTime = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    } else {
      // Check Month DD, YYYY
      const MONTH_MAP: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const textDateMatch = rawText.match(
        /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b/i
      );
      if (textDateMatch) {
        const mKey = textDateMatch[1].slice(0, 3).toLowerCase();
        const mm = MONTH_MAP[mKey] || "01";
        const dd = String(textDateMatch[2]).padStart(2, "0");
        const yyyy = textDateMatch[3];
        dateTime = `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  // Normalize arc if provided or detect from text
  const fullText = `${question} ${answer} ${arc}`.toLowerCase();
  let resolvedArc = arc || "general";

  if (config?.arcs || config?.ifRoutes) {
    const allArcOptions = [
      ...(config.arcs || []).map((a) => ({ slug: a.slug, name: a.name })),
      ...(config.ifRoutes || []).map((r) => ({ slug: r.slug, name: r.name })),
    ];

    // Check direct slug match
    const directSlug = allArcOptions.find((a) => a.slug.toLowerCase() === arc.toLowerCase());
    if (directSlug) {
      resolvedArc = directSlug.slug;
    } else {
      // Detect based on text mentions
      for (let i = 9; i >= 1; i--) {
        if (new RegExp(`\\barc\\s*[-_ ]?${i}\\b`, "i").test(fullText)) {
          resolvedArc = `arc-${i}`;
          break;
        }
      }

      if (resolvedArc === "general" || !resolvedArc) {
        const ifKeywords: Record<string, string> = {
          "greed if": "greed-if",
          "sloth if": "sloth-if",
          "rem if": "sloth-if",
          "wrath if": "wrath-if",
          "pride if": "pride-if",
          "gluttony if": "gluttony-if",
          "lust if": "lust-if",
          "vainglory if": "vainglory-if",
          "school if": "school-if",
        };

        for (const [kw, slug] of Object.entries(ifKeywords)) {
          if (fullText.includes(kw)) {
            resolvedArc = slug;
            break;
          }
        }
      }
    }
  }

  // Suggest / merge characters
  const characters = [...explicitChars];
  if (config?.characters) {
    const detectedChars = suggestTags(`${question} ${answer}`, config.characters);
    for (const c of detectedChars) {
      if (!characters.includes(c)) {
        characters.push(c);
      }
    }
  }

  // Suggest / merge topics
  const topics = [...explicitTopics];
  if (config?.topics) {
    const detectedTopics = suggestTags(`${question} ${answer}`, config.topics);
    for (const t of detectedTopics) {
      if (!topics.includes(t)) {
        topics.push(t);
      }
    }
  }

  return {
    question,
    answer,
    dateTime: dateTime || undefined,
    arc: resolvedArc,
    source: sourceValue ? { type: sourceType, value: sourceValue } : undefined,
    characters,
    topics,
    verified,
  };
}

export interface ParsedTriviaQuickPaste {
  title?: string;
  text: string;
  dateTime?: string;
  arc?: string;
  source?: { type: "url" | "text"; value: string };
  characters: string[];
  topics: string[];
  verified?: boolean;
}

/**
 * Evaluates candidate trivia statement against all existing trivia entries.
 */
export function findTriviaDuplicates(
  candidateText: string,
  entries: Array<{ id: string; text: string }>,
  currentId?: string | null
): DuplicateCheckResult {
  const normCandidate = normalizeQuestion(candidateText);
  if (!normCandidate) {
    return { isExactDuplicate: false, similarMatches: [] };
  }

  let exactMatch: { id: string; question: string } | undefined;
  const similarMatches: Array<{ id: string; question: string; similarity: number }> = [];

  for (const entry of entries) {
    if (currentId && entry.id === currentId) {
      continue;
    }

    const normEntry = normalizeQuestion(entry.text);
    if (normCandidate === normEntry) {
      exactMatch = { id: entry.id, question: entry.text };
      break;
    }

    const similarity = calculateSimilarity(candidateText, entry.text);
    if (similarity >= 0.55) {
      similarMatches.push({
        id: entry.id,
        question: entry.text,
        similarity,
      });
    }
  }

  if (exactMatch) {
    return {
      isExactDuplicate: true,
      exactMatch,
      similarMatches: [],
    };
  }

  similarMatches.sort((a, b) => b.similarity - a.similarity);

  return {
    isExactDuplicate: false,
    similarMatches: similarMatches.slice(0, 5),
  };
}

/**
 * Parses raw pasted text into structured TriviaEntry fields.
 */
export function parseTriviaQuickPaste(
  rawText: string,
  config?: {
    arcs?: ArcConfig[];
    ifRoutes?: IfRouteConfig[];
    characters?: string[];
    topics?: string[];
  }
): ParsedTriviaQuickPaste {
  const lines = rawText.split(/\r?\n/);
  let title = "";
  let text = "";
  let dateTime = "";
  let arc = "";
  let sourceValue = "";
  let sourceType: "url" | "text" = "url";
  let explicitChars: string[] = [];
  let explicitTopics: string[] = [];
  let verified: boolean | undefined = undefined;

  let currentMode: "title" | "text" | null = null;
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentMode === "text") textLines.push("");
      continue;
    }

    // Title prefix match
    const titleMatch = trimmed.match(/^(?:Title|Headline|Topic)[\s.:：-]\s*(.*)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Statement / Trivia / Text prefix match
    const stmtMatch = trimmed.match(/^(?:Statement|Trivia|Text|Quote|Comment|Author)[\s.:：-]\s*(.*)$/i);
    if (stmtMatch) {
      currentMode = "text";
      if (stmtMatch[1]) textLines.push(stmtMatch[1]);
      continue;
    }

    // Date prefix match
    const dateMatch = trimmed.match(/^(?:Date|Time|Timestamp)[\s.:：-]\s*(.*)$/i);
    if (dateMatch) {
      dateTime = dateMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Arc prefix match
    const arcMatch = trimmed.match(/^(?:Arc|Route|Timeline)[\s.:：-]\s*(.*)$/i);
    if (arcMatch) {
      arc = arcMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Source prefix match
    const srcMatch = trimmed.match(/^(?:Source|Link|URL|Ref)[\s.:：-]\s*(.*)$/i);
    if (srcMatch) {
      sourceValue = srcMatch[1].trim();
      currentMode = null;
      continue;
    }

    // Characters prefix match
    const charMatch = trimmed.match(/^(?:Characters?|Chars?)[\s.:：-]\s*(.*)$/i);
    if (charMatch) {
      explicitChars = charMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      currentMode = null;
      continue;
    }

    // Topics prefix match
    const topicMatch = trimmed.match(/^(?:Topics?|Tags?)[\s.:：-]\s*(.*)$/i);
    if (topicMatch) {
      explicitTopics = topicMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      currentMode = null;
      continue;
    }

    // Verified prefix match
    const verMatch = trimmed.match(/^Verified[\s.:：-]\s*(yes|true|no|false)/i);
    if (verMatch) {
      verified = verMatch[1].toLowerCase() === "yes" || verMatch[1].toLowerCase() === "true";
      currentMode = null;
      continue;
    }

    // Accumulate lines
    if (currentMode === "text") {
      textLines.push(trimmed);
    } else {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        sourceValue = trimmed;
      } else {
        // Fallback: assume first non-metadata lines are text
        textLines.push(trimmed);
        currentMode = "text";
      }
    }
  }

  text = textLines.join("\n").trim();

  // Detect URL from text if sourceValue empty
  if (!sourceValue) {
    const urlMatch = rawText.match(/https?:\/\/[^\s)]+/i);
    if (urlMatch) {
      sourceValue = urlMatch[0];
      sourceType = "url";
    }
  } else {
    sourceType = sourceValue.startsWith("http") ? "url" : "text";
  }

  // Detect Date if not explicitly found
  if (!dateTime) {
    const isoMatch = rawText.match(/\b(\d{4})[-/](\d{2})[-/](\d{2})\b/);
    if (isoMatch) {
      dateTime = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    } else {
      const yearOnlyMatch = rawText.match(/\b(20\d{2})\b/);
      if (yearOnlyMatch) {
        dateTime = yearOnlyMatch[1];
      }
    }
  }

  // Resolve Arc
  const fullText = `${title} ${text} ${arc}`.toLowerCase();
  let resolvedArc = arc || "general";

  if (config?.arcs || config?.ifRoutes) {
    const allArcOptions = [
      ...(config.arcs || []).map((a) => ({ slug: a.slug, name: a.name })),
      ...(config.ifRoutes || []).map((r) => ({ slug: r.slug, name: r.name })),
    ];

    const directSlug = allArcOptions.find((a) => a.slug.toLowerCase() === arc.toLowerCase());
    if (directSlug) {
      resolvedArc = directSlug.slug;
    } else {
      for (let i = 9; i >= 1; i--) {
        if (new RegExp(`\\barc\\s*[-_ ]?${i}\\b`, "i").test(fullText)) {
          resolvedArc = `arc-${i}`;
          break;
        }
      }

      if (resolvedArc === "general" || !resolvedArc) {
        const ifKeywords: Record<string, string> = {
          "greed if": "greed-if",
          "sloth if": "sloth-if",
          "rem if": "sloth-if",
          "wrath if": "wrath-if",
          "pride if": "pride-if",
          "gluttony if": "gluttony-if",
          "lust if": "lust-if",
          "vainglory if": "vainglory-if",
          "school if": "school-if",
        };

        for (const [kw, slug] of Object.entries(ifKeywords)) {
          if (fullText.includes(kw)) {
            resolvedArc = slug;
            break;
          }
        }
      }
    }
  }

  // Suggest characters
  const characters = [...explicitChars];
  if (config?.characters) {
    const detectedChars = suggestTags(`${title} ${text}`, config.characters);
    for (const c of detectedChars) {
      if (!characters.includes(c)) characters.push(c);
    }
  }

  // Suggest topics
  const topics = [...explicitTopics];
  if (config?.topics) {
    const detectedTopics = suggestTags(`${title} ${text}`, config.topics);
    for (const t of detectedTopics) {
      if (!topics.includes(t)) topics.push(t);
    }
  }

  return {
    title: title || undefined,
    text,
    dateTime: dateTime || undefined,
    arc: resolvedArc,
    source: sourceValue ? { type: sourceType, value: sourceValue } : undefined,
    characters,
    topics,
    verified,
  };
}
