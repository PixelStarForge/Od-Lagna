import { QnaEntry, TriviaEntry, getEntrySources } from "./schema";
import { formatQnaDate, getEntryDate } from "./date-utils";

export function isQnaEntry(entry: QnaEntry | TriviaEntry): entry is QnaEntry {
  return "question" in entry && "answer" in entry;
}

export function getEntryShareUrl(id: string): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}/qna?id=${encodeURIComponent(id)}`;
  }
  return `https://od-lagna.pages.dev/qna?id=${encodeURIComponent(id)}`;
}

export function getEntryTypeLabel(entry: QnaEntry | TriviaEntry): "Q&A" | "Trivia" {
  return isQnaEntry(entry) ? "Q&A" : "Trivia";
}

/**
 * Formats the entry into clean Plain Markdown containing ONLY:
 * - Date
 * - Question
 * - Answer
 * - Source (two separate sections: primary tweet sources and Od-Lagna archive link)
 * No spoiler alert warnings included.
 */
export function formatPlainMarkdown(entry: QnaEntry | TriviaEntry, shareUrl?: string): string {
  const url = shareUrl || getEntryShareUrl(entry.id);
  const dateFormatted = formatQnaDate(getEntryDate(entry));

  const sources = getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);

  const lines: string[] = [];

  // Date
  if (dateFormatted) {
    lines.push(`> **Date:** ${dateFormatted}`);
    lines.push(`>`);
  }

  // Question & Answer or Trivia
  if (isQnaEntry(entry)) {
    lines.push(`> **Question:**`);
    const qLines = entry.question.split("\n");
    for (const qLine of qLines) {
      lines.push(`> ${qLine}`);
    }
    lines.push(`>`);
    lines.push(`> **Answer:**`);
    const aLines = entry.answer.split("\n");
    for (const aLine of aLines) {
      lines.push(`> ${aLine}`);
    }
  } else {
    lines.push(`> **Trivia:**`);
    if (entry.title) {
      lines.push(`> **${entry.title}**`);
      lines.push(`>`);
    }
    const tLines = entry.text.split("\n");
    for (const tLine of tLines) {
      lines.push(`> ${tLine}`);
    }
  }

  lines.push(`>`);
  lines.push(`> ---`);

  // Sources (handles single source or multiple sources cleanly)
  if (sources.length === 1) {
    const s = sources[0];
    if (s.type === "url") {
      lines.push(`> **Source:** [${s.value}](${s.value})`);
    } else {
      lines.push(`> **Source:** ${s.value}`);
    }
    lines.push(`>`);
  } else if (sources.length > 1) {
    lines.push(`> **Sources:**`);
    for (const s of sources) {
      if (s.type === "url") {
        lines.push(`> - [${s.value}](${s.value})`);
      } else {
        lines.push(`> - ${s.value}`);
      }
    }
    lines.push(`>`);
  }

  // Od-Lagna Archive website link
  lines.push(`> **Od-Lagna Archive:** [${url}](${url})`);

  return lines.join("\n");
}

/**
 * Clean plain text containing ONLY: Date, Question, Answer, and two Source sections.
 * No spoiler alert warnings included.
 */
export function formatPlainText(entry: QnaEntry | TriviaEntry, shareUrl?: string): string {
  const url = shareUrl || getEntryShareUrl(entry.id);
  const dateFormatted = formatQnaDate(getEntryDate(entry));
  const sources = getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);

  const lines: string[] = [];

  if (dateFormatted) {
    lines.push(`Date: ${dateFormatted}`);
    lines.push("");
  }

  if (isQnaEntry(entry)) {
    lines.push(`Question:`);
    lines.push(entry.question);
    lines.push("");
    lines.push(`Answer:`);
    lines.push(entry.answer);
  } else {
    lines.push(`Trivia:`);
    if (entry.title) {
      lines.push(entry.title);
      lines.push("");
    }
    lines.push(entry.text);
  }

  lines.push("");
  if (sources.length === 1) {
    lines.push(`Source: ${sources[0].value}`);
    lines.push("");
  } else if (sources.length > 1) {
    lines.push(`Sources:`);
    for (const s of sources) {
      lines.push(`- ${s.value}`);
    }
    lines.push("");
  }
  lines.push(`Od-Lagna Archive: ${url}`);

  return lines.join("\n");
}

/**
 * Clean sources-only format for users who share the card image
 * and just need to paste the source citation and Od-Lagna archive link.
 */
export function formatSourcesOnly(entry: QnaEntry | TriviaEntry, shareUrl?: string): string {
  const url = shareUrl || getEntryShareUrl(entry.id);
  const sources = getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);

  const lines: string[] = [];

  if (sources.length === 1) {
    lines.push(`Source: ${sources[0].value}`);
  } else if (sources.length > 1) {
    lines.push(`Sources:`);
    for (const s of sources) {
      lines.push(`- ${s.value}`);
    }
  }

  if (sources.length > 0) {
    lines.push("");
  }
  lines.push(`Od-Lagna Archive: ${url}`);

  return lines.join("\n");
}
