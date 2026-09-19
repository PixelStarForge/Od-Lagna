"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QnaEntry, ArcConfig, IfRouteConfig } from "../lib/schema";
import { QnaCard } from "./QnaCard";
import { SpoilerControls } from "./SpoilerControls";
import { usePreferences } from "../lib/preferences";
import { CustomSelect, SelectOption } from "./CustomSelect";

interface BrowseClientProps {
  allQnas: QnaEntry[];
  arcs: ArcConfig[];
  ifRoutes: IfRouteConfig[];
  characters: string[];
  topics: string[];
}

const ITEMS_PER_PAGE = 30;

export function BrowseClient({
  allQnas,
  arcs,
  ifRoutes,
  characters: initialCharacters,
  topics: initialTopics,
}: BrowseClientProps) {
  const searchParams = useSearchParams();
  const { spoilerArc, spoilerIf } = usePreferences();

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
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => {
    return searchParams.get("verified") === "true";
  });
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"canon" | "recent" | "oldest">("canon");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Derive all unique characters and topics from entries as well as config registries
  const allCharacters = useMemo(() => {
    const set = new Set(initialCharacters);
    for (const q of allQnas) {
      for (const c of q.characters) set.add(c);
    }
    return Array.from(set).sort();
  }, [initialCharacters, allQnas]);

  const allTopics = useMemo(() => {
    const set = new Set(initialTopics);
    for (const q of allQnas) {
      for (const t of q.topics) set.add(t);
    }
    return Array.from(set).sort();
  }, [initialTopics, allQnas]);

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
        group: "IF / What-If Timelines",
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

  // Sort options for CustomSelect
  const sortOptions: SelectOption[] = [
    { value: "canon", label: "Canon Arc Order" },
    { value: "recent", label: "Recently Added (ID ↓)" },
    { value: "oldest", label: "Oldest (ID ↑)" },
  ];

  // Handle deep-link scrolling to hash on page load (#qna-0001)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const targetId = window.location.hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, []);

  // Tag click helper
  const handleTagClick = (type: "character" | "topic", tag: string) => {
    if (type === "character") {
      setSelectedCharacter(tag);
    } else {
      setSelectedTopic(tag);
    }
    setCurrentPage(1);
  };

  // Filter and sort items
  const filteredEntries = useMemo(() => {
    return allQnas.filter((entry) => {
      // Arc filter
      if (selectedArc !== "all") {
        if (entry.arc !== selectedArc) return false;
      }

      // Character filter
      if (selectedCharacter !== "all") {
        if (!entry.characters.includes(selectedCharacter)) return false;
      }

      // Topic filter
      if (selectedTopic !== "all") {
        if (!entry.topics.includes(selectedTopic)) return false;
      }

      // Verified filter
      if (verifiedOnly && !entry.verified) {
        return false;
      }

      // Text search filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesQ = entry.question.toLowerCase().includes(query);
        const matchesA = entry.answer.toLowerCase().includes(query);
        const matchesC = entry.characters.some((c) => c.toLowerCase().includes(query));
        const matchesT = entry.topics.some((t) => t.toLowerCase().includes(query));
        if (!matchesQ && !matchesA && !matchesC && !matchesT) return false;
      }

      return true;
    });
  }, [allQnas, selectedArc, selectedCharacter, selectedTopic, verifiedOnly, searchFilter]);

  // Sorting
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];

    const arcOrderMap = new Map<string, number>();
    arcs.forEach((a) => arcOrderMap.set(a.slug, a.order));
    // IF routes after canon arcs (order 100+)
    ifRoutes.forEach((r, idx) => arcOrderMap.set(r.slug, 100 + idx));
    // General at the end
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
    }

    return list;
  }, [filteredEntries, sortBy, arcs, ifRoutes]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = sortedEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Active filters count
  const hasActiveFilters =
    selectedArc !== "all" ||
    selectedCharacter !== "all" ||
    selectedTopic !== "all" ||
    verifiedOnly ||
    searchFilter.trim() !== "";

  const clearAllFilters = () => {
    setSelectedArc("all");
    setSelectedCharacter("all");
    setSelectedTopic("all");
    setVerifiedOnly(false);
    setSearchFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Spoiler Quick-Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Browse Q&amp;A Archive
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Explore {allQnas.length} indexed author statements across canon arcs and IF timelines.
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
              IF Routes: <strong>{spoilerIf ? "Included" : "Hidden"}</strong>
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
          {/* Quick Search */}
          <div className="space-y-1.5">
            <label htmlFor="filter-search" className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)]">
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
              placeholder="Filter current view..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Arc / Storyline Selector */}
          <div className="space-y-1.5">
            <label htmlFor="arc-select" className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)]">
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
            <label htmlFor="char-select" className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)]">
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
            <label htmlFor="topic-select" className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)]">
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
              <span className="text-xs font-medium text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
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
                className="w-full py-1.5 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Embedded Spoiler Controls in Sidebar */}
          <div className="pt-6 border-t border-[var(--border-subtle)] space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-faint)]">
              Spoiler Cutoff
            </h3>
            <SpoilerControls compact={true} showPresets={false} />
          </div>
        </aside>

        {/* Content Column: Active Filters, Sort Bar, and Card List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar: Sort, Count & Active Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
            <div className="text-[var(--text-muted)]">
              Showing{" "}
              <strong className="text-[var(--text-main)]">
                {sortedEntries.length === 0
                  ? 0
                  : `${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, sortedEntries.length)}`}
              </strong>{" "}
              of <strong className="text-[var(--text-main)]">{sortedEntries.length}</strong> matching Q&amp;As
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-[var(--text-faint)] shrink-0">
                Sort:
              </label>
              <div className="w-48">
                <CustomSelect
                  id="sort-select"
                  value={sortBy}
                  onChange={(val) => setSortBy(val as "canon" | "recent" | "oldest")}
                  options={sortOptions}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-[var(--text-faint)] mr-1">Active:</span>

              {selectedArc !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
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

              {verifiedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[var(--verified-bg)] border border-[var(--verified-border)] text-[var(--verified-text)]">
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
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
                className="text-[11px] text-[var(--accent)] hover:underline ml-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Cards List */}
          {currentEntries.length > 0 ? (
            <div className="space-y-4">
              {currentEntries.map((entry) => (
                <QnaCard
                  key={entry.id}
                  entry={entry}
                  onTagClick={handleTagClick}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-faint)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                No Q&amp;As match current criteria
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {allQnas.length === 0
                  ? "The archive is currently empty. Entries added to content/qna/ will populate here."
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
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-8 h-8 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      currentPage === pageNum
                        ? "bg-[var(--accent)] text-white font-bold"
                        : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
