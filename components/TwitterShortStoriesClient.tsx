"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TwitterShortStory } from "../lib/schema";
import { TwitterShortStoryCard } from "./TwitterShortStoryCard";
import { CustomMultiSelect, MultiSelectOption } from "./CustomMultiSelect";
import { CustomSelect, SelectOption } from "./CustomSelect";

interface TwitterShortStoriesClientProps {
  stories: TwitterShortStory[];
}

const ITEMS_PER_PAGE = 15;

const SORT_OPTIONS: SelectOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "id-asc", label: "ID (Ascending)" },
  { value: "id-desc", label: "ID (Descending)" },
];

function computeStoryRecommendations(
  current: TwitterShortStory,
  all: TwitterShortStory[],
  limit = 3
) {
  const others = all.filter((s) => s.id !== current.id);
  if (others.length === 0) return [];

  const scored = others.map((item) => {
    let score = 0;
    const reasons: string[] = [];

    const sharedChars = item.characters.filter((c) =>
      current.characters.includes(c)
    );
    if (sharedChars.length > 0) {
      score += sharedChars.length * 3;
      reasons.push(sharedChars.join(", "));
    }

    return {
      story: item,
      score,
      reasonText: reasons.join(" • "),
    };
  });

  scored.sort((a, b) => b.score - a.score || a.story.id.localeCompare(b.story.id));
  return scored.filter((s) => s.score > 0).slice(0, limit);
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

      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
        <span>Total {totalPages} Pages</span>
      </div>
    </nav>
  );
}

