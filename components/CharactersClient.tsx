"use client";

import React, { useState, useMemo, useDeferredValue, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CharacterCatalogItem } from "../lib/content-loader";
import { matchesCharacterTag } from "../lib/character-utils";
import { QnaEntry, TriviaEntry, ArcConfig, IfRouteConfig } from "../lib/schema";
import { CharacterDetailClient } from "./CharacterDetailClient";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { usePreferences } from "../lib/preferences";
import { getArcMetadata, isArcSpoiler } from "../lib/arc-utils";

// Build the set of letters actually present in a catalog slice
function getAvailableLetters(items: CharacterCatalogItem[]): Set<string> {
  const letters = new Set<string>();
  for (const item of items) {
    const first = item.name.trim()[0]?.toUpperCase();
    if (first && /[A-Z]/.test(first)) letters.add(first);
  }
  return letters;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Autocomplete suggestion type — labelLower is pre-computed to avoid per-keystroke lowercasing
interface Suggestion {
  label: string;
  labelLower: string;
  kind: "name" | "alias" | "affiliation";
}

// Highlight the matched portion of a suggestion label
function HighlightMatch({ label, query }: { label: string; query: string }) {
  if (!query) return <>{label}</>;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <strong className="text-[var(--accent)]">{label.slice(idx, idx + query.length)}</strong>
      {label.slice(idx + query.length)}
    </>
  );
}

interface CharactersClientProps {
  catalog: CharacterCatalogItem[];
  arcs: ArcConfig[];
  ifRoutes: IfRouteConfig[];
  allQnas: QnaEntry[];
  allTrivia: TriviaEntry[];
}

