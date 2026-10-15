import { QnaEntry, TriviaEntry, TwitterShortStory, getEntrySources } from "./schema";
import { formatQnaDate, getEntryDate } from "./date-utils";

export type AnyShareableEntry = QnaEntry | TriviaEntry | TwitterShortStory;

export function isQnaEntry(entry: AnyShareableEntry): entry is QnaEntry {
  return "question" in entry && "answer" in entry;
}

export function isTwitterShortStory(entry: AnyShareableEntry): entry is TwitterShortStory {
  return "story" in entry && "url" in entry;
}

export function getEntryShareUrl(id: string): string {
  const isTss = id.startsWith("TSS-");
  const path = isTss ? `/twitter-short-stories?id=${encodeURIComponent(id)}` : `/qna?id=${encodeURIComponent(id)}`;
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}${path}`;
  }
  return `https://od-lagna.pages.dev${path}`;
}

export function getEntryTypeLabel(entry: AnyShareableEntry): "Q&A" | "Trivia" | "Short Story" {
  if (isTwitterShortStory(entry)) return "Short Story";
  return isQnaEntry(entry) ? "Q&A" : "Trivia";
}

/**
 * Formats the entry into clean Plain Markdown containing ONLY:
 * - Date
 * - Question / Title
 * - Answer / Story
 * - Source (two separate sections: primary tweet sources and Od-Lagna archive link)
 * No spoiler alert warnings included.
 */
export function formatPlainMarkdown(entry: AnyShareableEntry, shareUrl?: string): string {
  const url = shareUrl || getEntryShareUrl(entry.id);
  const rawDate = isTwitterShortStory(entry) ? entry.date : getEntryDate(entry);
  const dateFormatted = formatQnaDate(rawDate);

  const lines: string[] = [];

  // Date
  if (dateFormatted) {
    lines.push(`> **Date:** ${dateFormatted}`);
    lines.push(`>`);
  }

  if (isTwitterShortStory(entry)) {
    lines.push(`> **Twitter Short Story:**`);
    if (entry.title) {
      lines.push(`> ### ${entry.title}`);
    }
    lines.push(`>`);
    const storyLines = entry.story.split("\n");
    for (const sLine of storyLines) {
      lines.push(`> ${sLine}`);
    }
  } else if (isQnaEntry(entry)) {
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

  const sources = isTwitterShortStory(entry)
    ? (entry.urls && entry.urls.length > 0 ? entry.urls : [entry.url]).map((u) => ({ type: "url" as const, value: u }))
    : getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);

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
 * Clean plain text containing ONLY: Date, Question/Title, Answer/Story, and Source sections.
 */
export function formatPlainText(entry: AnyShareableEntry, shareUrl?: string): string {
  const url = shareUrl || getEntryShareUrl(entry.id);
  const rawDate = isTwitterShortStory(entry) ? entry.date : getEntryDate(entry);
  const dateFormatted = formatQnaDate(rawDate);

  const lines: string[] = [];

  if (dateFormatted) {
    lines.push(`Date: ${dateFormatted}`);
    lines.push("");
  }

  if (isTwitterShortStory(entry)) {
    lines.push(
      entry.title
        ? `Twitter Short Story: ${entry.title}`
        : `Twitter Short Story`
    );
    lines.push("");
    lines.push(entry.story);
  } else if (isQnaEntry(entry)) {
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
  const textSources = isTwitterShortStory(entry)
    ? (entry.urls && entry.urls.length > 0 ? entry.urls : [entry.url]).map((u) => ({ type: "url" as const, value: u }))
    : getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);

  if (textSources.length === 1) {
    lines.push(`Source: ${textSources[0].value}`);
    lines.push("");
  } else if (textSources.length > 1) {
    lines.push(`Sources:`);
    for (const s of textSources) {
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
export function formatSourcesOnly(entry: AnyShareableEntry, shareUrl?: string): string {
  const url = shareUrl || getEntryShareUrl(entry.id);
  const lines: string[] = [];

  const sources = isTwitterShortStory(entry)
    ? (entry.urls && entry.urls.length > 0 ? entry.urls : [entry.url]).map((u) => ({ type: "url" as const, value: u }))
    : getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);

  if (sources.length === 1) {
    lines.push(`Source: ${sources[0].value}`);
  } else if (sources.length > 1) {
    lines.push(`Sources:`);
    for (const s of sources) {
      lines.push(`- ${s.value}`);
    }
  }

  lines.push("");
  lines.push(`Od-Lagna Archive: ${url}`);

  return lines.join("\n");
}
