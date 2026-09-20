"use client";

import React from "react";
import { usePreferences } from "../lib/preferences";

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
}

export function SpoilerControls({ compact = false, showPresets = true }: SpoilerControlsProps) {
  const { spoilerArc, setSpoilerArc, spoilerIf, setSpoilerIf } = usePreferences();
  const currentArc = ARCS.find((a) => a.order === spoilerArc) || ARCS[0];

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {/* Arc Slider Section */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="spoiler-slider" className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
            Story Progress Cutoff
          </label>
          <div className="text-right">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              Arc {currentArc.order}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <p className="text-xs text-[var(--text-muted)] font-mono font-bold uppercase tracking-wider">Current Allowed Arc</p>
          <p className="font-sans font-semibold text-base text-[var(--text-main)] mt-0.5">
            {currentArc.name}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
            {currentArc.order === 10
              ? "All canon story Q&As are visible without spoiler barriers."
              : `Answers with information beyond Arc ${currentArc.order} are collapsed behind spoiler gates.`}
          </p>
        </div>

        {/* The Slider */}
        <div className="pt-2">
          <input
            id="spoiler-slider"
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
              className={`text-xs font-medium px-2.5 py-1 rounded border cursor-pointer transition-colors ${
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
              className={`text-xs font-medium px-2.5 py-1 rounded border cursor-pointer transition-colors ${
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
              className={`text-xs font-medium px-2.5 py-1 rounded border cursor-pointer transition-colors ${
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
              className={`text-xs font-medium px-2.5 py-1 rounded border cursor-pointer transition-colors ${
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
              className={`text-xs font-medium px-2.5 py-1 rounded border cursor-pointer transition-colors ${
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
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={spoilerIf}
            onChange={(e) => setSpoilerIf(e.target.checked)}
            aria-label="Include IF and alternate timeline spoilers"
            className="mt-1 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer accent-[var(--accent)]"
          />
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-[var(--text-main)]">
              Include IF / EX Spoilers
            </span>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Author-penned alternate timeline stories (Pride, Wrath, Sloth, Greed, Gluttony, etc.). Kept hidden by default to prevent non-linear timeline spoilers.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
