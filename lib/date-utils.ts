/**
 * Date formatting and utility helpers for Q&A records
 */

const utcDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

const localDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatQnaDate(dateStr?: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  try {
    // If format is YYYY
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-").map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      return utcDateFormatter.format(d);
    }

    // If format is ISO datetime or similar
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      return trimmed;
    }

    return localDateFormatter.format(d);
  } catch {
    return trimmed;
  }
}

export function getEntryDate(entry: {
  dateTime?: string;
  date?: string;
}): string | undefined {
  return entry.dateTime || entry.date;
}

export function getYearFromDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.trim().match(/^(\d{4})/);
  return match ? match[1] : null;
}
