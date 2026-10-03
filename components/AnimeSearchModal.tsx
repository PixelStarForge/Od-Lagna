"use client";

import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthorComment, FlatAnimeComment } from "../lib/schema";

interface AnimeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  allComments?: FlatAnimeComment[];
  currentEpisodeComments?: AuthorComment[];
  currentSeasonId?: string;
  currentSeasonTitle?: string;
  currentEpisodeNumber?: number;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <>{text}</>;

  // Regex for any token match
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function AnimeSearchModal({
  isOpen,
  onClose,
  onOpen,
  allComments = [],
  currentEpisodeComments,
  currentSeasonId,
  currentSeasonTitle,
  currentEpisodeNumber,
}: AnimeSearchModalProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [scope, setScope] = useState<"episode" | "global">(() => {
    return currentEpisodeComments && currentEpisodeComments.length > 0 ? "episode" : "global";
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      if (currentEpisodeComments && currentEpisodeComments.length > 0) {
        setScope("episode");
      } else {
        setScope("global");
      }
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentEpisodeComments]);

  // Global keyboard shortcut: ? to open, Escape to close
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
        return;
      }

      // Check for "?" shortcut to open anime search
      if (!isOpen && onOpen) {
        const isQuestionMark = e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName);
        if (isQuestionMark) {
          e.preventDefault();
          onOpen();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose, onOpen]);

  // Convert current episode comments to FlatAnimeComment format for unified filtering
  const episodeCommentsAsFlat = useMemo<FlatAnimeComment[]>(() => {
    if (!currentEpisodeComments || !currentSeasonId) return [];
    return currentEpisodeComments.map((c) => ({
      ...c,
      seasonId: currentSeasonId,
      seasonTitle: currentSeasonTitle || currentSeasonId,
      episodeNumber: currentEpisodeNumber || 1,
      episodeTitle: "",
    }));
  }, [currentEpisodeComments, currentSeasonId, currentSeasonTitle, currentEpisodeNumber]);

  // Pool of comments to search based on active scope
  const activePool = useMemo<FlatAnimeComment[]>(() => {
    if (scope === "episode" && episodeCommentsAsFlat.length > 0) {
      return episodeCommentsAsFlat;
    }
    return allComments;
  }, [scope, episodeCommentsAsFlat, allComments]);

  // Pre-index the active pool
  const indexedPool = useMemo(() => {
    return activePool.map((c) => ({
      item: c,
      idStr: String(c.id),
      textLower: c.text.toLowerCase(),
      charactersLower: (c.characters || []).map((char) => char.toLowerCase()),
      topicsLower: (c.topics || []).map((topic) => topic.toLowerCase()),
      seasonTitleLower: (c.seasonTitle || "").toLowerCase(),
      episodeTitleLower: (c.episodeTitle || "").toLowerCase(),
    }));
  }, [activePool]);

  // Compute search matches
  const searchResults = useMemo<FlatAnimeComment[]>(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) {
      // Default: show first 12 items
      return activePool.slice(0, 12);
    }

    const cleanId = q.replace(/^#/, "").trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    return indexedPool
      .filter(({ idStr, textLower, charactersLower, topicsLower, seasonTitleLower, episodeTitleLower }) => {
        // Direct ID match
        if (idStr === cleanId) return true;

        // Multi-token match
        return tokens.every(
          (tok) =>
            textLower.includes(tok) ||
            idStr.startsWith(tok) ||
            charactersLower.some((c) => c.includes(tok)) ||
            topicsLower.some((t) => t.includes(tok)) ||
            seasonTitleLower.includes(tok) ||
            episodeTitleLower.includes(tok)
        );
      })
      .map(({ item }) => item)
      .slice(0, 40);
  }, [deferredQuery, activePool, indexedPool]);

  // Reset selected index when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [deferredQuery, scope]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-result-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Jump to selected comment
  const handleSelectComment = useCallback(
    (comment: FlatAnimeComment) => {
      onClose();

      const isCurrentEpisode =
        currentSeasonId === comment.seasonId &&
        currentEpisodeNumber === comment.episodeNumber;

      if (isCurrentEpisode) {
        // On the same episode page: smoothly scroll to element
        setTimeout(() => {
          const el = document.getElementById(`comment-${comment.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-[var(--accent)]", "transition-all");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-[var(--accent)]");
            }, 2500);
          }
        }, 50);
      } else {
        // Navigate to that episode and comment
        router.push(`/anime/${comment.seasonId}/${comment.episodeNumber}#comment-${comment.id}`);
      }
    },
    [currentSeasonId, currentEpisodeNumber, onClose, router]
  );

  // Key navigation inside search dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        handleSelectComment(selected);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Anime Live-Tweets Search"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <svg
            className="w-5 h-5 text-[var(--accent)] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              scope === "episode"
                ? `Search live-tweets in Episode ${currentEpisodeNumber} (keyword, character, topic)...`
                : "Search all author live-tweets, lore, characters, or topics..."
            }
            className="w-full bg-transparent text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          )}

          <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 border rounded border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Scope Selector Bar (if on an episode page) */}
        {currentEpisodeComments && currentEpisodeComments.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs">
            <span className="font-mono text-[var(--text-muted)]">Search in:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScope("episode")}
                className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold cursor-pointer transition-colors ${
                  scope === "episode"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]"
                }`}
              >
                Ep {currentEpisodeNumber} ({currentEpisodeComments.length})
              </button>
              <button
                type="button"
                onClick={() => setScope("global")}
                className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold cursor-pointer transition-colors ${
                  scope === "global"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]"
                }`}
              >
                All Anime Tweets ({allComments.length})
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto max-h-[55vh] p-2 space-y-1.5 divide-y divide-[var(--border-subtle)]">
          {searchResults.length > 0 ? (
            searchResults.map((comment, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${comment.seasonId}-${comment.episodeNumber}-${comment.id}`}
                  data-result-index={index}
                  onClick={() => handleSelectComment(comment)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-[var(--accent-bg)] border border-[var(--accent-border)] shadow-xs"
                      : "hover:bg-[var(--bg-elevated)] border border-transparent"
                  }`}
                >
                  {/* Result Header Badge */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap font-mono">
                      <span className="px-2 py-0.5 rounded font-bold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                        {comment.seasonTitle} • Ep {comment.episodeNumber}
                      </span>
                      <span className="text-[var(--accent)] font-semibold">
                        #{comment.id}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      {isSelected && (
                        <span className="text-[var(--accent)] font-semibold hidden sm:inline">
                          ↵ Jump to live-tweet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Text Snippet */}
                  <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed line-clamp-3">
                    <HighlightMatch text={comment.text} query={query} />
                  </p>

                  {/* Character & Topic Tags */}
                  {((comment.characters && comment.characters.length > 0) ||
                    (comment.topics && comment.topics.length > 0)) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {comment.characters?.map((char) => (
                        <span
                          key={char}
                          className="font-sans text-[11px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                        >
                          {char}
                        </span>
                      ))}
                      {comment.topics?.map((topic) => (
                        <span
                          key={topic}
                          className="font-sans text-[11px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                No broadcast live-tweets found.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Try searching by character name, topic, or keywords.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mr-1">↑</kbd>
              <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mr-1">↓</kbd>
              navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mr-1">↵</kbd>
              select
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mr-1">esc</kbd>
              close
            </span>
          </div>

          <Link
            href="/anime/browse"
            onClick={onClose}
            className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Open in Full Archive</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
