"use client";

import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from "react";
import Link from "next/link";
import { QnaEntry, TriviaEntry } from "../lib/schema";
import { QnaCard } from "./QnaCard";
import { TriviaCard } from "./TriviaCard";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { CustomMultiSelect, MultiSelectOption } from "./CustomMultiSelect";
import { useBookmarks } from "../lib/bookmarks";
import { getArcMetadata } from "../lib/arc-utils";

interface SavedClientProps {
  allQnas: QnaEntry[];
  allTrivia?: TriviaEntry[];
}

const ITEMS_PER_PAGE = 20;

type SortOption = "recent" | "oldest" | "arc" | "id";

interface SavedItem {
  id: string;
  type: "qna" | "trivia";
  entry: QnaEntry | TriviaEntry;
  savedAt: number;
}

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  position: "top" | "bottom";
}

function PaginationNav({
  currentPage,
  totalPages,
  onPageChange,
  position,
}: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
  }

  const borderClass =
    position === "top"
      ? "pb-3 border-b border-[var(--border-subtle)]"
      : "pt-6 border-t border-[var(--border-subtle)]";

  return (
    <nav
      aria-label={`Pagination Navigation (${position})`}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${borderClass} text-xs sm:text-sm`}
    >
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
        >
          <span>←</span>
          <span>Previous</span>
        </button>

        {/* Mobile page status */}
        <span className="sm:hidden font-mono text-xs text-[var(--text-muted)] font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
        >
          <span>Next</span>
          <span>→</span>
        </button>
      </div>

      {/* Desktop / Laptop page numbers with ellipsis */}
      <div className="hidden sm:flex items-center gap-1.5">
        {pages.map((item, idx) =>
          item === "..." ? (
            <span
              key={`ellipsis-${position}-${idx}`}
              className="w-8 h-8 flex items-center justify-center font-mono text-xs text-[var(--text-muted)] select-none"
            >
              …
            </span>
          ) : (
            <button
              key={`page-${position}-${item}`}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={currentPage === item ? "page" : undefined}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold cursor-pointer transition-all shadow-2xs ${
                currentPage === item
                  ? "bg-[var(--accent)] text-white font-bold"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      {/* Total Indicator for desktop */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
        <span>Total {totalPages} Pages</span>
      </div>
    </nav>
  );
}

export function SavedClient({
  allQnas,
  allTrivia = [],
}: SavedClientProps) {
  const {
    bookmarks,
    bookmarkedIds,
    clearAllBookmarks,
    exportBookmarksJson,
    importBookmarksJson,
    getShareableUrl,
    importFromUrlHash,
    mounted,
  } = useBookmarks();

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [typeFilter, setTypeFilter] = useState<"all" | "qna" | "trivia">("all");
  const [selectedArcs, setSelectedArcs] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [characterMatchMode, setCharacterMatchMode] = useState<"all" | "any">("any");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicMatchMode, setTopicMatchMode] = useState<"all" | "any">("any");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide toast after 3.2 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Check URL hash for shared bookmark IDs on initial mount and on hashchange
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes("ids=") || hash.startsWith("#ids="))) {
        const added = importFromUrlHash(hash);
        if (added > 0) {
          const msg = `Imported ${added} bookmarked ${added === 1 ? "entry" : "entries"} from shared link!`;
          setTimeout(() => {
            setToastMessage(msg);
          }, 50);
        }
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [importFromUrlHash]);

  // Map of all available entries in database
  const entriesById = useMemo(() => {
    const map = new Map<string, { type: "qna" | "trivia"; entry: QnaEntry | TriviaEntry }>();
    for (const q of allQnas) {
      map.set(q.id, { type: "qna", entry: q });
    }
    for (const t of allTrivia) {
      map.set(t.id, { type: "trivia", entry: t });
    }
    return map;
  }, [allQnas, allTrivia]);

  // Resolve saved entries with savedAt timestamps
  const allSavedItems = useMemo<SavedItem[]>(() => {
    if (!mounted) return [];
    const list: SavedItem[] = [];
    for (const id of bookmarkedIds) {
      const match = entriesById.get(id);
      if (match) {
        list.push({
          id,
          type: match.type,
          entry: match.entry,
          savedAt: bookmarks[id] || 0,
        });
      }
    }
    return list;
  }, [mounted, bookmarkedIds, bookmarks, entriesById]);

  // Dynamic filter options derived exclusively from the saved items with counts
  const { arcOptions, characterOptions, topicOptions, qnaCount, triviaCount } = useMemo(() => {
    const arcCounts: Record<string, number> = {};
    const charCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    let qCount = 0;
    let tCount = 0;

    for (const item of allSavedItems) {
      if (item.type === "qna") qCount++;
      if (item.type === "trivia") tCount++;

      if (item.entry.arc) {
        arcCounts[item.entry.arc] = (arcCounts[item.entry.arc] || 0) + 1;
      }
      if (item.entry.characters) {
        for (const c of item.entry.characters) {
          charCounts[c] = (charCounts[c] || 0) + 1;
        }
      }
      if (item.entry.topics) {
        for (const t of item.entry.topics) {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        }
      }
    }

    const arcs: MultiSelectOption[] = Object.entries(arcCounts).map(([slug, count]) => {
      const meta = getArcMetadata(slug);
      const label = meta.type === "canon" && meta.order ? `Arc ${meta.order}: ${meta.name}` : meta.name;
      const group = meta.type === "canon" ? "Canon Story Arcs" : meta.type === "if" ? "IF Timelines" : "General / Lore";
      return {
        value: slug,
        label,
        count,
        group,
      };
    });

    const characters: MultiSelectOption[] = Object.entries(charCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name,
        count,
      }));

    const topics: MultiSelectOption[] = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name,
        count,
      }));

    return {
      arcOptions: arcs,
      characterOptions: characters,
      topicOptions: topics,
      qnaCount: qCount,
      triviaCount: tCount,
    };
  }, [allSavedItems]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = allSavedItems;

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Arc filter
    if (selectedArcs.length > 0) {
      const arcSet = new Set(selectedArcs);
      result = result.filter((item) => arcSet.has(item.entry.arc));
    }

    // Character filter with match mode (any / all)
    if (selectedCharacters.length > 0) {
      if (characterMatchMode === "all") {
        result = result.filter((item) => {
          const itemChars = item.entry.characters || [];
          return selectedCharacters.every((c) => itemChars.includes(c));
        });
      } else {
        result = result.filter((item) => {
          const itemChars = item.entry.characters || [];
          return selectedCharacters.some((c) => itemChars.includes(c));
        });
      }
    }

    // Topic filter with match mode (any / all)
    if (selectedTopics.length > 0) {
      if (topicMatchMode === "all") {
        result = result.filter((item) => {
          const itemTopics = item.entry.topics || [];
          return selectedTopics.every((t) => itemTopics.includes(t));
        });
      } else {
        result = result.filter((item) => {
          const itemTopics = item.entry.topics || [];
          return selectedTopics.some((t) => itemTopics.includes(t));
        });
      }
    }

    // Search query filter
    const query = deferredSearch.trim().toLowerCase();
    if (query) {
      const cleanQ = query.replace(/^#/, "").trim();
      const tokens = query.split(/\s+/).filter(Boolean);

      result = result.filter((item) => {
        const idLower = item.id.toLowerCase();
        if (idLower === cleanQ || idLower === query) return true;

        const question = "question" in item.entry ? item.entry.question.toLowerCase() : "";
        const answer = "answer" in item.entry ? item.entry.answer.toLowerCase() : "";
        const title = "title" in item.entry && item.entry.title ? item.entry.title.toLowerCase() : "";
        const chars = (item.entry.characters || []).map((c) => c.toLowerCase()).join(" ");
        const topics = (item.entry.topics || []).map((t) => t.toLowerCase()).join(" ");
        const arcMeta = getArcMetadata(item.entry.arc);
        const arcName = arcMeta.name.toLowerCase();

        const fullText = `${idLower} ${title} ${question} ${answer} ${chars} ${topics} ${arcName}`;

        return tokens.every((token) => fullText.includes(token));
      });
    }

    // Sort items
    result = [...result].sort((a, b) => {
      if (sortBy === "recent") {
        return b.savedAt - a.savedAt;
      }
      if (sortBy === "oldest") {
        return a.savedAt - b.savedAt;
      }
      if (sortBy === "id") {
        const numA = parseInt(a.id.replace(/\D/g, ""), 10);
        const numB = parseInt(b.id.replace(/\D/g, ""), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      if (sortBy === "arc") {
        const metaA = getArcMetadata(a.entry.arc);
        const metaB = getArcMetadata(b.entry.arc);
        const orderA = metaA.type === "canon" ? metaA.order ?? 99 : 100;
        const orderB = metaB.type === "canon" ? metaB.order ?? 99 : 100;
        if (orderA !== orderB) return orderA - orderB;
        return a.entry.arc.localeCompare(b.entry.arc);
      }
      return 0;
    });

    return result;
  }, [
    allSavedItems,
    typeFilter,
    selectedArcs,
    selectedCharacters,
    characterMatchMode,
    selectedTopics,
    topicMatchMode,
    deferredSearch,
    sortBy,
  ]);

  // Adjust pagination during render when any filter changes
  const filterKey = `${typeFilter}:${selectedArcs.join(",")}:${selectedCharacters.join(",")}:${characterMatchMode}:${selectedTopics.join(",")}:${topicMatchMode}:${deferredSearch}:${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, startIndex]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    typeFilter !== "all" ||
    selectedArcs.length > 0 ||
    selectedCharacters.length > 0 ||
    selectedTopics.length > 0;

  const handleClearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSelectedArcs([]);
    setSelectedCharacters([]);
    setCharacterMatchMode("any");
    setSelectedTopics([]);
    setTopicMatchMode("any");
  };

  // Export JSON
  const handleExport = () => {
    try {
      const jsonStr = exportBookmarksJson();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `od-lagna-saved-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToastMessage("Saved bookmarks exported successfully!");
    } catch {
      setToastMessage("Failed to export bookmarks.");
    }
  };

  // Import JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        const result = importBookmarksJson(content);
        if (result.success) {
          setToastMessage(`Successfully imported ${result.added} new bookmarks!`);
        } else {
          setToastMessage(result.error || "Failed to import bookmarks file.");
        }
      }
    };
    reader.onerror = () => setToastMessage("Error reading file.");
    reader.readAsText(file);
    e.target.value = "";
  };

  // Share Collection link
  const handleShare = async () => {
    const url = getShareableUrl();
    if (!url) {
      setToastMessage("No bookmarks to share.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage("Shareable collection link copied to clipboard!");
    } catch {
      setToastMessage("Unable to copy to clipboard.");
    }
  };

  // Confirm Clear All
  const handleConfirmClear = () => {
    clearAllBookmarks();
    setIsClearModalOpen(false);
    setToastMessage("All saved bookmarks have been cleared.");
  };

  const sortOptions: SelectOption[] = [
    { value: "recent", label: "Recently Saved" },
    { value: "oldest", label: "Oldest Saved" },
    { value: "arc", label: "Story Arc Order" },
    { value: "id", label: "Entry ID" },
  ];

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-10 bg-[var(--bg-elevated)] rounded-lg w-1/3"></div>
        <div className="h-20 bg-[var(--bg-elevated)] rounded-xl"></div>
        <div className="h-40 bg-[var(--bg-elevated)] rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-main)] shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
          <svg className="w-5 h-5 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        className="hidden"
        aria-hidden="true"
      />

      {/* Page Header & Stats */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-border)] text-xs font-mono font-bold text-[var(--accent-text)]">
              <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>SAVED LORE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Saved Lore &amp; Bookmarks
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl">
              Your personal collection of saved author statements and lore trivia.
            </p>

            {/* Quick Stat Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold">
                {allSavedItems.length} Total Saved
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                {qnaCount} Q&amp;A
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                {triviaCount} Trivia
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Share Collection */}
            <button
              type="button"
              onClick={handleShare}
              disabled={allSavedItems.length === 0}
              title="Copy shareable link with all saved IDs"
              className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share Link</span>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExport}
              disabled={allSavedItems.length === 0}
              title="Export bookmarks as a JSON backup file"
              className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export JSON</span>
            </button>

            {/* Import JSON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import saved bookmarks from JSON file"
              className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import JSON</span>
            </button>

            {/* Clear All */}
            {allSavedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                title="Remove all saved bookmarks"
                className="px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zero Bookmarks Empty State */}
      {allSavedItems.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shadow-xs">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-[var(--text-main)]">
              No saved lore entries yet
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Bookmark any author statement or trivia entry while exploring the archive or searching. Click the bookmark icon next to any entry ID to save it here for fast offline reading.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/browse"
              className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-colors shadow-xs"
            >
              Browse Q&amp;A Archive →
            </Link>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-sm font-medium text-[var(--text-main)] transition-colors cursor-pointer"
            >
              Import Existing Backup
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Controls Bar */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Top row: Search input & Entry Type toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <svg
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter saved by keyword or #ID..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-2 focus:outline-[var(--accent)] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Type Filter Pills */}
              <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5 text-xs font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer text-center ${
                    typeFilter === "all"
                      ? "bg-[var(--accent)] text-white font-semibold shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  All ({allSavedItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("qna")}
                  className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer text-center ${
                    typeFilter === "qna"
                      ? "bg-[var(--accent)] text-white font-semibold shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  Q&amp;A ({qnaCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("trivia")}
                  className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer text-center ${
                    typeFilter === "trivia"
                      ? "bg-[var(--accent)] text-white font-semibold shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  Trivia ({triviaCount})
                </button>
              </div>
            </div>

            {/* Middle row: Dropdown Multi-Selects with Autocomplete */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[var(--border-subtle)]">
              {/* Arc / Storyline Multi-Selector */}
              <div>
                <CustomMultiSelect
                  id="saved-arc-select"
                  values={selectedArcs}
                  onChange={setSelectedArcs}
                  options={arcOptions}
                  placeholder="All Story Arcs & IFs"
                  showSearch={true}
                  compact={true}
                  ariaLabel="Filter saved by Arc or Storyline"
                />
              </div>

              {/* Character Multi-Selector with Autocomplete & Match Mode */}
              <div>
                <CustomMultiSelect
                  id="saved-char-select"
                  values={selectedCharacters}
                  onChange={setSelectedCharacters}
                  options={characterOptions}
                  placeholder={`Characters (${characterOptions.length})`}
                  showSearch={true}
                  compact={true}
                  matchMode={characterMatchMode}
                  onMatchModeChange={setCharacterMatchMode}
                  ariaLabel="Filter saved by Character"
                />
              </div>

              {/* Topic Multi-Selector with Autocomplete & Match Mode */}
              <div>
                <CustomMultiSelect
                  id="saved-topic-select"
                  values={selectedTopics}
                  onChange={setSelectedTopics}
                  options={topicOptions}
                  placeholder={`Topics (${topicOptions.length})`}
                  showSearch={true}
                  compact={true}
                  matchMode={topicMatchMode}
                  onMatchModeChange={setTopicMatchMode}
                  ariaLabel="Filter saved by Topic"
                />
              </div>

              {/* Sort Selector */}
              <div>
                <CustomSelect
                  id="saved-sort-select"
                  value={sortBy}
                  onChange={(val) => setSortBy(val as SortOption)}
                  options={sortOptions}
                  compact={true}
                  ariaLabel="Sort saved entries"
                />
              </div>
            </div>

            {/* Active Selected Options in Bubbles / Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[var(--border-subtle)] animate-in fade-in duration-150">
                <span className="text-xs font-mono font-medium text-[var(--text-muted)] mr-1">
                  Active:
                </span>

                {/* Search Query Bubble */}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
                    Search: &ldquo;{searchQuery.trim()}&rdquo;
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Remove search query filter"
                      className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Entry Type Bubble */}
                {typeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent)] font-mono">
                    Type: {typeFilter.toUpperCase()}
                    <button
                      type="button"
                      onClick={() => setTypeFilter("all")}
                      aria-label="Remove entry type filter"
                      className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Arc Bubbles */}
                {selectedArcs.map((arcSlug) => {
                  const opt = arcOptions.find((o) => o.value === arcSlug);
                  const displayLabel = opt ? opt.label : arcSlug;
                  return (
                    <span
                      key={`pill-arc-${arcSlug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]"
                    >
                      {displayLabel}
                      <button
                        type="button"
                        onClick={() => setSelectedArcs(selectedArcs.filter((a) => a !== arcSlug))}
                        aria-label={`Remove arc filter for ${displayLabel}`}
                        className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                {/* Character Bubbles */}
                {selectedCharacters.map((char) => (
                  <span
                    key={`pill-char-${char}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]"
                  >
                    Character: {char}
                    <button
                      type="button"
                      onClick={() => setSelectedCharacters(selectedCharacters.filter((c) => c !== char))}
                      aria-label={`Remove character filter for ${char}`}
                      className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {/* Character Match Mode Indicator */}
                {selectedCharacters.length > 1 && (
                  <span
                    title={characterMatchMode === "all" ? "Matching all selected characters (AND)" : "Matching any selected character (OR)"}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                  >
                    Chars: {characterMatchMode.toUpperCase()}
                  </span>
                )}

                {/* Topic Bubbles */}
                {selectedTopics.map((topic) => (
                  <span
                    key={`pill-topic-${topic}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]"
                  >
                    Topic: {topic}
                    <button
                      type="button"
                      onClick={() => setSelectedTopics(selectedTopics.filter((t) => t !== topic))}
                      aria-label={`Remove topic filter for ${topic}`}
                      className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {/* Topic Match Mode Indicator */}
                {selectedTopics.length > 1 && (
                  <span
                    title={topicMatchMode === "all" ? "Matching all selected topics (AND)" : "Matching any selected topic (OR)"}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                  >
                    Topics: {topicMatchMode.toUpperCase()}
                  </span>
                )}

                {/* Reset All Filters Button */}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="ml-auto text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer py-0.5"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Count Header */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--text-muted)] font-mono">
            <span>
              Showing{" "}
              <strong className="text-[var(--text-main)]">
                {filteredItems.length === 0
                  ? 0
                  : `${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)}`}
              </strong>{" "}
              of <strong className="text-[var(--text-main)]">{filteredItems.length}</strong> saved{" "}
              {filteredItems.length === 1 ? "entry" : "entries"}
              {allSavedItems.length !== filteredItems.length && (
                <span> (filtered from {allSavedItems.length} total)</span>
              )}
            </span>
          </div>

          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <PaginationNav
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              position="top"
            />
          )}

          {/* Empty Results with active filters */}
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
              <p className="text-base font-semibold text-[var(--text-main)]">
                No saved entries match your filters
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Try searching for different keywords, clearing the arc/tag filters, or resetting the search.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((item) => (
                <div key={item.id} className="relative group">
                  {item.type === "qna" ? (
                    <QnaCard entry={item.entry as QnaEntry} />
                  ) : (
                    <TriviaCard entry={item.entry as TriviaEntry} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <PaginationNav
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              position="bottom"
            />
          )}
        </>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="clear-modal-title" className="text-base font-bold text-[var(--text-main)]">
                  Clear all saved bookmarks?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  This will remove all {allSavedItems.length} saved entries from your browser.
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
              Tip: You can export your bookmarks to JSON first if you want to keep a backup. Once cleared, this action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
