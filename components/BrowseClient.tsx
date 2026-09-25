"use client";

import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QnaEntry, TriviaEntry, ArchiveEntry, ArcConfig, IfRouteConfig } from "../lib/schema";
import { QnaCard } from "./QnaCard";
import { TriviaCard } from "./TriviaCard";
import { SpoilerControls } from "./SpoilerControls";
import { usePreferences } from "../lib/preferences";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { getEntryDate, getYearFromDate } from "../lib/date-utils";
import { dispatchUrlChange } from "../lib/navigation-events";

interface BrowseClientProps {
  allQnas: QnaEntry[];
  allTrivia?: TriviaEntry[];
  arcs: ArcConfig[];
  ifRoutes: IfRouteConfig[];
  characters: string[];
  topics: string[];
}

const ITEMS_PER_PAGE = 30;

export function BrowseClient({
  allQnas,
  allTrivia = [],
  arcs,
  ifRoutes,
  characters: initialCharacters,
  topics: initialTopics,
}: BrowseClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { spoilerArc, allowedIfRoutes, toggleIfRoute } = usePreferences();

  // Filter state initialized from URL query params
  const [selectedArc, setSelectedArc] = useState<string>(() => {
    return searchParams.get("arc") || searchParams.get("ifRoute") || "all";
  });
  const [selectedCharacter, setSelectedCharacter] = useState<string>(() => {
    return searchParams.get("character") || "all";
  });
  const [selectedTopic, setSelectedTopic] = useState<string>(() => {
    return searchParams.get("topic") || "all";
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return searchParams.get("year") || "all";
  });
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => {
    return searchParams.get("verified") === "true";
  });
  const [entryTypeFilter, setEntryTypeFilter] = useState<"all" | "qna" | "trivia">(() => {
    const t = searchParams.get("type");
    if (t === "qna" || t === "trivia") return t;
    return "all";
  });
  const [searchFilter, setSearchFilter] = useState<string>(() => {
    return searchParams.get("search") || searchParams.get("q") || "";
  });
  const deferredSearchFilter = useDeferredValue(searchFilter);

  const [sortBy, setSortBy] = useState<"canon" | "recent" | "oldest" | "date-desc" | "date-asc">("canon");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Combine Q&A and Trivia into a unified archive list
  const combinedEntries = useMemo<ArchiveEntry[]>(() => {
    const qnas: ArchiveEntry[] = allQnas.map((q) => ({ entryType: "qna" as const, ...q }));
    const trivias: ArchiveEntry[] = allTrivia.map((t) => ({ entryType: "trivia" as const, ...t }));
    return [...qnas, ...trivias];
  }, [allQnas, allTrivia]);

  const syncFiltersFromUrl = useCallback(
    (urlOrParams?: string | URLSearchParams) => {
      let sp: URLSearchParams;
      if (urlOrParams instanceof URLSearchParams) {
        sp = urlOrParams;
      } else if (typeof urlOrParams === "string") {
        try {
          sp = new URL(urlOrParams, window.location.origin).searchParams;
        } catch {
          sp = new URLSearchParams(urlOrParams.startsWith("?") ? urlOrParams : `?${urlOrParams}`);
        }
      } else if (typeof window !== "undefined") {
        sp = new URLSearchParams(window.location.search);
      } else {
        sp = searchParams;
      }

      React.startTransition(() => {
        setSelectedArc(sp.get("arc") || sp.get("ifRoute") || "all");
        setSelectedCharacter(sp.get("character") || "all");
        setSelectedTopic(sp.get("topic") || "all");
        setSelectedYear(sp.get("year") || "all");
        setVerifiedOnly(sp.get("verified") === "true");
        const typeParam = sp.get("type");
        setEntryTypeFilter(typeParam === "qna" || typeParam === "trivia" ? typeParam : "all");
        setSearchFilter(sp.get("search") || sp.get("q") || "");
        setCurrentPage(1);
      });
    },
    [searchParams]
  );

  useEffect(() => {
    const handleUrlChange = (e?: Event) => {
      const customEvent = e as CustomEvent<string> | undefined;
      const detail = customEvent?.detail;
      syncFiltersFromUrl(detail);
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("od-lagna-urlchange", handleUrlChange);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("od-lagna-urlchange", handleUrlChange);
    };
  }, [syncFiltersFromUrl]);

  // Sync when Next.js useSearchParams updates
  useEffect(() => {
    syncFiltersFromUrl(searchParams);
  }, [searchParams, syncFiltersFromUrl]);

  // Derive all unique characters and topics from combined entries and initial registries
  const allCharacters = useMemo(() => {
    const set = new Set(initialCharacters);
    for (const entry of combinedEntries) {
      for (const c of entry.characters) set.add(c);
    }
    return Array.from(set).sort();
  }, [initialCharacters, combinedEntries]);

  const allTopics = useMemo(() => {
    const set = new Set(initialTopics);
    for (const entry of combinedEntries) {
      for (const t of entry.topics) set.add(t);
    }
    return Array.from(set).sort();
  }, [initialTopics, combinedEntries]);

  // Arc options for CustomSelect
  const arcOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All Arcs & Storylines" },
      { value: "general", label: "General / No Story Spoilers" },
      ...arcs.map((a) => ({
        value: a.slug,
        label: `Arc ${a.order}: ${a.name}`,
        group: "Canonical Arcs",
      })),
      ...ifRoutes.map((r) => ({
        value: r.slug,
        label: r.name,
        group: r.type === "side-story" ? "Side Stories" : "IF Routes",
      })),
    ],
    [arcs, ifRoutes]
  );

  // Character options for CustomSelect
  const characterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All Characters" },
      ...allCharacters.map((c) => ({
        value: c,
        label: c,
      })),
    ],
    [allCharacters]
  );

  // Topic options for CustomSelect
  const topicOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All Topics" },
      ...allTopics.map((t) => ({
        value: t,
        label: t,
      })),
    ],
    [allTopics]
  );

  // Year options derived from entries with valid dates
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    for (const entry of combinedEntries) {
      const y = getYearFromDate(getEntryDate(entry));
      if (y) set.add(y);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [combinedEntries]);

  const yearOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All Years" },
      ...availableYears.map((y) => ({
        value: y,
        label: y,
      })),
    ],
    [availableYears]
  );

  // Sort options for CustomSelect
  const sortOptions: SelectOption[] = [
    { value: "canon", label: "Canon Arc Order" },
    { value: "recent", label: "Recently Added (ID ↓)" },
    { value: "oldest", label: "Oldest (ID ↑)" },
    { value: "date-desc", label: "Date: Newest First" },
    { value: "date-asc", label: "Date: Oldest First" },
  ];

  // Tag click helper
  const handleTagClick = (type: "character" | "topic", tag: string) => {
    const url = `/browse?${type}=${encodeURIComponent(tag)}`;
    router.push(url);
    dispatchUrlChange(url);
  };

  // Filter items
  const filteredEntries = useMemo(() => {
    const trimmedQuery = deferredSearchFilter.trim().toLowerCase();
    const queryTokens = trimmedQuery ? trimmedQuery.split(/\s+/).filter(Boolean) : [];

    return combinedEntries.filter((entry) => {
      // Entry Type filter
      if (entryTypeFilter !== "all" && entry.entryType !== entryTypeFilter) {
        return false;
      }

      // Arc filter
      if (selectedArc !== "all" && entry.arc !== selectedArc) {
        return false;
      }

      // Character filter
      if (selectedCharacter !== "all" && !entry.characters.includes(selectedCharacter)) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== "all" && !entry.topics.includes(selectedTopic)) {
        return false;
      }

      // Year filter
      if (selectedYear !== "all") {
        const entryYear = getYearFromDate(getEntryDate(entry));
        if (entryYear !== selectedYear) return false;
      }

      // Verified filter
      if (verifiedOnly && !entry.verified) {
        return false;
      }

      // Text search filter (token-based AND matching across question, answer/text, title, tags, ID)
      if (queryTokens.length > 0) {
        const entryIdLower = entry.id.toLowerCase();
        const charsLower = entry.characters.map((c) => c.toLowerCase());
        const topicsLower = entry.topics.map((t) => t.toLowerCase());

        let qText = "";
        let aText = "";
        let tTitle = "";

        if (entry.entryType === "qna") {
          qText = entry.question.toLowerCase();
          aText = entry.answer.toLowerCase();
        } else {
          aText = entry.text.toLowerCase();
          tTitle = (entry.title || "").toLowerCase();
        }

        // Handle exact/normalized ID match check
        const rawTrimmed = trimmedQuery.replace(/^#/, "");
        const isTriviaSearch = /^tr[-_\s]?\d+/i.test(rawTrimmed);
        const numericIdQuery = rawTrimmed.replace(/^(qna|tr)[\s#-]+/i, "").trim();
        const isNumeric = /^\d+$/.test(numericIdQuery);

        const exactIdMatch =
          entryIdLower === rawTrimmed ||
          (isTriviaSearch && entryIdLower === rawTrimmed.replace(/\s+/g, "-")) ||
          (isNumeric &&
            (entryIdLower === numericIdQuery.padStart(4, "0") ||
              parseInt(entryIdLower.replace(/^tr-/, ""), 10).toString() === numericIdQuery));

        if (exactIdMatch) {
          return true;
        }

        // Each token must match at least one field
        for (const token of queryTokens) {
          const matches =
            entryIdLower.includes(token) ||
            qText.includes(token) ||
            aText.includes(token) ||
            tTitle.includes(token) ||
            charsLower.some((c) => c.includes(token)) ||
            topicsLower.some((t) => t.includes(token));

          if (!matches) return false;
        }
      }

      return true;
    });
  }, [
    combinedEntries,
    entryTypeFilter,
    selectedArc,
    selectedCharacter,
    selectedTopic,
    selectedYear,
    verifiedOnly,
    deferredSearchFilter,
  ]);

  // Sorting
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];

    const arcOrderMap = new Map<string, number>();
    arcs.forEach((a) => arcOrderMap.set(a.slug, a.order));
    ifRoutes.forEach((r, idx) => arcOrderMap.set(r.slug, 100 + idx));
    arcOrderMap.set("general", 999);

    if (sortBy === "canon") {
      list.sort((a, b) => {
        const orderA = arcOrderMap.get(a.arc) ?? 500;
        const orderB = arcOrderMap.get(b.arc) ?? 500;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });
    } else if (sortBy === "recent") {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortBy === "date-desc") {
      list.sort((a, b) => {
        const dateA = getEntryDate(a);
        const dateB = getEntryDate(b);
        const timeA = dateA ? new Date(dateA).getTime() : -Infinity;
        const timeB = dateB ? new Date(dateB).getTime() : -Infinity;
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
          return timeB - timeA;
        }
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        return b.id.localeCompare(a.id);
      });
    } else if (sortBy === "date-asc") {
      list.sort((a, b) => {
        const dateA = getEntryDate(a);
        const dateB = getEntryDate(b);
        const timeA = dateA ? new Date(dateA).getTime() : Infinity;
        const timeB = dateB ? new Date(dateB).getTime() : Infinity;
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
          return timeA - timeB;
        }
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        return a.id.localeCompare(b.id);
      });
    }

    return list;
  }, [filteredEntries, sortBy, arcs, ifRoutes]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = sortedEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const selectedIfRoute = useMemo(() => {
    return ifRoutes.find((r) => r.slug === selectedArc);
  }, [ifRoutes, selectedArc]);

  const isSelectedIfRouteGated = useMemo(() => {
    if (!selectedIfRoute) return false;
    return !allowedIfRoutes.includes(selectedIfRoute.slug);
  }, [selectedIfRoute, allowedIfRoutes]);

  // Handle deep-link scrolling to ?id=0001 or ?id=TR-0001 (auto switches to correct page)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchId = searchParams.get("id") || searchParams.get("qna");
    const hashId = window.location.hash
      ? window.location.hash.slice(1).replace(/^(qna|trivia)-/, "")
      : null;
    const targetId = searchId || hashId;

    if (targetId) {
      const isTrivia = /^tr[-_\s]?\d+/i.test(targetId);
      const cleanTargetId = isTrivia
        ? targetId.toUpperCase().replace(/\s+/g, "-")
        : targetId.replace(/^#/, "").replace(/^qna[\s#-]+/i, "").trim();
      const isNum = !isTrivia && /^\d+$/.test(cleanTargetId);

      const itemIndex = sortedEntries.findIndex((e) => {
        if (e.id === targetId || e.id === cleanTargetId) return true;
        if (isTrivia) {
          return e.id.toLowerCase() === targetId.toLowerCase();
        }
        return isNum && (e.id === cleanTargetId.padStart(4, "0") || parseInt(e.id, 10).toString() === cleanTargetId);
      });

      if (itemIndex !== -1) {
        const targetPage = Math.floor(itemIndex / ITEMS_PER_PAGE) + 1;
        setTimeout(() => {
          setCurrentPage((prev) => (prev !== targetPage ? targetPage : prev));
          const el =
            document.getElementById(`qna-${targetId}`) ||
            document.getElementById(`trivia-${targetId}`) ||
            document.getElementById(`qna-${cleanTargetId}`) ||
            document.getElementById(`trivia-${cleanTargetId}`) ||
            (isNum ? document.getElementById(`qna-${cleanTargetId.padStart(4, "0")}`) : null);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      }
    }
  }, [sortedEntries, searchParams]);

  // Active filters count
  const hasActiveFilters =
    entryTypeFilter !== "all" ||
    selectedArc !== "all" ||
    selectedCharacter !== "all" ||
    selectedTopic !== "all" ||
    selectedYear !== "all" ||
    verifiedOnly ||
    searchFilter.trim() !== "";

  const clearAllFilters = () => {
    setEntryTypeFilter("all");
    setSelectedArc("all");
    setSelectedCharacter("all");
    setSelectedTopic("all");
    setSelectedYear("all");
    setVerifiedOnly(false);
    setSearchFilter("");
    setCurrentPage(1);
    if (typeof window !== "undefined" && window.location.search) {
      router.push("/browse");
      dispatchUrlChange("/browse");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Spoiler Quick-Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Browse Archive
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Explore {allQnas.length} author Q&amp;As and {allTrivia.length} trivia statements across canon arcs and IF timelines.
          </p>
        </div>

        {/* Current spoiler state badge */}
        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>
              Cutoff: <strong>Arc {spoilerArc}</strong>
            </span>
            <span className="text-[var(--text-faint)]">|</span>
            <span>
              IF Routes:{" "}
              <strong>
                {allowedIfRoutes.length === 0
                  ? "Hidden"
                  : allowedIfRoutes.length === ifRoutes.length
                  ? "All Included"
                  : `${allowedIfRoutes.length}/${ifRoutes.length} Allowed`}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Card List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-semibold flex items-center justify-center gap-2 text-[var(--text-main)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{isFilterDrawerOpen ? "Hide Filters" : "Filter & Refine"}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        </div>

        {/* Filter Sidebar */}
        <aside
          className={`lg:block space-y-6 ${
            isFilterDrawerOpen ? "block" : "hidden"
          } p-5 lg:p-0 rounded-xl border lg:border-none border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:bg-transparent`}
        >
          {/* Entry Type Filter Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Entry Type
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setEntryTypeFilter("all");
                  setCurrentPage(1);
                }}
                className={`py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer ${
                  entryTypeFilter === "all"
                    ? "bg-[var(--accent)] text-white font-bold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                All ({combinedEntries.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryTypeFilter("qna");
                  setCurrentPage(1);
                }}
                className={`py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer ${
                  entryTypeFilter === "qna"
                    ? "bg-[var(--accent)] text-white font-bold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                Q&amp;A ({allQnas.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryTypeFilter("trivia");
                  setCurrentPage(1);
                }}
                className={`py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer ${
                  entryTypeFilter === "trivia"
                    ? "bg-[var(--accent)] text-white font-bold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                Trivia ({allTrivia.length})
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="space-y-1.5">
            <label htmlFor="filter-search" className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Filter By Keyword
            </label>
            <input
              id="filter-search"
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by keyword or #ID..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Arc / Storyline Selector */}
          <div className="space-y-1.5">
            <label htmlFor="arc-select" className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Arc / Storyline
            </label>
            <CustomSelect
              id="arc-select"
              value={selectedArc}
              onChange={(val) => {
                setSelectedArc(val);
                setCurrentPage(1);
              }}
              options={arcOptions}
              placeholder="All Arcs & Storylines"
            />
          </div>

          {/* Character Selector */}
          <div className="space-y-1.5">
            <label htmlFor="char-select" className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Character ({allCharacters.length})
            </label>
            <CustomSelect
              id="char-select"
              value={selectedCharacter}
              onChange={(val) => {
                setSelectedCharacter(val);
                setCurrentPage(1);
              }}
              options={characterOptions}
              placeholder="All Characters"
              showSearch={true}
            />
          </div>

          {/* Topic Selector */}
          <div className="space-y-1.5">
            <label htmlFor="topic-select" className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Topic ({allTopics.length})
            </label>
            <CustomSelect
              id="topic-select"
              value={selectedTopic}
              onChange={(val) => {
                setSelectedTopic(val);
                setCurrentPage(1);
              }}
              options={topicOptions}
              placeholder="All Topics"
              showSearch={true}
            />
          </div>

          {/* Year Selector */}
          {availableYears.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="year-select" className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Year ({availableYears.length})
              </label>
              <CustomSelect
                id="year-select"
                value={selectedYear}
                onChange={(val) => {
                  setSelectedYear(val);
                  setCurrentPage(1);
                }}
                options={yearOptions}
                placeholder="All Years"
              />
            </div>
          )}

          {/* Verified Only Toggle */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => {
                  setVerifiedOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
              />
              <span className="text-sm font-medium text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                Verified Sources Only
              </span>
            </label>
          </div>

          {/* Clear button if active filters */}
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full py-1.5 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Embedded Spoiler Controls in Sidebar */}
          <div className="pt-6 border-t border-[var(--border-subtle)] space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Spoiler Cutoff
            </h3>
            <SpoilerControls compact={true} showPresets={false} />
          </div>
        </aside>

        {/* Content Column: Active Filters, Sort Bar, and Card List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar: Sort, Count & Active Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm">
            <div className="text-[var(--text-muted)] font-medium">
              Showing{" "}
              <strong className="text-[var(--text-main)]">
                {sortedEntries.length === 0
                  ? 0
                  : `${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, sortedEntries.length)}`}
              </strong>{" "}
              of <strong className="text-[var(--text-main)]">{sortedEntries.length}</strong> matching{" "}
              {entryTypeFilter === "qna"
                ? "Q&As"
                : entryTypeFilter === "trivia"
                ? "trivia entries"
                : "entries"}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-[var(--text-muted)] font-medium shrink-0">
                Sort:
              </label>
              <div className="w-48">
                <CustomSelect
                  id="sort-select"
                  value={sortBy}
                  onChange={(val) => setSortBy(val as "canon" | "recent" | "oldest" | "date-desc" | "date-asc")}
                  options={sortOptions}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono font-medium text-[var(--text-muted)] mr-1">Active:</span>

              {entryTypeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent)] font-mono">
                  Type: {entryTypeFilter.toUpperCase()}
                  <button
                    type="button"
                    onClick={() => setEntryTypeFilter("all")}
                    aria-label="Remove entry type filter"
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedArc !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                  Arc: {selectedArc}
                  <button
                    type="button"
                    onClick={() => setSelectedArc("all")}
                    aria-label={`Remove arc filter for ${selectedArc}`}
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedCharacter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                  Character: {selectedCharacter}
                  <button
                    type="button"
                    onClick={() => setSelectedCharacter("all")}
                    aria-label={`Remove character filter for ${selectedCharacter}`}
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedTopic !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                  Topic: {selectedTopic}
                  <button
                    type="button"
                    onClick={() => setSelectedTopic("all")}
                    aria-label={`Remove topic filter for ${selectedTopic}`}
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedYear !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                  Year: {selectedYear}
                  <button
                    type="button"
                    onClick={() => setSelectedYear("all")}
                    aria-label={`Remove year filter for ${selectedYear}`}
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {verifiedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--verified-bg)] border border-[var(--verified-border)] text-[var(--verified-text)]">
                  Verified Only
                  <button
                    type="button"
                    onClick={() => setVerifiedOnly(false)}
                    aria-label="Remove verified only filter"
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {searchFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                  &ldquo;{searchFilter}&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearchFilter("")}
                    aria-label="Remove search keyword filter"
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline ml-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* IF Route Spoiler Notice */}
          {isSelectedIfRouteGated && selectedIfRoute && (
            <div className="p-4 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--warning-text)]">
                <span>⚠️ Spoilers for <strong>{selectedIfRoute.name}</strong> are currently hidden by your spoiler filter. Individual cards below are masked.</span>
              </div>
              <button
                type="button"
                onClick={() => toggleIfRoute(selectedIfRoute.slug)}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap cursor-pointer"
              >
                Reveal &amp; Allow {selectedIfRoute.name}
              </button>
            </div>
          )}

          {/* Cards List */}
          {currentEntries.length > 0 ? (
            <div className="space-y-4">
              {currentEntries.map((entry) =>
                entry.entryType === "trivia" ? (
                  <TriviaCard
                    key={`trivia-${entry.id}`}
                    entry={entry}
                    onTagClick={handleTagClick}
                  />
                ) : (
                  <QnaCard
                    key={`qna-${entry.id}`}
                    entry={entry}
                    onTagClick={handleTagClick}
                  />
                )
              )}
            </div>
          ) : (
            <div className="p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                No entries match current criteria
              </h3>
              <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                {combinedEntries.length === 0
                  ? "The archive is currently empty."
                  : "Try resetting filters or loosening your search query."}
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav
              aria-label="Pagination Navigation"
              className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[var(--border-subtle)] text-xs sm:text-sm"
            >
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
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
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>

              {/* Desktop / Laptop page numbers with ellipsis */}
              <div className="hidden sm:flex items-center gap-1.5">
                {(() => {
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
                  return pages.map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center font-mono text-xs text-[var(--text-muted)] select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setCurrentPage(item);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
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
                  );
                })()}
              </div>

              {/* Total Indicator for desktop */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                <span>Total {totalPages} Pages</span>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
