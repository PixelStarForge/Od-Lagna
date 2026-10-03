"use client";

import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthorComment } from "../lib/schema";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { CustomMultiSelect, MultiSelectOption } from "./CustomMultiSelect";
import { AnimeSearchBar } from "./AnimeSearchBar";
import { AnimeSearchModal } from "./AnimeSearchModal";

interface EpisodeCommentaryClientProps {
  seasonId: string;
  seasonTitle: string;
  episodeNumber: number;
  comments: AuthorComment[];
}

function parseArrayParam(param: string | null): string[] {
  if (!param || param === "all") return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

const SORT_OPTIONS: SelectOption[] = [
  { value: "asc", label: "Comment Order (#1 → #N)" },
  { value: "desc", label: "Reverse Order (#N → #1)" },
];

export function EpisodeCommentaryClient({
  seasonId,
  seasonTitle,
  episodeNumber,
  comments,
}: EpisodeCommentaryClientProps) {
  const searchParams = useSearchParams();

  // State initialized from URL params if present
  const [searchFilter, setSearchFilter] = useState<string>(() => {
    return searchParams.get("search") || searchParams.get("q") || "";
  });
  const deferredSearch = useDeferredValue(searchFilter);

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

  const [sortBy, setSortBy] = useState<"asc" | "desc">(() => {
    const s = searchParams.get("sort");
    return s === "desc" ? "desc" : "asc";
  });

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Calculate available character options and counts from this episode
  const characterOptions = useMemo<MultiSelectOption[]>(() => {
    const countMap = new Map<string, number>();
    for (const comment of comments) {
      if (Array.isArray(comment.characters)) {
        for (const char of comment.characters) {
          countMap.set(char, (countMap.get(char) || 0) + 1);
        }
      }
    }
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name,
        count,
      }));
  }, [comments]);

  // Calculate available topic options and counts from this episode
  const topicOptions = useMemo<MultiSelectOption[]>(() => {
    const countMap = new Map<string, number>();
    for (const comment of comments) {
      if (Array.isArray(comment.topics)) {
        for (const topic of comment.topics) {
          countMap.set(topic, (countMap.get(topic) || 0) + 1);
        }
      }
    }
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name,
        count,
      }));
  }, [comments]);

  // Pre-index comments for fast deferred search
  const indexedComments = useMemo(() => {
    return comments.map((comment) => ({
      comment,
      idStr: String(comment.id),
      textLower: comment.text.toLowerCase(),
      charactersLower: (comment.characters || []).map((c) => c.toLowerCase()),
      topicsLower: (comment.topics || []).map((t) => t.toLowerCase()),
    }));
  }, [comments]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const cleanIdQuery = q.replace(/^#/, "").trim();

    return indexedComments
      .filter(({ comment, idStr, textLower, charactersLower, topicsLower }) => {
        // Keyword Search
        if (q) {
          const matchesText = textLower.includes(q);
          const matchesId = idStr === cleanIdQuery || idStr.startsWith(cleanIdQuery);
          if (!matchesText && !matchesId) return false;
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
    selectedCharacters,
    characterMatchMode,
    selectedTopics,
    topicMatchMode,
  ]);

  // Sorted comments
  const sortedComments = useMemo(() => {
    const list = [...filteredComments];
    if (sortBy === "desc") {
      list.sort((a, b) => b.id - a.id);
    } else {
      list.sort((a, b) => a.id - b.id);
    }
    return list;
  }, [filteredComments, sortBy]);

  // Active filters check
  const hasActiveFilters =
    searchFilter.trim() !== "" ||
    selectedCharacters.length > 0 ||
    selectedTopics.length > 0 ||
    sortBy !== "asc";

  const clearAllFilters = useCallback(() => {
    setSearchFilter("");
    setSelectedCharacters([]);
    setCharacterMatchMode("all");
    setSelectedTopics([]);
    setTopicMatchMode("any");
    setSortBy("asc");
  }, []);

  // Tag click toggles
  const handleTagClick = useCallback((type: "character" | "topic", value: string) => {
    if (type === "character") {
      setSelectedCharacters((prev) =>
        prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
      );
    } else {
      setSelectedTopics((prev) =>
        prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
      );
    }
  }, []);

  // Sync state to URL for deep-linking and bookmarking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (searchFilter.trim()) params.set("search", searchFilter.trim());
    if (selectedCharacters.length > 0) {
      params.set("characters", selectedCharacters.join(","));
      if (characterMatchMode === "any") params.set("charMatch", "any");
    }
    if (selectedTopics.length > 0) {
      params.set("topics", selectedTopics.join(","));
      if (topicMatchMode === "all") params.set("topicMatch", "all");
    }
    if (sortBy === "desc") params.set("sort", "desc");

    const newQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");
    if (newQuery !== currentQuery) {
      const newUrl = newQuery
        ? `/anime/${seasonId}/${episodeNumber}?${newQuery}${window.location.hash}`
        : `/anime/${seasonId}/${episodeNumber}${window.location.hash}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    seasonId,
    episodeNumber,
    searchFilter,
    selectedCharacters,
    characterMatchMode,
    selectedTopics,
    topicMatchMode,
    sortBy,
  ]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
          <span>Author Broadcast Live-Tweets</span>
          <span className="text-xs font-mono font-normal text-[var(--text-muted)]">
            ({comments.length} total)
          </span>
        </h2>

        {/* Global browse link */}
        <Link
          href={`/anime/browse?seasons=${seasonId}`}
          className="text-xs font-mono font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Search all anime comments</span>
          <span>↗</span>
        </Link>
      </div>

      {/* Search Bar Popup Trigger */}
      <AnimeSearchBar
        placeholder={`Search live-tweets in Episode ${episodeNumber} (keyword, character, topic)...`}
        onClick={() => setIsSearchModalOpen(true)}
        badgeText={`Ep ${episodeNumber}`}
      />

      <AnimeSearchModal
        isOpen={isSearchModalOpen}
        onOpen={() => setIsSearchModalOpen(true)}
        onClose={() => setIsSearchModalOpen(false)}
        currentEpisodeComments={comments}
        currentSeasonId={seasonId}
        currentSeasonTitle={seasonTitle}
        currentEpisodeNumber={episodeNumber}
      />

      {/* Filter Controls Bar */}
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Keyword Search */}
          <div className="space-y-1.5">
            <label
              htmlFor="comment-search"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between"
            >
              <span>Search Tweets</span>
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="text-[11px] text-[var(--accent)] hover:underline font-normal cursor-pointer"
                >
                  Clear
                </button>
              )}
            </label>
            <div className="relative">
              <input
                id="comment-search"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search text..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Character Filter */}
          <div className="space-y-1.5">
            <label
              htmlFor="char-filter"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block"
            >
              Characters ({characterOptions.length})
            </label>
            <CustomMultiSelect
              id="char-filter"
              values={selectedCharacters}
              onChange={setSelectedCharacters}
              options={characterOptions}
              placeholder={characterOptions.length > 0 ? "All Characters" : "No tagged characters"}
              showSearch={characterOptions.length > 5}
              matchMode={characterMatchMode}
              onMatchModeChange={setCharacterMatchMode}
            />
          </div>

          {/* Topic Filter */}
          <div className="space-y-1.5">
            <label
              htmlFor="topic-filter"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block"
            >
              Topics ({topicOptions.length})
            </label>
            <CustomMultiSelect
              id="topic-filter"
              values={selectedTopics}
              onChange={setSelectedTopics}
              options={topicOptions}
              placeholder={topicOptions.length > 0 ? "All Topics" : "No tagged topics"}
              showSearch={topicOptions.length > 5}
              matchMode={topicMatchMode}
              onMatchModeChange={setTopicMatchMode}
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label
              htmlFor="comment-sort"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block"
            >
              Sort
            </label>
            <CustomSelect
              id="comment-sort"
              value={sortBy}
              onChange={(val) => setSortBy(val as "asc" | "desc")}
              options={SORT_OPTIONS}
            />
          </div>
        </div>

        {/* Results Counter & Active Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)] text-xs">
          <div className="font-mono text-[var(--text-muted)]">
            Showing <strong className="text-[var(--text-main)]">{sortedComments.length}</strong> of{" "}
            <strong>{comments.length}</strong> comments
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="font-mono text-xs text-[var(--accent)] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Active Filter Pills List */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-mono text-[var(--text-muted)] mr-1">Active:</span>

            {searchFilter.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
                Keyword: &quot;{searchFilter}&quot;
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  aria-label="Remove search filter"
                  className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                >
                  ×
                </button>
              </span>
            )}

            {selectedCharacters.map((char) => (
              <span
                key={`pill-char-${char}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]"
              >
                Character: {char}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCharacters(selectedCharacters.filter((c) => c !== char))
                  }
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

            {sortBy === "desc" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
                Order: Reverse
                <button
                  type="button"
                  onClick={() => setSortBy("asc")}
                  aria-label="Reset sort order"
                  className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Commentary Cards List */}
      {sortedComments.length > 0 ? (
        <div className="space-y-3">
          {sortedComments.map((comment) => (
            <article
              id={`comment-${comment.id}`}
              key={comment.id}
              className="group p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] transition-colors space-y-3 shadow-xs scroll-mt-20"
            >
              {/* Comment Body */}
              <p className="text-sm sm:text-base text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                {comment.text}
              </p>

              {/* Tags (Characters & Topics) */}
              {((comment.characters && comment.characters.length > 0) ||
                (comment.topics && comment.topics.length > 0)) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {comment.characters?.map((char) => {
                    const isSelected = selectedCharacters.includes(char);
                    return (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleTagClick("character", char)}
                        title={isSelected ? `Remove filter for ${char}` : `Filter by ${char}`}
                        className={`text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[var(--accent)] text-white border-[var(--accent)] font-semibold"
                            : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        {char}
                      </button>
                    );
                  })}
                  {comment.topics?.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleTagClick("topic", topic)}
                        title={isSelected ? `Remove filter for ${topic}` : `Filter by ${topic}`}
                        className={`text-xs sm:text-sm font-medium font-sans px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[var(--accent)] text-white border-[var(--accent)] font-semibold"
                            : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bottom Bar: Source Citation with permalink anchor */}
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

                <a
                  href={`#comment-${comment.id}`}
                  title="Permalink to this comment"
                  className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-1.5 py-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors shrink-0 font-medium"
                >
                  #{comment.id}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
          <p className="text-base font-semibold text-[var(--text-main)]">
            No broadcast comments match your active filters.
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Try clearing some tags or modifying your keyword search.
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
    </div>
  );
}
