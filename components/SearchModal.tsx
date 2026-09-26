"use client";

import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { usePreferences } from "../lib/preferences";
import { SearchIndexRecord, SearchIndexPayload } from "../lib/search-index";
import { CANON_ARCS, IF_ROUTES, isArcSpoiler } from "../lib/arc-utils";
import { formatQnaDate } from "../lib/date-utils";
import { dispatchUrlChange } from "../lib/navigation-events";

type SearchResultItem =
  | { type: "qna"; data: SearchIndexRecord }
  | { type: "character"; name: string }
  | { type: "topic"; name: string }
  | { type: "arc"; slug: string; name: string };

export function SearchModal() {
  const { isSearchOpen, setIsSearchOpen, spoilerArc, allowedIfRoutes } = usePreferences();
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const deferredQuery = useDeferredValue(debouncedQuery);

  const [indexRecords, setIndexRecords] = useState<SearchIndexRecord[]>([]);
  const [indexCharacters, setIndexCharacters] = useState<string[]>([]);
  const [indexTopics, setIndexTopics] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isLoading = isSearchOpen && !hasLoaded;

  // Debounce search query to prevent lag on multi-word strings while keeping input responsive
  useEffect(() => {
    const trimmed = inputValue.trim();
    const delay = !trimmed || /^#?\d+$/.test(trimmed) || /^TR-?\d*$/i.test(trimmed) ? 0 : 150;
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, delay);
    return () => clearTimeout(timer);
  }, [inputValue]);

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
        setInputValue("");
        setDebouncedQuery("");
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
      (record) => !isArcSpoiler(record.arc, spoilerArc, allowedIfRoutes)
    );
  }, [indexRecords, spoilerArc, allowedIfRoutes]);

  // Pre-index allowed records to avoid redundant lowercase/string operations during search
  const indexedRecords = useMemo(() => {
    return allowedRecords.map((record) => {
      const idLower = record.id.toLowerCase();
      const questionLower = (record.question || "").toLowerCase();
      const answerLower = (record.answerSearchText || "").toLowerCase();
      const titleLower = (record.title || "").toLowerCase();
      const charactersLower = record.characters.map((c) => c.toLowerCase());
      const topicsLower = record.topics.map((t) => t.toLowerCase());
      const arcNameLower = (record.arcName || "").toLowerCase();

      // Combined search haystack for fast multi-token containment
      const haystack = `${idLower} ${titleLower} ${questionLower} ${answerLower} ${charactersLower.join(" ")} ${topicsLower.join(" ")} ${arcNameLower}`;

      return {
        record,
        idLower,
        questionLower,
        answerLower,
        titleLower,
        charactersLower,
        topicsLower,
        arcNameLower,
        haystack,
      };
    });
  }, [allowedRecords]);

  // Create Fuse instance strictly on spoiler-allowed records for typo-tolerant fallback
  const fuse = useMemo(() => {
    if (allowedRecords.length === 0) return null;
    return new Fuse(allowedRecords, {
      keys: [
        { name: "id", weight: 0.3 },
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

  // Compute grouped search results with tokenized multi-word matching
  const groupedResults = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) {
      return { qnas: [], characters: [], topics: [], arcs: [], flatList: [] };
    }

    const cleanQ = q.replace(/^#/, "").replace(/^qna[\s#-]+/i, "").trim();
    const isNumericQuery = /^\d+$/.test(cleanQ);
    const isTriviaQuery = /^tr[-_\s]?\d+/i.test(cleanQ);

    const seenQnaIds = new Set<string>();
    const qnas: SearchIndexRecord[] = [];

    // 1. Direct ID matching (exact and partial)
    if (isTriviaQuery) {
      const numPart = cleanQ.replace(/^tr[-_\s]?/i, "");
      const formatted = `TR-${numPart.padStart(4, "0")}`.toLowerCase();
      for (const item of indexedRecords) {
        if (item.idLower === cleanQ || item.idLower === formatted) {
          seenQnaIds.add(item.record.id);
          qnas.push(item.record);
          break;
        }
      }
    } else if (isNumericQuery) {
      const targetPadded = cleanQ.padStart(4, "0");
      for (const item of indexedRecords) {
        if (item.record.id === cleanQ || item.record.id === targetPadded) {
          seenQnaIds.add(item.record.id);
          qnas.push(item.record);
        } else if (cleanQ.length >= 2 && item.record.id.includes(cleanQ)) {
          if (!seenQnaIds.has(item.record.id) && qnas.length < 8) {
            seenQnaIds.add(item.record.id);
            qnas.push(item.record);
          }
        }
      }
    }

    // 2. Multi-word / Keyword matching
    const tokens = q.split(/\s+/).filter(Boolean);

    if (tokens.length >= 2) {
      // Score-based token intersection
      const candidates: { record: SearchIndexRecord; score: number }[] = [];

      for (const item of indexedRecords) {
        if (seenQnaIds.has(item.record.id)) continue;

        // All tokens must be present in the pre-computed haystack
        const allTokensMatch = tokens.every((tok) => item.haystack.includes(tok));
        if (!allTokensMatch) continue;

        let score = 0;

        // Exact full phrase bonus
        if (item.questionLower.includes(q)) score += 120;
        if (item.titleLower.includes(q)) score += 100;
        if (item.answerLower.includes(q)) score += 60;

        // Token presence in question/tags
        const allInQuestion = tokens.every((tok) => item.questionLower.includes(tok));
        if (allInQuestion) score += 50;

        const allInTags = tokens.every(
          (tok) =>
            item.charactersLower.some((c) => c.includes(tok)) ||
            item.topicsLower.some((t) => t.includes(tok))
        );
        if (allInTags) score += 40;

        // Individual token hits
        for (const tok of tokens) {
          if (item.questionLower.includes(tok)) score += 10;
          if (item.titleLower.includes(tok)) score += 10;
          if (item.charactersLower.some((c) => c.includes(tok))) score += 8;
          if (item.topicsLower.some((t) => t.includes(tok))) score += 5;
        }

        if (item.record.verified) score += 2;

        candidates.push({ record: item.record, score });
      }

      candidates.sort((a, b) => b.score - a.score);

      for (const cand of candidates) {
        if (qnas.length >= 8) break;
        if (!seenQnaIds.has(cand.record.id)) {
          seenQnaIds.add(cand.record.id);
          qnas.push(cand.record);
        }
      }
    } else {
      // Single token search:
      // Fast exact substring match across question, title, tags, answer
      const exactMatches: { record: SearchIndexRecord; score: number }[] = [];

      for (const item of indexedRecords) {
        if (seenQnaIds.has(item.record.id)) continue;

        let score = 0;
        if (item.questionLower.includes(q)) score += 50;
        if (item.titleLower.includes(q)) score += 40;
        if (item.charactersLower.some((c) => c.includes(q))) score += 30;
        if (item.topicsLower.some((t) => t.includes(q))) score += 20;
        if (item.answerLower.includes(q)) score += 10;

        if (score > 0) {
          if (item.record.verified) score += 2;
          exactMatches.push({ record: item.record, score });
        }
      }

      exactMatches.sort((a, b) => b.score - a.score);

      for (const m of exactMatches) {
        if (qnas.length >= 8) break;
        if (!seenQnaIds.has(m.record.id)) {
          seenQnaIds.add(m.record.id);
          qnas.push(m.record);
        }
      }

      // If exact substring gave < 5 results and query has >= 3 chars, use Fuse for fuzzy typo tolerance
      if (qnas.length < 5 && cleanQ.length >= 3 && fuse) {
        const fuzzyResults = fuse.search(q, { limit: 8 });
        for (const res of fuzzyResults) {
          if (qnas.length >= 8) break;
          if (!seenQnaIds.has(res.item.id)) {
            seenQnaIds.add(res.item.id);
            qnas.push(res.item);
          }
        }
      }
    }

    // 3. Character Matches
    const matchedChars = indexCharacters
      .filter((c) => {
        const cLower = c.toLowerCase();
        if (tokens.length <= 1) {
          return cLower.includes(q) || (cleanQ && cLower.includes(cleanQ));
        }
        return tokens.every((tok) => cLower.includes(tok));
      })
      .slice(0, 5);

    // 4. Topic Matches
    const matchedTopics = indexTopics
      .filter((t) => {
        const tLower = t.toLowerCase();
        if (tokens.length <= 1) {
          return tLower.includes(q) || (cleanQ && tLower.includes(cleanQ));
        }
        return tokens.every((tok) => tLower.includes(tok));
      })
      .slice(0, 5);

    // 5. Arc / IF Route Matches
    const matchedArcs: { slug: string; name: string }[] = [];
    for (const a of CANON_ARCS) {
      if (a.order > spoilerArc) continue;
      const arcOrderStr = `arc ${a.order}`.toLowerCase();
      const aName = a.name.toLowerCase();
      const aSlug = a.slug.toLowerCase();

      const matches =
        tokens.length <= 1
          ? aName.includes(q) || arcOrderStr.includes(q) || aSlug.includes(q)
          : tokens.every((tok) => aName.includes(tok) || arcOrderStr.includes(tok) || aSlug.includes(tok));

      if (matches) {
        matchedArcs.push({ slug: a.slug, name: `Arc ${a.order}: ${a.name}` });
      }
    }

    for (const r of IF_ROUTES) {
      if (!allowedIfRoutes.includes(r.slug)) continue;
      const rName = r.name.toLowerCase();
      const rSlug = r.slug.toLowerCase();

      const matches =
        tokens.length <= 1
          ? rName.includes(q) || rSlug.includes(q)
          : tokens.every((tok) => rName.includes(tok) || rSlug.includes(tok));

      if (matches) {
        matchedArcs.push({ slug: r.slug, name: r.name });
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
  }, [deferredQuery, fuse, indexedRecords, indexCharacters, indexTopics, spoilerArc, allowedIfRoutes]);

  const navigateTo = (url: string) => {
    setIsSearchOpen(false);
    router.push(url);
    dispatchUrlChange(url);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selected = groupedResults.flatList[selectedIndex];
      if (selected) {
        handleSelectItem(selected);
      } else if (inputValue.trim()) {
        navigateTo(`/browse?search=${encodeURIComponent(inputValue.trim())}`);
      }
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
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.type === "qna") {
      navigateTo(`/qna?id=${item.data.id}`);
    } else if (item.type === "character") {
      navigateTo(`/browse?character=${encodeURIComponent(item.name)}`);
    } else if (item.type === "topic") {
      navigateTo(`/browse?topic=${encodeURIComponent(item.name)}`);
    } else if (item.type === "arc") {
      navigateTo(`/browse?arc=${encodeURIComponent(item.slug)}`);
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
          <svg className="w-5 h-5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search questions, answers, characters, topics, arcs, #ID..."
            className="w-full bg-transparent text-sm focus:outline-none text-[var(--text-main)] placeholder-[var(--text-muted)]"
            autoComplete="off"
            spellCheck="false"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                setDebouncedQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-1.5 py-0.5 rounded cursor-pointer font-medium"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono border rounded bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-4 flex-1">
          {isLoading && (
            <div className="p-8 text-center text-sm text-[var(--text-muted)] font-mono">
              Loading search index...
            </div>
          )}

          {!isLoading && inputValue.trim() === "" && (
            <div className="p-6 text-center space-y-3">
              <p className="text-sm text-[var(--text-muted)]">
                Type any character name, topic, arc, or keyword to search the archive.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="text-xs text-[var(--text-muted)] font-mono font-medium">Quick searches:</span>
                {["Arc 4", "Subaru", "Emilia", "Rem", "Greed IF", "General"].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setInputValue(sug);
                      setDebouncedQuery(sug);
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:border-[var(--border-strong)] cursor-pointer transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && inputValue.trim() !== "" && groupedResults.flatList.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--text-muted)] space-y-3">
              <div>
                <p className="font-semibold text-[var(--text-main)]">No direct matches found for &ldquo;{inputValue}&rdquo;</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Press Enter or click below to search across all indexed statements.</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    navigateTo(`/browse?search=${encodeURIComponent(inputValue.trim())}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--accent)] cursor-pointer transition-colors"
                >
                  <span>Search archive for &ldquo;{inputValue}&rdquo; in Browse</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          )}

          {/* Group 1: Characters */}
          {groupedResults.characters.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Characters
              </div>
              {groupedResults.characters.map((char) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={char}
                    onClick={() => handleSelectItem({ type: "character", name: char })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">#{char}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-medium">Filter character →</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 2: Topics */}
          {groupedResults.topics.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Topics
              </div>
              {groupedResults.topics.map((topic) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={topic}
                    onClick={() => handleSelectItem({ type: "topic", name: topic })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium">{topic}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-medium">Filter topic →</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 3: Arcs */}
          {groupedResults.arcs.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Story Arcs &amp; Timelines
              </div>
              {groupedResults.arcs.map((arc) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={arc.slug}
                    onClick={() => handleSelectItem({ type: "arc", slug: arc.slug, name: arc.name })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium">{arc.name}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-medium">Filter arc →</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 4: Questions & Answers */}
          {groupedResults.qnas.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Questions ({groupedResults.qnas.length})
              </div>
              {groupedResults.qnas.map((qna) => {
                const itemIndex = currentItemOffset++;
                const isSelected = selectedIndex === itemIndex;
                const formattedDate = formatQnaDate(qna.dateTime);
                return (
                  <div
                    key={qna.id}
                    onClick={() => handleSelectItem({ type: "qna", data: qna })}
                    className={`px-3 py-2.5 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors space-y-1 ${
                      isSelected
                        ? "bg-[var(--accent-bg)] border border-[var(--accent-border)]"
                        : "hover:bg-[var(--bg-elevated)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)] truncate font-medium">
                        <span>#{qna.id} • {qna.arcName}</span>
                        {formattedDate && (
                          <>
                            <span>•</span>
                            <span>{formattedDate}</span>
                          </>
                        )}
                      </div>
                      {qna.verified && (
                        <span className="text-xs text-[var(--verified-text)] font-semibold inline-flex items-center gap-0.5 shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <p className={`font-semibold line-clamp-1 text-sm ${isSelected ? "text-[var(--accent-text)]" : "text-[var(--text-main)]"}`}>
                      {qna.title || qna.question}
                    </p>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-1">
                      {qna.answerSnippet}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Multi-Token &amp; Fuzzy Search</span>
        </div>
      </div>
    </div>
  );
}
