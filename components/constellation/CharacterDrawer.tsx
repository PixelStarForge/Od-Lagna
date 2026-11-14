"use client";

import React, { useState, useMemo } from "react";
import type { CharacterStarRecord } from "../../lib/constellation-schema";

interface CharacterDrawerProps {
  characterStars: CharacterStarRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter: (cs: CharacterStarRecord) => void;
  selectedStarId?: string | null;
}

export function CharacterDrawer({
  characterStars,
  isOpen,
  onClose,
  onSelectCharacter,
  selectedStarId,
}: CharacterDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "archbishops" | "allies" | "if">("all");

  const filteredCharacters = useMemo(() => {
    return characterStars.filter((cs) => {
      // Category filter
      if (activeCategory === "archbishops" && !cs.affiliation.toLowerCase().includes("sin archbishop")) {
        return false;
      }
      if (activeCategory === "allies" && (cs.affiliation.toLowerCase().includes("sin archbishop") || cs.arc.startsWith("if-"))) {
        return false;
      }
      if (activeCategory === "if" && !cs.arc.startsWith("if-")) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        cs.characterName.toLowerCase().includes(q) ||
        cs.starName.toLowerCase().includes(q) ||
        cs.constellationId.toLowerCase().includes(q) ||
        cs.affiliation.toLowerCase().includes(q)
      );
    });
  }, [characterStars, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-80 md:w-96 bg-[var(--bg-surface)]/95 backdrop-blur-xl border-r border-[var(--border-subtle)] shadow-2xl flex flex-col text-left animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="font-bold text-base text-[var(--text-main)]">
              Re:Zero Star Index
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close star drawer"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search character or star name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <svg className="w-4 h-4 absolute left-3 top-2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeCategory === "all"
                ? "bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold"
                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            All ({characterStars.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("archbishops")}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeCategory === "archbishops"
                ? "bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold"
                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Archbishops
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("allies")}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeCategory === "allies"
                ? "bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold"
                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Allies
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("if")}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeCategory === "if"
                ? "bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold"
                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            IF Routes
          </button>
        </div>
      </div>

      {/* Scrollable Character List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]/50 p-2 space-y-1">
        {filteredCharacters.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono">
            No characters found matching search.
          </div>
        ) : (
          filteredCharacters.map((cs) => {
            const isSelected = selectedStarId === cs.starId;
            return (
              <button
                key={cs.characterId}
                type="button"
                onClick={() => {
                  onSelectCharacter(cs);
                  if (window.innerWidth < 640) {
                    onClose();
                  }
                }}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-[var(--accent-bg)] border border-[var(--accent-border)]"
                    : "hover:bg-[var(--bg-elevated)] border border-transparent"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-main)] truncate">
                      {cs.characterName}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] shrink-0">
                      {cs.constellationId}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--accent)] font-medium mt-0.5 truncate">
                    Star: {cs.starName}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {cs.loreTitle}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {cs.arc.startsWith("arc-") ? `Arc ${cs.arc.replace("arc-", "")}` : "IF"}
                  </span>
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