export function TwitterShortStoriesClient({ stories }: TwitterShortStoriesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(() => {
    const charParam = searchParams.get("character") || searchParams.get("characters");
    return charParam ? charParam.split(",").map((c) => c.trim()).filter(Boolean) : [];
  });
  const [characterMatchMode, setCharacterMatchMode] = useState<"all" | "any">(() =>
    searchParams.get("charMode") === "all" ? "all" : "any"
  );
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState(1);
  const targetId = searchParams.get("id");

  const topRef = useRef<HTMLDivElement>(null);

  // Collect all unique characters and their counts across Twitter short stories
  const characterOptions: MultiSelectOption[] = useMemo(() => {
    const charCounts = new Map<string, number>();
    for (const story of stories) {
      for (const char of story.characters) {
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      }
    }

    return Array.from(charCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name,
        count,
      }));
  }, [stories]);

  // Filter and sort stories
  const filteredStories = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    return stories
      .filter((story) => {
        // Search filter
        if (cleanSearch) {
          const matchTitle = story.title ? story.title.toLowerCase().includes(cleanSearch) : false;
          const matchStory = story.story.toLowerCase().includes(cleanSearch);
          const matchAuthor = (story.author || "").toLowerCase().includes(cleanSearch);
          const matchChar = story.characters.some((c) => c.toLowerCase().includes(cleanSearch));
          const matchId = story.id.toLowerCase().includes(cleanSearch);
          if (!matchTitle && !matchStory && !matchAuthor && !matchChar && !matchId) {
            return false;
          }
        }

        // Character filter (supports "all" (AND) and "any" (OR))
        if (selectedCharacters.length > 0) {
          const matchSingleChar = (sc: string) => {
            const scl = sc.toLowerCase();
            return story.characters.some((ec) => {
              const ecl = ec.toLowerCase();
              return (
                ecl === scl ||
                ecl.includes(`(${scl})`) ||
                ecl.startsWith(`${scl} (`) ||
                scl.includes(`(${ecl})`) ||
                scl.startsWith(`${ecl} (`)
              );
            });
          };

          if (characterMatchMode === "all") {
            if (!selectedCharacters.every(matchSingleChar)) return false;
          } else {
            if (!selectedCharacters.some(matchSingleChar)) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return (a.date || "").localeCompare(b.date || "");
        }
        if (sortBy === "id-asc" || sortBy === "title-asc") {
          return a.id.localeCompare(b.id, undefined, { numeric: true });
        }
        if (sortBy === "id-desc" || sortBy === "title-desc") {
          return b.id.localeCompare(a.id, undefined, { numeric: true });
        }
        // Default: newest
        return (b.date || "").localeCompare(a.date || "");
      });
  }, [stories, searchQuery, selectedCharacters, characterMatchMode, sortBy]);

  // Active story lookup if targetId is provided in URL (?id=...)
  const activeStory = useMemo(() => {
    if (!targetId) return null;
    const clean = targetId.trim().toLowerCase();
    return (
      stories.find((s) => s.id.toLowerCase() === clean) ||
      stories.find(
        (s) =>
          s.id.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          clean.replace(/[^a-z0-9]/g, "")
      ) ||
      null
    );
  }, [targetId, stories]);

  useEffect(() => {
    if (activeStory) {
      document.title = `${activeStory.title || `Twitter Short Story #${activeStory.id}`} — Od-Lagna`;
    } else if (targetId) {
      document.title = "Short Story Not Found — Od-Lagna";
    } else {
      document.title = "Twitter Short Stories — Od-Lagna";
    }
  }, [activeStory, targetId]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCharactersChange = (chars: string[]) => {
    setSelectedCharacters(chars);
    setCurrentPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTagClick = (character: string) => {
    if (!selectedCharacters.includes(character)) {
      setSelectedCharacters([character]);
      setCurrentPage(1);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCharacters([]);
    setCharacterMatchMode("any");
    setSortBy("newest");
    setCurrentPage(1);
    router.push("/twitter-short-stories");
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredStories.length / ITEMS_PER_PAGE);
  const paginatedStories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStories, currentPage]);

  if (targetId) {
    if (!activeStory) {
      return (
        <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] py-12 sm:py-20">
          <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
                Short Story #{targetId} not found
              </h1>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                The archive has not indexed a Twitter short story matching this ID. You may browse all short stories in the catalog.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/twitter-short-stories"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
              >
                ← Back to All Short Stories
              </Link>
            </div>
          </div>
        </main>
      );
    }

    const recommendations = computeStoryRecommendations(activeStory, stories, 3);

    return (
      <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Navigation Bar & Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2">
              <Link href="/" className="hover:text-[var(--accent)] transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/twitter-short-stories" className="hover:text-[var(--accent)] transition-colors">
                Twitter Short Stories
              </Link>
              <span>/</span>
              <span className="text-[var(--text-main)] font-semibold">
                #{activeStory.id}
              </span>
            </nav>

            <Link
              href="/twitter-short-stories"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors text-xs sm:text-sm font-medium"
            >
              <span>←</span>
              <span>Back to All Short Stories</span>
            </Link>
          </div>

          {/* Primary Story Showcase Card */}
          <section aria-labelledby="story-heading">
            <h1 id="story-heading" className="sr-only">
              {activeStory.title || `Twitter Short Story #${activeStory.id}`}
            </h1>
            <TwitterShortStoryCard story={activeStory} isDetailPage={true} />
          </section>

          {/* Related / Connected Short Stories Section */}
          {recommendations.length > 0 && (
            <section
              className="pt-8 border-t border-[var(--border-subtle)] space-y-6"
              aria-labelledby="related-heading"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <h2
                    id="related-heading"
                    className="text-xl font-sans font-bold text-[var(--text-main)] tracking-tight"
                  >
                    Related Short Stories
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                    Other canonical author short stories featuring connected characters.
                  </p>
                </div>
                <Link
                  href="/twitter-short-stories"
                  className="text-xs sm:text-sm text-[var(--accent)] hover:underline font-medium self-start sm:self-auto"
                >
                  Browse all {stories.length} short stories →
                </Link>
              </div>

              <div className="space-y-4">
                {recommendations.map(({ story: recStory, reasonText }) => (
                  <div key={recStory.id} className="space-y-1.5">
                    {reasonText && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] px-1">
                        <span className="text-[var(--accent)]">↳</span>
                        <span>Connected by: {reasonText}</span>
                      </div>
                    )}
                    <TwitterShortStoryCard
                      story={recStory}
                      isDetailPage={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    );
  }

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCharacters.length > 0 ||
    characterMatchMode !== "any" ||
    sortBy !== "newest"
  );

  return (
    <div ref={topRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">Twitter Short Stories</span>
      </nav>

      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)]">
          <span>{stories.length} Twitter Short Stor{stories.length !== 1 ? "ies" : "y"}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
          Twitter Short Stories
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-3xl leading-relaxed">
          Short stories posted to Twitter/X by author <Link href="https://twitter.com/nezumiironyanko"><strong className="text-[var(--text-main)] font-semibold">Tappei Nagatsuki</strong></Link> (@nezumiironyanko).
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Keyword Search */}
          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="tss-search" className="block text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Search Stories
            </label>
            <div className="relative">
              <input
                id="tss-search"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by story text, title, or character..."
                className="w-full px-3.5 py-2 pl-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <svg
                className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Character Multi-Select Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Filter by Character
            </label>
            <CustomMultiSelect
              id="tss-char-filter"
              values={selectedCharacters}
              onChange={handleCharactersChange}
              options={characterOptions}
              placeholder="All Characters"
              ariaLabel="Filter stories by character"
              showSearch={true}
              matchMode={characterMatchMode}
              onMatchModeChange={(mode) => {
                setCharacterMatchMode(mode);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Sort By
            </label>
            <CustomSelect
              id="tss-sort"
              value={sortBy}
              onChange={handleSortChange}
              options={SORT_OPTIONS}
              placeholder="Sort stories"
              ariaLabel="Sort stories"
            />
          </div>
        </div>

        {/* Active Filters & Counter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span>
              Showing <strong>{filteredStories.length}</strong> of {stories.length} stories
            </span>

            {selectedCharacters.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
                <span>{selectedCharacters.join(", ")}</span>
                <button
                  type="button"
                  onClick={() => handleCharactersChange([])}
                  className="hover:text-[var(--accent)] ml-0.5"
                  title="Remove character filter"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedCharacters.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setCharacterMatchMode(characterMatchMode === "all" ? "any" : "all");
                  setCurrentPage(1);
                }}
                title={
                  characterMatchMode === "all"
                    ? "Matching all selected characters (AND). Click to switch to Any (OR)"
                    : "Matching any selected character (OR). Click to switch to All (AND)"
                }
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold cursor-pointer hover:bg-[var(--accent)]/20 transition-colors"
              >
                Chars: {characterMatchMode === "all" ? "AND" : "OR"}
              </button>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-[var(--accent)] ml-0.5"
                  title="Clear search query"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Top Pagination */}
      <PaginationNav
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        position="top"
      />

      {/* Story Cards List */}
      {paginatedStories.length > 0 ? (
        <div className="space-y-6">
          {paginatedStories.map((story) => (
            <TwitterShortStoryCard
              key={story.id}
              story={story}
              onTagClick={handleTagClick}
              isHighlighted={targetId === story.id}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] text-[var(--accent)] flex items-center justify-center mx-auto text-xl font-bold font-mono">
            ?
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
              No Twitter short stories match your criteria
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
              Try adjusting your search terms or clearing the active character filter.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-lg bg-[var(--accent-solid)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--accent-solid-hover)] transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Bottom Pagination */}
      <PaginationNav
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        position="bottom"
      />
    </div>
  );
}