export function CharactersClient({
  catalog,
  arcs,
  ifRoutes,
  allQnas,
  allTrivia,
}: CharactersClientProps) {
  const searchParams = useSearchParams();
  const { spoilerArc, allowedIfRoutes, mounted } = usePreferences();

  // Check if a character detail view is requested via URL query params
  const characterParam =
    searchParams.get("id") ||
    searchParams.get("character") ||
    searchParams.get("name");

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedArc, setSelectedArc] = useState<string>("all");
  const [filterWithEntriesOnly, setFilterWithEntriesOnly] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>("all");

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const arcOptions = useMemo<SelectOption[]>(() => {
    return [
      { value: "all", label: "All Arcs & Storylines" },
      { value: "general", label: "General / Debut Unknown" },
      ...arcs.map((arc) => ({
        value: arc.slug,
        label: `Arc ${arc.order}: ${arc.name}`,
        group: "Canon Arcs",
      })),
      ...ifRoutes.map((route) => ({
        value: route.slug,
        label: route.name,
        group: "IF Routes & Side Stories",
      })),
    ];
  }, [arcs, ifRoutes]);

  // Non-spoiler catalog — hide characters above the spoiler threshold entirely
  const visibleCatalog = useMemo(() => {
    if (!mounted) return catalog; // SSR: show all, avoid flash
    return catalog.filter(
      (item) => !isArcSpoiler(item.arc, spoilerArc, allowedIfRoutes)
    );
  }, [catalog, mounted, spoilerArc, allowedIfRoutes]);

  // Available letters computed from visible catalog
  const availableLetters = useMemo(
    () => getAvailableLetters(visibleCatalog),
    [visibleCatalog]
  );

  // Per-letter character counts for QoL #4 badge/tooltip
  const letterCounts = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    for (const item of visibleCatalog) {
      const first = item.name[0]?.toUpperCase();
      if (first && /[A-Z]/.test(first)) {
        map.set(first, (map.get(first) ?? 0) + 1);
      }
    }
    return map;
  }, [visibleCatalog]);

  // Autocomplete suggestions built from visible catalog.
  // labelLower is pre-computed so filteredSuggestions never re-lowercases on every keystroke.
  // Bug fix: dropped `mounted` from alias check — visibleCatalog already excludes spoiler chars,
  // and isArcSpoiler is pure, so the guard was redundant and caused SSR inconsistency.
  const allSuggestions = useMemo<Suggestion[]>(() => {
    const seen = new Set<string>();
    const suggestions: Suggestion[] = [];
    for (const item of visibleCatalog) {
      const name = item.name.trim();
      const nameLower = name.toLowerCase();
      if (!seen.has(nameLower)) {
        seen.add(nameLower);
        suggestions.push({ label: name, labelLower: nameLower, kind: "name" });
      }
      for (const alias of item.aliases) {
        const a = alias.name.trim();
        const aLower = a.toLowerCase();
        const aliasArcSpoiled = isArcSpoiler(alias.arc, spoilerArc, allowedIfRoutes);
        if (!aliasArcSpoiled && !seen.has(aLower)) {
          seen.add(aLower);
          suggestions.push({ label: a, labelLower: aLower, kind: "alias" });
        }
      }
      for (const aff of item.affiliation) {
        const a = aff.trim();
        const aLower = a.toLowerCase();
        if (!seen.has(aLower)) {
          seen.add(aLower);
          suggestions.push({ label: a, labelLower: aLower, kind: "affiliation" });
        }
      }
    }
    return suggestions;
  }, [visibleCatalog, spoilerArc, allowedIfRoutes]);

  // Filtered suggestions based on current query — uses pre-lowercased labelLower (Opt #4)
  const filteredSuggestions = useMemo<Suggestion[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allSuggestions
      .filter((s) => s.labelLower.includes(q))
      .slice(0, 8);
  }, [searchQuery, allSuggestions]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedSuggestion(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedSuggestion((i) => {
          const next = Math.min(i + 1, filteredSuggestions.length - 1);
          // QoL #1: scroll highlighted item into view
          const list = suggestionsRef.current;
          if (list) {
            const child = list.children[next] as HTMLElement | undefined;
            child?.scrollIntoView({ block: "nearest" });
          }
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedSuggestion((i) => {
          const next = Math.max(i - 1, -1);
          const list = suggestionsRef.current;
          if (list && next >= 0) {
            const child = list.children[next] as HTMLElement | undefined;
            child?.scrollIntoView({ block: "nearest" });
          }
          return next;
        });
      } else if (e.key === "Enter" && highlightedSuggestion >= 0) {
        e.preventDefault();
        const chosen = filteredSuggestions[highlightedSuggestion];
        setSearchQuery(chosen.label);
        setShowSuggestions(false);
        setHighlightedSuggestion(-1);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setHighlightedSuggestion(-1);
      }
    },
    [showSuggestions, filteredSuggestions, highlightedSuggestion]
  );

  const applySuggestion = useCallback((suggestion: Suggestion) => {
    setSearchQuery(suggestion.label);
    setShowSuggestions(false);
    setHighlightedSuggestion(-1);
    searchInputRef.current?.focus();
  }, []);

  const handleLetterSelect = (letter: string) => {
    setSelectedLetter(letter);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedLetter("all"); // clear letter filter when typing
    setShowSuggestions(val.trim().length > 0);
    setHighlightedSuggestion(-1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setHighlightedSuggestion(-1);
    searchInputRef.current?.focus();
  };

  // If a specific character query param is present, render detail view
  const activeCharacter = useMemo(() => {
    if (!characterParam) return null;
    const cleanParam = characterParam.trim().toLowerCase();

    const exact = catalog.find(
      (c) =>
        c.id.toLowerCase() === cleanParam ||
        c.name.toLowerCase() === cleanParam ||
        c.aliases?.some((a) => a.name.toLowerCase() === cleanParam)
    );
    if (exact) return exact;

    return (
      catalog.find(
        (c) =>
          cleanParam.includes(c.id.toLowerCase()) ||
          cleanParam.includes(c.name.toLowerCase()) ||
          c.id.toLowerCase().includes(cleanParam) ||
          c.name.toLowerCase().includes(cleanParam) ||
          c.aliases?.some((a) => a.name.toLowerCase().includes(cleanParam))
      ) ?? null
    );
  }, [characterParam, catalog]);

  // Compute related Q&As and trivia for the active character
  const characterContent = useMemo(() => {
    if (!activeCharacter) return { qnas: [], trivia: [] };

    const relatedQnas = allQnas.filter((q) =>
      q.characters.some((c) => matchesCharacterTag(activeCharacter, c))
    );
    const relatedTrivia = allTrivia.filter((t) =>
      t.characters.some((c) => matchesCharacterTag(activeCharacter, c))
    );

    return {
      qnas: relatedQnas,
      trivia: relatedTrivia,
    };
  }, [activeCharacter, allQnas, allTrivia]);

  // Filter the catalog list for the index view
  const filteredCatalog = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const queryTokens = query ? query.split(/\s+/).filter(Boolean) : [];

    return visibleCatalog.filter((item) => {
      // Arc filter
      if (selectedArc !== "all" && item.arc !== selectedArc) {
        return false;
      }

      // Filter with entries only
      if (filterWithEntriesOnly && item.qnaCount === 0 && item.triviaCount === 0) {
        return false;
      }

      // Alphabet filter (only applied when no search query)
      // Opt #5: trim()[0] is cheap but called inside a potentially large loop;
      // since names never change per render, this is consistent.
      if (selectedLetter !== "all" && queryTokens.length === 0) {
        if (item.name[0]?.toUpperCase() !== selectedLetter) return false;
      }

      // Search matching across name, aliases, Japanese name, and affiliation
      if (queryTokens.length > 0) {
        const nameLower = item.name.toLowerCase();
        const jpLower = (item.japaneseName || "").toLowerCase();
        const aliasesLower = item.aliases.map((a) => a.name.toLowerCase());
        const affLower = item.affiliation.map((a) => a.toLowerCase());

        for (const token of queryTokens) {
          const matches =
            nameLower.includes(token) ||
            jpLower.includes(token) ||
            aliasesLower.some((a) => a.includes(token)) ||
            affLower.some((a) => a.includes(token));

          if (!matches) return false;
        }
      }

      return true;
    });
  }, [visibleCatalog, deferredSearch, selectedArc, filterWithEntriesOnly, selectedLetter]);

  // If a character was specified in URL
  if (characterParam) {
    if (!activeCharacter) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] mx-auto flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            Character Not Found
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            We could not find a character profile matching &quot;{characterParam}&quot;. Please verify the spelling or check the full catalog.
          </p>
          <div className="pt-2">
            <Link
              href="/characters"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-sm font-semibold transition-colors"
            >
              <span>← Back to All Characters</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <CharacterDetailClient
        character={activeCharacter}
        qnas={characterContent.qnas}
        trivia={characterContent.trivia}
      />
    );
  }

  // Otherwise, render full characters catalog page
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
      >
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)] font-semibold">Characters</span>
      </nav>

      {/* Hero Header & Spoiler Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
            {visibleCatalog.length} Named Characters
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
            Characters Database
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-3xl leading-relaxed">
            Browse all characters across Re:Zero, explore their canon debut arcs, and access tagged author Q&amp;As and trivia statements with spoiler control.
          </p>
        </div>

        {/* Current Spoiler State Badge */}
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Scope Notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)]">
        <svg
          className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="leading-relaxed">
          <span className="font-semibold text-[var(--text-main)]">Partial catalog.</span>{" "}
          This database only includes characters mentioned in indexed author Q&amp;As and trivia — not every named character in the Re:Zero universe.{" "}
          For the full character roster, visit the{" "}
          <a
            href="https://rezero.fandom.com/wiki/Category:Characters"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent)] hover:underline underline-offset-2"
          >
            Re:Zero Wiki ↗
          </a>
          .
        </p>
      </div>

      {/* Search and Filters Toolbar */}

      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input with Autocomplete */}
          <div className="relative flex-1" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="character-search"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length > 0 && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Search by character name, alias, or affiliation..."
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                ✕
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-lg overflow-y-auto max-h-64"
                role="listbox"
                aria-label="Search suggestions"
              >
                {filteredSuggestions.length === 0 ? (
                  /* QoL #5: explicit no-results row */
                  <div className="px-3.5 py-3 text-sm text-[var(--text-muted)] italic select-none">
                    No characters found for &ldquo;{searchQuery.trim()}&rdquo;
                  </div>
                ) : (
                  filteredSuggestions.map((suggestion, idx) => {
                    const isHighlighted = idx === highlightedSuggestion;
                    const kindColors: Record<Suggestion["kind"], string> = {
                      name: "text-[var(--accent-text)] bg-[var(--accent-bg)] border-[var(--accent-border)]",
                      alias: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800/40",
                      affiliation: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800/40",
                    };
                    const kindLabel: Record<Suggestion["kind"], string> = {
                      name: "Character",
                      alias: "Alias",
                      affiliation: "Group",
                    };
                    return (
                      <button
                        key={`${suggestion.kind}-${suggestion.label}`}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applySuggestion(suggestion);
                        }}
                        onMouseEnter={() => setHighlightedSuggestion(idx)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                          isHighlighted
                            ? "bg-[var(--bg-elevated)]"
                            : "hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        {/* QoL #3: highlight matched substring */}
                        <span className="text-[var(--text-main)] font-medium truncate">
                          <HighlightMatch label={suggestion.label} query={searchQuery.trim()} />
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${kindColors[suggestion.kind]}`}
                        >
                          {kindLabel[suggestion.kind]}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Arc Filter Dropdown with Autocomplete / Search */}
          <div className="w-full sm:w-64">
            <CustomSelect
              id="character-arc-filter"
              ariaLabel="Filter characters by debut arc"
              value={selectedArc}
              onChange={(val) => setSelectedArc(val)}
              options={arcOptions}
              placeholder="All Arcs & Storylines"
              showSearch={true}
            />
          </div>
        </div>

        {/* Quick Toggles and Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={filterWithEntriesOnly}
              onChange={(e) => setFilterWithEntriesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
            />
            <span className="text-xs font-medium text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
              Show characters with indexed Q&amp;As or Trivia only
            </span>
          </label>

          <div className="font-mono text-xs">
            Showing <strong>{filteredCatalog.length}</strong> of {visibleCatalog.length} characters
          </div>
        </div>
      </div>

      {/* Active filter chips — style matches Browse page active filter pills */}
      {(selectedLetter !== "all" || selectedArc !== "all" || filterWithEntriesOnly) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono font-medium text-[var(--text-muted)] mr-1">Active:</span>
          {selectedLetter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-mono">
              Letter: {selectedLetter}
              <button
                type="button"
                onClick={() => setSelectedLetter("all")}
                aria-label="Remove letter filter"
                className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer font-sans"
              >
                ×
              </button>
            </span>
          )}
          {selectedArc !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
              {arcOptions.find((o) => o.value === selectedArc)?.label ?? selectedArc}
              <button
                type="button"
                onClick={() => setSelectedArc("all")}
                aria-label="Remove arc filter"
                className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {filterWithEntriesOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
              Has entries
              <button
                type="button"
                onClick={() => setFilterWithEntriesOnly(false)}
                aria-label="Remove entries-only filter"
                className="hover:text-[var(--accent)] ml-1 font-bold cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Alphabet Filter Bar */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:p-4">
        <div className="flex flex-wrap gap-1 items-center">
          {/* All button — shows total visible character count */}
          <button
            type="button"
            onClick={() => handleLetterSelect("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
              selectedLetter === "all"
                ? "bg-[var(--accent-solid)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            All{" "}
            <span className={`text-[10px] ${
              selectedLetter === "all" ? "opacity-75" : "opacity-60"
            }`}>
              ({visibleCatalog.length})
            </span>
          </button>

          <span className="w-px h-4 bg-[var(--border-subtle)] mx-1 self-center" />

          {/* A–Z buttons */}
          {ALPHABET.map((letter) => {
            const available = availableLetters.has(letter);
            const isActive = selectedLetter === letter;
            const count = letterCounts.get(letter) ?? 0;
            return (
              <button
                key={letter}
                type="button"
                disabled={!available}
                title={available ? `${count} character${count !== 1 ? "s" : ""}` : undefined}
                onClick={() => available && handleLetterSelect(letter)}
                className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-mono font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--accent-solid)] text-white"
                    : available
                    ? "bg-[var(--bg-elevated)] text-[var(--text-main)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent-text)] cursor-pointer"
                    : "text-[var(--text-faint)] opacity-30 cursor-not-allowed"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Character Cards */}
      {filteredCatalog.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-3">
          <p className="text-base font-semibold text-[var(--text-main)]">
            No characters matched your criteria.
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Try searching for a different name, or clear your arc filter to view more characters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedArc("all");
              setFilterWithEntriesOnly(false);
              setSelectedLetter("all");
            }}
            className="px-4 py-2 rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCatalog.map((item) => {
            const arcMeta = getArcMetadata(item.arc);

            return (
              <Link
                key={item.id}
                href={`/characters?id=${item.id}`}
                className="group p-5 sm:p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] truncate max-w-[200px]">
                      {arcMeta.name}
                    </span>

                    {/* Profile Badge */}
                    {item.hasFullProfile && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                        Profile
                      </span>
                    )}
                  </div>

                  {/* Character Name & Japanese Name */}
                  <div className="space-y-0.5">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                      {item.name}
                    </h2>
                    {item.japaneseName ? (
                      <p className="text-xs font-mono text-[var(--text-muted)]">
                        {item.japaneseName}
                      </p>
                    ) : null}
                  </div>

                  {/* Known Aliases */}
                  {item.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.aliases.slice(0, 2).map((alias) => {
                        const isAliasSpoiled =
                          mounted && isArcSpoiler(alias.arc, spoilerArc, allowedIfRoutes);
                        return (
                          <span
                            key={alias.name}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                          >
                            {isAliasSpoiled ? "⚠️ Spoiler Alias" : alias.name}
                          </span>
                        );
                      })}
                      {item.aliases.length > 2 && (
                        <span className="text-[10px] text-[var(--text-muted)] self-center">
                          +{item.aliases.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description snippet */}
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Card Footer: Content Counts and Arrow */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono text-[11px]">
                    <span className={item.qnaCount > 0 ? "text-[var(--text-main)] font-semibold" : ""}>
                      {item.qnaCount} Q&amp;A{item.qnaCount !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span className={item.triviaCount > 0 ? "text-[var(--text-main)] font-semibold" : ""}>
                      {item.triviaCount} Trivia
                    </span>
                  </div>

                  <div className="font-semibold text-[var(--accent)] flex items-center gap-1">
                    <span>View Lore</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
