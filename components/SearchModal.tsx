"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { usePreferences } from "../lib/preferences";
import { SearchIndexRecord, SearchIndexPayload } from "../lib/search-index";
import { CANON_ARCS, IF_ROUTES, isArcSpoiler } from "../lib/arc-utils";

type SearchResultItem =
  | { type: "qna"; data: SearchIndexRecord }
  | { type: "character"; name: string }
  | { type: "topic"; name: string }
  | { type: "arc"; slug: string; name: string };

export function SearchModal() {
  const { isSearchOpen, setIsSearchOpen, spoilerArc, spoilerIf } = usePreferences();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [indexRecords, setIndexRecords] = useState<SearchIndexRecord[]>([]);
  const [indexCharacters, setIndexCharacters] = useState<string[]>([]);
  const [indexTopics, setIndexTopics] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isLoading = isSearchOpen && !hasLoaded;

  // Lazy-load the search index only when the modal opens
  useEffect(() => {
    if (!isSearchOpen || hasLoaded) return;

    let ignore = false;

    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load search index");
        return res.json();
      })
      .then((data: SearchIndexPayload | SearchIndexRecord[]) => {
        if (!ignore) {
          if (Array.isArray(data)) {
            setIndexRecords(data);
            const chars = new Set<string>();
            const topics = new Set<string>();
            data.forEach((d) => {
              d.characters.forEach((c) => chars.add(c));
              d.topics.forEach((t) => topics.add(t));
            });
            setIndexCharacters(Array.from(chars).sort());
            setIndexTopics(Array.from(topics).sort());
          } else {
            setIndexRecords(data.records || []);
            setIndexCharacters(data.characters || []);
            setIndexTopics(data.topics || []);
          }
          setHasLoaded(true);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error loading search index:", err);
          setHasLoaded(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isSearchOpen, hasLoaded]);

  // Autofocus input and select text immediately when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Filter search records strictly according to reader's spoiler cutoff
  const allowedRecords = useMemo(() => {
    return indexRecords.filter(
      (record) => !isArcSpoiler(record.arc, spoilerArc, spoilerIf)
    );
  }, [indexRecords, spoilerArc, spoilerIf]);

  // Create Fuse instance strictly on spoiler-allowed records
  const fuse = useMemo(() => {
    if (allowedRecords.length === 0) return null;
    return new Fuse(allowedRecords, {
      keys: [
        { name: "question", weight: 0.4 },
        { name: "answerSearchText", weight: 0.3 },
        { name: "characters", weight: 0.15 },
        { name: "topics", weight: 0.1 },
        { name: "arcName", weight: 0.05 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [allowedRecords]);

  // Compute grouped search results
  const groupedResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { qnas: [], characters: [], topics: [], arcs: [], flatList: [] };
    }

    // 1. QnA Matches via Fuse.js (only non-spoiler records)
    const qnas: SearchIndexRecord[] = fuse
      ? fuse.search(q, { limit: 8 }).map((res) => res.item)
      : [];

    // Also check direct substring matches if Fuse returns few
    if (qnas.length < 5) {
      const qnaIds = new Set(qnas.map((item) => item.id));
      for (const item of allowedRecords) {
        if (qnaIds.has(item.id)) continue;
        if (
          item.question.toLowerCase().includes(q) ||
          item.answerSearchText.toLowerCase().includes(q) ||
          item.characters.some((c) => c.toLowerCase().includes(q)) ||
          item.topics.some((t) => t.toLowerCase().includes(q))
        ) {
          qnas.push(item);
          qnaIds.add(item.id);
          if (qnas.length >= 8) break;
        }
      }
    }

    // 2. Character Matches
    const matchedChars = indexCharacters
      .filter((c) => c.toLowerCase().includes(q))
      .slice(0, 5);

    // 3. Topic Matches
    const matchedTopics = indexTopics
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 5);

    // 4. Arc / IF Route Matches (filter by spoiler cutoff as well)
    const matchedArcs: { slug: string; name: string }[] = [];
    for (const a of CANON_ARCS) {
      if (a.order > spoilerArc) continue;
      const arcOrderStr = `arc ${a.order}`;
      if (
        a.name.toLowerCase().includes(q) ||
        arcOrderStr.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      ) {
        matchedArcs.push({ slug: a.slug, name: `Arc ${a.order}: ${a.name}` });
      }
    }
    if (spoilerIf) {
      for (const r of IF_ROUTES) {
        if (r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)) {
          matchedArcs.push({ slug: r.slug, name: r.name });
        }
      }
    }

    // Flatten for keyboard navigation
    const flatList: SearchResultItem[] = [
      ...matchedChars.map((name) => ({ type: "character" as const, name })),
      ...matchedTopics.map((name) => ({ type: "topic" as const, name })),
      ...matchedArcs.map((arc) => ({ type: "arc" as const, slug: arc.slug, name: arc.name })),
      ...qnas.map((data) => ({ type: "qna" as const, data })),
    ];

    return { qnas, characters: matchedChars, topics: matchedTopics, arcs: matchedArcs, flatList };
  }, [query, fuse, allowedRecords, indexCharacters, indexTopics, spoilerArc, spoilerIf]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      return;
    }

    const maxIndex = groupedResults.flatList.length - 1;
    if (maxIndex < 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = groupedResults.flatList[selectedIndex];
      if (selected) {
        handleSelectItem(selected);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setIsSearchOpen(false);
    if (item.type === "qna") {
      router.push(`/browse#qna-${item.data.id}`);
    } else if (item.type === "character") {
      router.push(`/browse?character=${encodeURIComponent(item.name)}`);
    } else if (item.type === "topic") {
      router.push(`/browse?topic=${encodeURIComponent(item.name)}`);
    } else if (item.type === "arc") {
      router.push(`/browse?arc=${encodeURIComponent(item.slug)}`);
    }
  };

  if (!isSearchOpen) return null;

  let currentItemOffset = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/60 transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette Search"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <svg className="w-5 h-5 text-[var(--text-faint)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search questions, answers, characters, topics, arcs..."
            className="w-full bg-transparent text-sm focus:outline-none text-[var(--text-main)] placeholder-[var(--text-faint)]"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-xs text-[var(--text-faint)] hover:text-[var(--text-main)] px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono border rounded bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-faint)]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-4 flex-1">
          {isLoading && (
            <div className="p-8 text-center text-xs text-[var(--text-faint)] font-mono">
              Loading search index...
            </div>
          )}

          {!isLoading && query.trim() === "" && (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-[var(--text-muted)]">
                Type any character name, topic, arc, or keyword to search the archive.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="text-[11px] text-[var(--text-faint)] font-mono">Quick searches:</span>
                {["Arc 4", "Subaru", "Emilia", "Rem", "Greed IF", "General"].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setQuery(sug);
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] cursor-pointer transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query.trim() !== "" && groupedResults.flatList.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--text-faint)] space-y-1">
              <p className="font-semibold text-[var(--text-muted)]">No matches found for &ldquo;{query}&rdquo;</p>
              <p>Check spelling or try searching for a broader term.</p>
            </div>
          )}

          {/* Group 1: Characters */}
          {groupedResults.characters.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                Characters
              </div>
              {groupedResults.characters.map((char) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={char}
                    onClick={() => handleSelectItem({ type: "character", name: char })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>#{char}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)]">Filter character →</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 2: Topics */}
          {groupedResults.topics.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                Topics
              </div>
              {groupedResults.topics.map((topic) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={topic}
                    onClick={() => handleSelectItem({ type: "topic", name: topic })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{topic}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)]">Filter topic →</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 3: Arcs */}
          {groupedResults.arcs.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                Story Arcs &amp; Timelines
              </div>
              {groupedResults.arcs.map((arc) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={arc.slug}
                    onClick={() => handleSelectItem({ type: "arc", slug: arc.slug, name: arc.name })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>{arc.name}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)]">Filter arc →</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 4: Questions & Answers */}
          {groupedResults.qnas.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                Questions ({groupedResults.qnas.length})
              </div>
              {groupedResults.qnas.map((qna) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={qna.id}
                    onClick={() => handleSelectItem({ type: "qna", data: qna })}
                    className={`px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors space-y-1 ${
                      isSelected
                        ? "bg-[var(--accent-bg)] border border-[var(--accent-border)]"
                        : "hover:bg-[var(--bg-elevated)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-[var(--text-faint)]">
                        #{qna.id} • {qna.arcName}
                      </span>
                      {qna.verified && (
                        <span className="text-[10px] text-[var(--verified-text)] font-medium inline-flex items-center gap-0.5">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <p className={`font-medium line-clamp-1 ${isSelected ? "text-[var(--accent-text)]" : "text-[var(--text-main)]"}`}>
                      {qna.question}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                      {qna.answerSnippet}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between text-[11px] text-[var(--text-faint)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Fuse.js Fuzzy Search</span>
        </div>
      </div>
    </div>
  );
}
