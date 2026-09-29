"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "od-lagna-bookmarks";
const EVENT_NAME = "od-lagna-bookmarks-changed";

export type BookmarksMap = Record<string, number>;

export interface BookmarksContextValue {
  bookmarks: BookmarksMap;
  bookmarkCount: number;
  bookmarkedIds: string[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  clearAllBookmarks: () => void;
  exportBookmarksJson: () => string;
  importBookmarksJson: (jsonString: string) => { success: boolean; added: number; error?: string };
  getShareableUrl: () => string;
  importFromUrlHash: (hash: string) => number;
  mounted: boolean;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

const EMPTY_BOOKMARKS: BookmarksMap = {};

let cachedRawBookmarks: string | null = null;
let cachedBookmarksMap: BookmarksMap = EMPTY_BOOKMARKS;

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT_NAME, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT_NAME, callback);
  };
}

function getBookmarksSnapshot(): BookmarksMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawBookmarks) {
      return cachedBookmarksMap;
    }
    cachedRawBookmarks = raw;
    if (!raw) {
      cachedBookmarksMap = EMPTY_BOOKMARKS;
      return cachedBookmarksMap;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      cachedBookmarksMap = parsed as BookmarksMap;
      return cachedBookmarksMap;
    }
    // Backward compatibility if someone stored an array of IDs
    if (Array.isArray(parsed)) {
      const map: BookmarksMap = {};
      const now = Date.now();
      for (const id of parsed) {
        if (typeof id === "string" && id.trim()) {
          map[id.trim()] = now;
        }
      }
      cachedBookmarksMap = map;
      return cachedBookmarksMap;
    }
    cachedBookmarksMap = EMPTY_BOOKMARKS;
    return cachedBookmarksMap;
  } catch {
    return cachedBookmarksMap;
  }
}

function saveBookmarksToStorage(bookmarks: BookmarksMap): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(bookmarks);
    cachedRawBookmarks = json;
    cachedBookmarksMap = bookmarks;
    localStorage.setItem(STORAGE_KEY, json);
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (err) {
    console.error("Failed to save bookmarks to localStorage:", err);
  }
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const bookmarks = useSyncExternalStore(
    subscribe,
    getBookmarksSnapshot,
    () => EMPTY_BOOKMARKS
  );

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const isBookmarked = useCallback(
    (id: string): boolean => {
      if (!id) return false;
      return Boolean(bookmarks[id]);
    },
    [bookmarks]
  );

  const addBookmark = useCallback((id: string) => {
    if (!id) return;
    const current = getBookmarksSnapshot();
    if (current[id]) return;
    const updated = { ...current, [id]: Date.now() };
    saveBookmarksToStorage(updated);
  }, []);

  const removeBookmark = useCallback((id: string) => {
    if (!id) return;
    const current = getBookmarksSnapshot();
    if (!current[id]) return;
    const updated = { ...current };
    delete updated[id];
    saveBookmarksToStorage(updated);
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    if (!id) return;
    const current = getBookmarksSnapshot();
    const updated = { ...current };
    if (updated[id]) {
      delete updated[id];
    } else {
      updated[id] = Date.now();
    }
    saveBookmarksToStorage(updated);
  }, []);

  const clearAllBookmarks = useCallback(() => {
    saveBookmarksToStorage({});
  }, []);

  const exportBookmarksJson = useCallback((): string => {
    const current = getBookmarksSnapshot();
    const items = Object.entries(current).map(([id, savedAt]) => ({
      id,
      savedAt,
    }));
    const payload = {
      version: 1,
      source: "od-lagna",
      exportedAt: new Date().toISOString(),
      total: items.length,
      bookmarks: items,
    };
    return JSON.stringify(payload, null, 2);
  }, []);

  const importBookmarksJson = useCallback(
    (jsonString: string): { success: boolean; added: number; error?: string } => {
      try {
        const parsed = JSON.parse(jsonString);
        let entriesToAdd: { id: string; savedAt: number }[] = [];

        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.bookmarks)) {
            entriesToAdd = parsed.bookmarks
              .filter((b: unknown) => b && typeof b === "object" && "id" in b)
              .map((b: { id: unknown; savedAt?: unknown }) => ({
                id: String(b.id).trim(),
                savedAt: typeof b.savedAt === "number" ? b.savedAt : Date.now(),
              }));
          } else if (Array.isArray(parsed)) {
            entriesToAdd = parsed.map((item: unknown) => {
              if (typeof item === "string") {
                return { id: item.trim(), savedAt: Date.now() };
              }
              if (item && typeof item === "object" && "id" in item) {
                const b = item as { id: unknown; savedAt?: unknown };
                return {
                  id: String(b.id).trim(),
                  savedAt: typeof b.savedAt === "number" ? b.savedAt : Date.now(),
                };
              }
              return { id: "", savedAt: Date.now() };
            });
          }
        }

        const validEntries = entriesToAdd.filter((e) => e.id.length > 0);
        if (validEntries.length === 0) {
          return { success: false, added: 0, error: "No valid bookmark entries found in file." };
        }

        const current = getBookmarksSnapshot();
        const updated = { ...current };
        let newCount = 0;

        for (const item of validEntries) {
          if (!updated[item.id]) {
            newCount++;
          }
          updated[item.id] = updated[item.id] || item.savedAt;
        }

        saveBookmarksToStorage(updated);
        return { success: true, added: newCount };
      } catch (err) {
        return {
          success: false,
          added: 0,
          error: err instanceof Error ? err.message : "Invalid JSON file",
        };
      }
    },
    []
  );

  const bookmarkedIds = useMemo(() => Object.keys(bookmarks), [bookmarks]);
  const bookmarkCount = useMemo(() => bookmarkedIds.length, [bookmarkedIds]);

  const getShareableUrl = useCallback((): string => {
    if (typeof window === "undefined" || bookmarkedIds.length === 0) return "";
    const idsParam = encodeURIComponent(bookmarkedIds.join(","));
    return `${window.location.origin}/saved#ids=${idsParam}`;
  }, [bookmarkedIds]);

  const importFromUrlHash = useCallback((hash: string): number => {
    if (!hash) return 0;
    const cleanHash = hash.replace(/^#/, "");
    const searchParams = new URLSearchParams(cleanHash);
    const rawIds = searchParams.get("ids") || (cleanHash.startsWith("ids=") ? cleanHash.slice(4) : "");
    if (!rawIds) return 0;

    const ids = decodeURIComponent(rawIds)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) return 0;

    const current = getBookmarksSnapshot();
    const updated = { ...current };
    let addedCount = 0;
    const now = Date.now();

    for (const id of ids) {
      if (!updated[id]) {
        updated[id] = now;
        addedCount++;
      }
    }

    if (addedCount > 0) {
      saveBookmarksToStorage(updated);
    }

    return addedCount;
  }, []);

  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      bookmarkCount,
      bookmarkedIds,
      isBookmarked,
      toggleBookmark,
      addBookmark,
      removeBookmark,
      clearAllBookmarks,
      exportBookmarksJson,
      importBookmarksJson,
      getShareableUrl,
      importFromUrlHash,
      mounted,
    }),
    [
      bookmarks,
      bookmarkCount,
      bookmarkedIds,
      isBookmarked,
      toggleBookmark,
      addBookmark,
      removeBookmark,
      clearAllBookmarks,
      exportBookmarksJson,
      importBookmarksJson,
      getShareableUrl,
      importFromUrlHash,
      mounted,
    ]
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksContextValue {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarksProvider");
  }
  return context;
}
