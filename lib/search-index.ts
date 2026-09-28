export interface SearchIndexRecord {
  id: string;
  entryType?: "qna" | "trivia";
  title?: string;
  question: string;
  answerSnippet: string;
  answerSearchText: string;
  characters: string[];
  topics: string[];
  arc: string;
  arcName: string;
  verified: boolean;
  dateTime?: string;
}

export interface SearchIndexAliasItem {
  name: string;
  arc?: string;
}

export interface SearchIndexCharacterProfile {
  id: string;
  name: string;
  arc: string;
  japaneseName?: string;
  aliases: (string | SearchIndexAliasItem)[];
}

export interface SearchIndexPayload {
  records: SearchIndexRecord[];
  characters: string[];
  topics: string[];
  characterProfiles?: SearchIndexCharacterProfile[];
}

let cachedSearchPayload: SearchIndexPayload | null = null;
let inflightPromise: Promise<SearchIndexPayload> | null = null;

export function getCachedSearchPayload(): SearchIndexPayload | null {
  return cachedSearchPayload;
}

export async function fetchSearchIndex(): Promise<SearchIndexPayload> {
  if (cachedSearchPayload) {
    return cachedSearchPayload;
  }
  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = fetch("/search-index.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load search index");
      return res.json();
    })
    .then((data: SearchIndexPayload | SearchIndexRecord[]) => {
      let payload: SearchIndexPayload;
      if (Array.isArray(data)) {
        const chars = new Set<string>();
        const topics = new Set<string>();
        data.forEach((d) => {
          d.characters.forEach((c) => chars.add(c));
          d.topics.forEach((t) => topics.add(t));
        });
        payload = {
          records: data,
          characters: Array.from(chars).sort(),
          topics: Array.from(topics).sort(),
          characterProfiles: [],
        };
      } else {
        payload = {
          records: data.records || [],
          characters: data.characters || [],
          topics: data.topics || [],
          characterProfiles: data.characterProfiles || [],
        };
      }
      cachedSearchPayload = payload;
      inflightPromise = null;
      return payload;
    })
    .catch((err) => {
      inflightPromise = null;
      throw err;
    });

  return inflightPromise;
}

export function preloadSearchIndex(): void {
  if (typeof window !== "undefined" && !cachedSearchPayload && !inflightPromise) {
    fetchSearchIndex().catch(() => {});
  }
}

