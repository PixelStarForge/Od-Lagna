"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CharacterCatalogItem } from "../lib/content-loader";
import { matchesCharacterTag } from "../lib/character-utils";
import { QnaEntry, TriviaEntry, ArcConfig, IfRouteConfig } from "../lib/schema";
import { CharacterDetailClient } from "./CharacterDetailClient";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { usePreferences } from "../lib/preferences";
import { getArcMetadata, isArcSpoiler } from "../lib/arc-utils";

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

    return catalog.filter((item) => {
      // Arc filter
      if (selectedArc !== "all" && item.arc !== selectedArc) {
        return false;
      }

      // Filter with entries only
      if (filterWithEntriesOnly && item.qnaCount === 0 && item.triviaCount === 0) {
        return false;
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
  }, [catalog, deferredSearch, selectedArc, filterWithEntriesOnly]);

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
            {catalog.length} Named Characters
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

      {/* Search and Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
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
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by character name, alias, or affiliation..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                ✕
              </button>
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
            Showing <strong>{filteredCatalog.length}</strong> of {catalog.length} characters
          </div>
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
            const isSpoiled = mounted && isArcSpoiler(item.arc, spoilerArc, allowedIfRoutes);

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

                    {/* Spoiler / Profile Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSpoiled && (
                        <span
                          title={`Character debut is beyond your Arc ${spoilerArc} cutoff`}
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500"
                        >
                          Spoiler
                        </span>
                      )}
                      {item.hasFullProfile && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                          Profile
                        </span>
                      )}
                    </div>
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
