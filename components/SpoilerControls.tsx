"use client";

import React, { useState } from "react";
import { usePreferences } from "../lib/preferences";
import { IF_ROUTES } from "../lib/arc-utils";

const ARCS = [
  { order: 1, name: "The Tumultuous First Day" },
  { order: 2, name: "The Turbulent Week" },
  { order: 3, name: "Return to the Royal Capital" },
  { order: 4, name: "The Everlasting Contract" },
  { order: 5, name: "The Stars That Engrave History" },
  { order: 6, name: "The Corridor of Memories" },
  { order: 7, name: "The Land of Wolves" },
  { order: 8, name: "Vincent Vollachia" },
  { order: 9, name: "Light of the Nameless Star" },
  { order: 10, name: "The Land of the Lion Kings" },
];

interface SpoilerControlsProps {
  compact?: boolean;
  showPresets?: boolean;
  idPrefix?: string;
}

export function SpoilerControls({
  compact = false,
  showPresets = true,
  idPrefix = "default",
}: SpoilerControlsProps) {
  const {
    spoilerArc,
    setSpoilerArc,
    allowedIfRoutes,
    toggleIfRoute,
    setAllIfRoutes,
    isIfRouteAllowed,
  } = usePreferences();

  const [isIndividualExpanded, setIsIndividualExpanded] = useState(!compact);

  const currentArc = ARCS.find((a) => a.order === spoilerArc) || ARCS[0];
  const sliderId = `${idPrefix}-spoiler-slider`;

  const allRoutesAllowed = IF_ROUTES.length > 0 && allowedIfRoutes.length === IF_ROUTES.length;

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {/* Arc Slider Section */}
      <div className={compact ? "space-y-2.5" : "space-y-3"}>
        <div className="flex items-baseline justify-between">
          <label htmlFor={sliderId} className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
            Story Progress Cutoff
          </label>
          <div className="text-right">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              Arc {currentArc.order}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] min-w-0 break-words">
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono font-bold uppercase tracking-wider">Current Allowed Arc</p>
          <p className="font-sans font-semibold text-sm sm:text-base text-[var(--text-main)] mt-0.5 break-words">
            {currentArc.name}
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed break-words">
            {currentArc.order === 10
              ? "All canon story Q&As are visible without spoiler barriers."
              : `Answers with information beyond Arc ${currentArc.order} are collapsed behind spoiler gates.`}
          </p>
        </div>

        {/* The Slider */}
        <div className="pt-1.5 sm:pt-2">
          <input
            id={sliderId}
            type="range"
            min="1"
            max="10"
            step="1"
            value={spoilerArc}
            onChange={(e) => setSpoilerArc(parseInt(e.target.value, 10))}
            aria-label="Story progress arc cutoff slider"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={spoilerArc}
            aria-valuetext={`Arc ${currentArc.order}: ${currentArc.name}`}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--border-strong)] accent-[var(--accent)]"
          />
          <div className="flex justify-between text-xs font-mono font-medium text-[var(--text-muted)] mt-1.5 px-0.5">
            <span>Arc 1</span>
            <span>Arc 5</span>
            <span>Arc 10</span>
          </div>
        </div>

        {/* Quick presets */}
        {showPresets && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSpoilerArc(1)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                spoilerArc === 1
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Arc 1 (Anime Start)
            </button>
            <button
              type="button"
              onClick={() => setSpoilerArc(4)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                spoilerArc === 4
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Arc 4 (Season 2)
            </button>
            <button
              type="button"
              onClick={() => setSpoilerArc(5)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                spoilerArc === 5
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Arc 5 (Season 3)
            </button>
            <button
              type="button"
              onClick={() => setSpoilerArc(6)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                spoilerArc === 6
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Arc 6 (Season 4)
            </button>
            <button
              type="button"
              onClick={() => setSpoilerArc(10)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                spoilerArc === 10
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Arc 10 (All Novel)
            </button>
          </div>
        )}
      </div>

      {/* IF Routes Toggle Section */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3 min-w-0">
        {/* Header with Title, Badge & Bulk Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-[var(--text-main)] truncate">
              IF Routes &amp; Alternate Stories
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)] shrink-0">
              {allowedIfRoutes.length} of {IF_ROUTES.length} allowed
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setAllIfRoutes(true)}
              className={`text-xs font-medium px-2 py-1 rounded border cursor-pointer transition-colors ${
                allRoutesAllowed
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
              }`}
            >
              Allow All
            </button>
            <button
              type="button"
              onClick={() => setAllIfRoutes(false)}
              className={`text-xs font-medium px-2 py-1 rounded border cursor-pointer transition-colors ${
                allowedIfRoutes.length === 0
                  ? "border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
              }`}
            >
              Block All
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed break-words">
          Author-penned alternate timeline &amp; what-if stories. Toggle individual routes below to permit specific timelines without spoiling others.
        </p>

        {/* Compact Toggle Button to Show/Hide Individual Route Checklist */}
        {compact && (
          <button
            type="button"
            onClick={() => setIsIndividualExpanded(!isIndividualExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:border-[var(--border-strong)] transition-colors cursor-pointer min-w-0"
          >
            <span className="truncate mr-2">
              {isIndividualExpanded ? "Hide" : "Customize"} Individual Routes ({allowedIfRoutes.length}/{IF_ROUTES.length})
            </span>
            <svg
              className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
                isIndividualExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* List of Individual IF Routes */}
        {(!compact || isIndividualExpanded) && (
          <div className={compact ? "space-y-1.5 pt-1 min-w-0" : "grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 min-w-0"}>
            {IF_ROUTES.map((route) => {
              const isAllowed = isIfRouteAllowed(route.slug);
              const checkboxId = `${idPrefix}-if-${route.slug}`;
              const badgeText =
                route.type === "side-story"
                  ? (route.timeline || "Canon Side Story")
                  : route.divergesFrom
                  ? route.divergesFrom.replace("arc-", "Arc ")
                  : "What-If";

              return (
                <label
                  key={route.slug}
                  htmlFor={checkboxId}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-all cursor-pointer select-none text-xs sm:text-sm min-w-0 ${
                    isAllowed
                      ? "border-[var(--accent-border)] bg-[var(--accent-bg)]/35 text-[var(--text-main)] shadow-2xs"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={isAllowed}
                      onChange={() => toggleIfRoute(route.slug)}
                      aria-label={`Toggle ${route.name} spoilers`}
                      className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer shrink-0"
                    />
                    <span className={`font-semibold truncate ${isAllowed ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>
                      {route.name}
                    </span>
                  </div>

                  <span
                    title={badgeText}
                    className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] max-w-[130px] sm:max-w-[180px] truncate text-right shrink-0"
                  >
                    {badgeText}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
