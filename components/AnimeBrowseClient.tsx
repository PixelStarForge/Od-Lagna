"use client";

import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimeCatalogEntry, FlatAnimeComment, getSeasonBadgeLabel } from "../lib/schema";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { CustomMultiSelect, MultiSelectOption } from "./CustomMultiSelect";

interface AnimeBrowseClientProps {
  allComments: FlatAnimeComment[];
  seasons: AnimeCatalogEntry[];
  characters: string[];
  topics: string[];
}

const ITEMS_PER_PAGE = 30;

function parseArrayParam(param: string | null): string[] {
  if (!param || param === "all") return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

const SORT_OPTIONS: SelectOption[] = [
  { value: "chrono", label: "Chronological (S1 → S4)" },
  { value: "reverse-chrono", label: "Reverse Chronological (S4 → S1)" },
  { value: "comment-asc", label: "Comment # Ascending" },
  { value: "comment-desc", label: "Comment # Descending" },
];

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

      {/* Desktop page numbers */}
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

export function AnimeBrowseClient({
  allComments,
  seasons,
  characters: initialCharacters,
  topics: initialTopics,
}: AnimeBrowseClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Multi-Filter states initialized from URL query params
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(() => {
    return parseArrayParam(searchParams.get("seasons") || searchParams.get("season"));
  });

  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(() => {
    return parseArrayParam(searchParams.get("characters") || searchParams.get("character"));
  });
  const [characterMatchMode, setCharacterMatchMode] = useState<"all" | "any">(() => {
    const m = searchParams.get("charMatch") || searchParams.get("charMode");
    return m === "any" ? "any" : "all";
  });

  const [selectedTopics, setSelectedTopics] = useState<string[]>(() => {
    return parseArrayParam(searchParams.get("topics") || searchParams.get("topic"));
  });
  const [topicMatchMode, setTopicMatchMode] = useState<"all" | "any">(() => {
    const m = searchParams.get("topicMatch") || searchParams.get("topicMode");
    return m === "all" ? "all" : "any";
  });

  const [searchFilter, setSearchFilter] = useState<string>(() => {
    return searchParams.get("search") || searchParams.get("q") || "";
  });
  const deferredSearch = useDeferredValue(searchFilter);

  const [sortBy, setSortBy] = useState<string>("chrono");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Map seasons order
  const seasonOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    seasons.forEach((s) => map.set(s.id, s.order));
    return map;
  }, [seasons]);

  // Season Options with Counts
  const seasonOptions = useMemo<MultiSelectOption[]>(() => {
    const countMap = new Map<string, number>();
    for (const c of allComments) {
      countMap.set(c.seasonId, (countMap.get(c.seasonId) || 0) + 1);
    }
    return seasons.map((s) => ({
      value: s.id,
      label: `${s.title} (${getSeasonBadgeLabel(s)})`,
      count: countMap.get(s.id) || 0,
    }));
  }, [seasons, allComments]);

  // Character Options with Counts
  const characterOptions = useMemo<MultiSelectOption[]>(() => {
    const countMap = new Map<string, number>();
    for (const c of allComments) {
      if (Array.isArray(c.characters)) {
        for (const char of c.characters) {
          countMap.set(char, (countMap.get(char) || 0) + 1);
        }
      }
    }
    const allSet = new Set([...countMap.keys(), ...initialCharacters]);
    return Array.from(allSet)
      .sort((a, b) => {
        const countA = countMap.get(a) || 0;
        const countB = countMap.get(b) || 0;
        if (countA !== countB) return countB - countA;
        return a.localeCompare(b);
      })
      .map((name) => ({
        value: name,
        label: name,
        count: countMap.get(name) || 0,
      }));
  }, [allComments, initialCharacters]);

  // Topic Options with Counts
  const topicOptions = useMemo<MultiSelectOption[]>(() => {
    const countMap = new Map<string, number>();
    for (const c of allComments) {
      if (Array.isArray(c.topics)) {
        for (const topic of c.topics) {
          countMap.set(topic, (countMap.get(topic) || 0) + 1);
        }
      }
    }
    const allSet = new Set([...countMap.keys(), ...initialTopics]);
    return Array.from(allSet)
      .sort((a, b) => {
        const countA = countMap.get(a) || 0;
        const countB = countMap.get(b) || 0;
        if (countA !== countB) return countB - countA;
        return a.localeCompare(b);
      })
      .map((topic) => ({
        value: topic,
        label: topic,
        count: countMap.get(topic) || 0,
      }));
  }, [allComments, initialTopics]);

  // Pre-index comments for fast filtering
  const indexedComments = useMemo(() => {
    return allComments.map((comment) => ({
      comment,
      idStr: String(comment.id),
      textLower: comment.text.toLowerCase(),
      seasonIdLower: comment.seasonId.toLowerCase(),
      charactersLower: (comment.characters || []).map((c) => c.toLowerCase()),
      topicsLower: (comment.topics || []).map((t) => t.toLowerCase()),
    }));
  }, [allComments]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const cleanIdQuery = q.replace(/^#/, "").trim();

    return indexedComments
      .filter(({ comment, idStr, textLower, seasonIdLower, charactersLower, topicsLower }) => {
        // Season filter
        if (selectedSeasons.length > 0) {
          if (!selectedSeasons.includes(comment.seasonId)) return false;
        }

        // Keyword Search
        if (q) {
          const matchesText = textLower.includes(q);
          const matchesId = idStr === cleanIdQuery;
          const matchesSeason = seasonIdLower.includes(q);
          const matchesEpisode = comment.episodeTitle.toLowerCase().includes(q);
          if (!matchesText && !matchesId && !matchesSeason && !matchesEpisode) return false;
        }

        // Characters filter
        if (selectedCharacters.length > 0) {
          const selectedLower = selectedCharacters.map((c) => c.toLowerCase());
          if (characterMatchMode === "all") {
            const hasAll = selectedLower.every((sel) => charactersLower.includes(sel));
            if (!hasAll) return false;
          } else {
            const hasAny = selectedLower.some((sel) => charactersLower.includes(sel));
            if (!hasAny) return false;
          }
        }

        // Topics filter
        if (selectedTopics.length > 0) {
          const selectedLower = selectedTopics.map((t) => t.toLowerCase());
          if (topicMatchMode === "all") {
            const hasAll = selectedLower.every((sel) => topicsLower.includes(sel));
            if (!hasAll) return false;
          } else {
            const hasAny = selectedLower.some((sel) => topicsLower.includes(sel));
            if (!hasAny) return false;
          }
        }

        return true;
      })
      .map(({ comment }) => comment);
  }, [
    indexedComments,
    deferredSearch,
    selectedSeasons,
    selectedCharacters,
    characterMatchMode,
    selectedTopics,
    topicMatchMode,
  ]);

  // Sorted comments
  const sortedComments = useMemo(() => {
    const list = [...filteredComments];

    if (sortBy === "chrono") {
      list.sort((a, b) => {
        const orderA = seasonOrderMap.get(a.seasonId) ?? 99;
        const orderB = seasonOrderMap.get(b.seasonId) ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        if (a.episodeNumber !== b.episodeNumber) return a.episodeNumber - b.episodeNumber;
        return a.id - b.id;
      });
    } else if (sortBy === "reverse-chrono") {
      list.sort((a, b) => {
        const orderA = seasonOrderMap.get(a.seasonId) ?? 99;
        const orderB = seasonOrderMap.get(b.seasonId) ?? 99;
        if (orderA !== orderB) return orderB - orderA;
        if (a.episodeNumber !== b.episodeNumber) return b.episodeNumber - a.episodeNumber;
        return b.id - a.id;
      });
    } else if (sortBy === "comment-asc") {
      list.sort((a, b) => a.id - b.id);
    } else if (sortBy === "comment-desc") {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [filteredComments, sortBy, seasonOrderMap]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedComments.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentComments = sortedComments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Tag click toggles
  const handleTagClick = useCallback((type: "character" | "topic", value: string) => {
    if (type === "character") {
      setSelectedCharacters((prev) =>
        prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
      );
      setCurrentPage(1);
    } else {
      setSelectedTopics((prev) =>
        prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
      );
      setCurrentPage(1);
    }
  }, []);

  // Active filters check
  const hasActiveFilters =
    selectedSeasons.length > 0 ||
    selectedCharacters.length > 0 ||
    selectedTopics.length > 0 ||
    searchFilter.trim() !== "";

  const clearAllFilters = useCallback(() => {
    setSelectedSeasons([]);
    setSelectedCharacters([]);
    setCharacterMatchMode("all");
    setSelectedTopics([]);
    setTopicMatchMode("any");
    setSearchFilter("");
    setCurrentPage(1);
    router.push("/anime/browse");
  }, [router]);

  // Sync state to URL search parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (selectedSeasons.length > 0) params.set("seasons", selectedSeasons.join(","));
    if (selectedCharacters.length > 0) {
      params.set("characters", selectedCharacters.join(","));
      if (characterMatchMode === "any") params.set("charMatch", "any");
    }
    if (selectedTopics.length > 0) {
      params.set("topics", selectedTopics.join(","));
      if (topicMatchMode === "all") params.set("topicMatch", "all");
    }
    if (searchFilter.trim()) params.set("search", searchFilter.trim());
    if (sortBy !== "chrono") params.set("sort", sortBy);

    const newQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");
    if (newQuery !== currentQuery) {
      const newUrl = newQuery ? `/anime/browse?${newQuery}` : "/anime/browse";
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    selectedSeasons,
    selectedCharacters,
    characterMatchMode,
    selectedTopics,
    topicMatchMode,
    searchFilter,
    sortBy,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Catalog Link */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] mb-2">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/anime" className="hover:text-[var(--accent)] transition-colors">
              Anime
            </Link>
            <span>/</span>
            <span className="text-[var(--text-main)] font-semibold">Browse Live-Tweets</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Anime Commentary Archive
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Search and filter through {allComments.length} author live-tweets and broadcast commentary entries across all seasons and OVAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/anime"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
          >
            <span>←</span>
            <span>View Season Catalog</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Commentary Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-semibold flex items-center justify-center gap-2 text-[var(--text-main)] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{isFilterDrawerOpen ? "Hide Filters" : "Filter & Refine"}</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
          </button>
        </div>

        {/* Filter Sidebar */}
        <aside
          className={`lg:block space-y-6 ${
            isFilterDrawerOpen ? "block" : "hidden"
          } p-5 lg:p-0 rounded-xl border lg:border-none border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:bg-transparent`}
        >
          {/* Quick Search */}
          <div className="space-y-1.5">
            <label
              htmlFor="anime-filter-search"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between"
            >
              <span>Filter By Keyword</span>
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchFilter("");
                    setCurrentPage(1);
                  }}
                  className="text-[11px] text-[var(--accent)] hover:underline font-normal cursor-pointer"
                >
                  Clear
                </button>
              )}
            </label>
            <input
              id="anime-filter-search"
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter comments by keyword..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Season / OVA Filter */}
          <div className="space-y-1.5">
            <label
              htmlFor="season-select"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]"
            >
              Seasons &amp; OVAs
            </label>
            <CustomMultiSelect
              id="season-select"
              values={selectedSeasons}
              onChange={(vals) => {
                setSelectedSeasons(vals);
                setCurrentPage(1);
              }}
              options={seasonOptions}
              placeholder="All Seasons & OVAs"
              showSearch={false}
            />
          </div>

          {/* Character Multi-Selector with Match Mode */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="char-select"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Characters ({characterOptions.length})
              </label>
            </div>
            <CustomMultiSelect
              id="char-select"
              values={selectedCharacters}
              onChange={(vals) => {
                setSelectedCharacters(vals);
                setCurrentPage(1);
              }}
              options={characterOptions}
              placeholder="All Characters"
              showSearch={true}
              matchMode={characterMatchMode}
              onMatchModeChange={(mode) => {
                setCharacterMatchMode(mode);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Topic Multi-Selector with Match Mode */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="topic-select"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Topics ({topicOptions.length})
              </label>
            </div>
            <CustomMultiSelect
              id="topic-select"
              values={selectedTopics}
              onChange={(vals) => {
                setSelectedTopics(vals);
                setCurrentPage(1);
              }}
              options={topicOptions}
              placeholder="All Topics"
              showSearch={true}
              matchMode={topicMatchMode}
              onMatchModeChange={(mode) => {
                setTopicMatchMode(mode);
                setCurrentPage(1);
              }}
            />
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
        </aside>

        {/* Content Column: Controls, Pills, List, and Pagination */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm">
            <div className="text-[var(--text-muted)] font-medium">
              Showing{" "}
              <strong className="text-[var(--text-main)]">
                {sortedComments.length === 0
                  ? 0
                  : `${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, sortedComments.length)}`}
              </strong>{" "}
              of <strong className="text-[var(--text-main)]">{sortedComments.length}</strong> live-tweets
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-[var(--text-muted)] font-medium shrink-0">
                Sort:
              </label>
              <div className="w-56">
                <CustomSelect
                  id="sort-select"
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                  options={SORT_OPTIONS}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono font-medium text-[var(--text-muted)] mr-1">Active:</span>

              {searchFilter.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
                  Keyword: &quot;{searchFilter}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter("");
                      setCurrentPage(1);
                    }}
                    aria-label="Remove search filter"
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                  >
                    ×
                  </button>
                </span>
              )}

              {/* Season Pills */}
              {selectedSeasons.map((seasonId) => {
                const s = seasons.find((item) => item.id === seasonId);
                const label = s ? s.title : seasonId;
                return (
                  <span
                    key={`pill-season-${seasonId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent)] font-mono"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSeasons(selectedSeasons.filter((item) => item !== seasonId));
                        setCurrentPage(1);
                      }}
                      aria-label={`Remove season filter for ${label}`}
                      className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                    >
                      ×
                    </button>
                  </span>
                );
              })}

              {/* Character Pills */}
              {selectedCharacters.map((char) => (
                <span
                  key={`pill-char-${char}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]"
                >
                  Character: {char}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCharacters(selectedCharacters.filter((c) => c !== char));
                      setCurrentPage(1);
                    }}
                    aria-label={`Remove character filter for ${char}`}
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedCharacters.length > 1 && (
                <span
                  title={
                    characterMatchMode === "all"
                      ? "Matching all selected characters (AND)"
                      : "Matching any selected character (OR)"
                  }
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                >
                  Char: {characterMatchMode.toUpperCase()}
                </span>
              )}

              {/* Topic Pills */}
              {selectedTopics.map((topic) => (
                <span
                  key={`pill-topic-${topic}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]"
                >
                  Topic: {topic}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
                      setCurrentPage(1);
                    }}
                    aria-label={`Remove topic filter for ${topic}`}
                    className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedTopics.length > 1 && (
                <span
                  title={
                    topicMatchMode === "all"
                      ? "Matching all selected topics (AND)"
                      : "Matching any selected topic (OR)"
                  }
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                >
                  Topic: {topicMatchMode.toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Top Pagination Nav */}
          <PaginationNav
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            position="top"
          />

          {/* Cards Stream */}
          {currentComments.length > 0 ? (
            <div className="space-y-4">
              {currentComments.map((comment) => (
                <article
                  id={`comment-${comment.seasonId}-${comment.episodeNumber}-${comment.id}`}
                  key={`${comment.seasonId}-${comment.episodeNumber}-${comment.id}`}
                  className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] transition-colors space-y-3 shadow-xs"
                >
                  {/* Episode & Season Badge Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)] text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/anime/${comment.seasonId}/${comment.episodeNumber}#comment-${comment.id}`}
                        className="font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] hover:text-[var(--accent)] transition-colors"
                      >
                        {comment.seasonTitle} • Ep {comment.episodeNumber}
                      </Link>
                      <span className="text-[var(--text-muted)] truncate max-w-xs hidden sm:inline">
                        {comment.episodeTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[var(--text-muted)]">
                      {comment.airDate && <span>Aired: {comment.airDate}</span>}
                      <Link
                        href={`/anime/${comment.seasonId}/${comment.episodeNumber}#comment-${comment.id}`}
                        title="View comment in episode view"
                        className="font-bold text-[var(--accent)] hover:underline ml-1"
                      >
                        #{comment.id} ↗
                      </Link>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-sm sm:text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                    {comment.text}
                  </p>

                  {/* Tags */}
                  {((comment.characters && comment.characters.length > 0) ||
                    (comment.topics && comment.topics.length > 0)) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {comment.characters?.map((char) => (
                        <button
                          key={char}
                          type="button"
                          onClick={() => handleTagClick("character", char)}
                          className="text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                      {comment.topics?.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleTagClick("topic", topic)}
                          className="text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bottom Bar: Source Citation */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="text-[var(--text-muted)] min-w-0 flex-1">
                      {comment.source ? (
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className="font-mono font-semibold text-[var(--text-muted)] shrink-0">
                            Source:
                          </span>
                          <a
                            href={comment.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:underline break-all font-medium inline-flex items-baseline gap-1 min-w-0"
                          >
                            <span className="break-all">{comment.source}</span>
                            <span className="inline-block text-[11px] align-baseline shrink-0">↗</span>
                          </a>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          Author Live-Tweet
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/anime/${comment.seasonId}/${comment.episodeNumber}#comment-${comment.id}`}
                      className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline shrink-0"
                    >
                      View in Episode →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
              <p className="text-base font-semibold text-[var(--text-main)]">
                No author live-tweets match your active filters.
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Try selecting different seasons, removing tags, or modifying your search query.
              </p>
              <div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-xs sm:text-sm font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}

          {/* Bottom Pagination Nav */}
          <PaginationNav
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            position="bottom"
          />
        </div>
      </div>
    </div>
  );
}
