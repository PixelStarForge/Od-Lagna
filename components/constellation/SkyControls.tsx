"use client";

import React, { useMemo } from "react";
import { CustomSelect } from "../CustomSelect";
import type { ConstellationRecord } from "../../lib/constellation-schema";

interface SkyControlsProps {
  constellations: ConstellationRecord[];
  selectedConstellationId: string | null;
  onSelectConstellation: (id: string) => void;
  showLines: boolean;
  onToggleLines: () => void;
  showHalos: boolean;
  onToggleHalos: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onOpenDrawer: () => void;
  isDrawerOpen: boolean;
}

export function SkyControls({
  constellations,
  selectedConstellationId,
  onSelectConstellation,
  showLines,
  onToggleLines,
  showHalos,
  onToggleHalos,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onOpenDrawer,
  isDrawerOpen,
}: SkyControlsProps) {
  const constellationOptions = useMemo(
    () =>
      constellations.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.englishName})`,
      })),
    [constellations]
  );

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pointer-events-auto">
      {/* Constellation Quick-Jump Selector: Uses canonical CustomSelect */}
      <div className="w-48 sm:w-56 shrink-0">
        <CustomSelect
          value={selectedConstellationId || ""}
          onChange={onSelectConstellation}
          options={constellationOptions}
          placeholder="Jump to Constellation..."
          compact={true}
          ariaLabel="Jump to constellation"
        />
      </div>

      {/* Re:Zero Character Stars Drawer Button */}
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Toggle Re:Zero character star drawer"
        title="View Re:Zero characters and their astronomical origins (C)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer border ${
          isDrawerOpen
            ? "bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-border)] font-semibold"
            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
        }`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Character Stars</span>
      </button>

      {/* Constellation Lines Toggle */}
      <button
        type="button"
        onClick={onToggleLines}
        title={showLines ? "Hide Constellation Lines (L)" : "Show Constellation Lines (L)"}
        aria-label="Toggle constellation lines"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer border ${
          showLines
            ? "bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-border)] font-semibold"
            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
        }`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <span className="hidden md:inline">Lines</span>
      </button>

      {/* Beacons Toggle */}
      <button
        type="button"
        onClick={onToggleHalos}
        title={showHalos ? "Hide Character Halos (B)" : "Show Character Halos (B)"}
        aria-label="Toggle character star beacons"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer border ${
          showHalos
            ? "bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-border)] font-semibold"
            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
        }`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
        <span className="hidden md:inline">Beacons</span>
      </button>

      <span className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5 hidden sm:inline-block" />

      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom Out (-)"
        aria-label="Zoom out"
        className="p-1.5 rounded-md text-xs border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom In (+)"
        aria-label="Zoom in"
        className="p-1.5 rounded-md text-xs border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
        </svg>
      </button>

      {/* Reset Camera View */}
      <button
        type="button"
        onClick={onResetCamera}
        title="Reset camera perspective (R)"
        aria-label="Reset camera"
        className="p-1.5 rounded-md text-xs border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
