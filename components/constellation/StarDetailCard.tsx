"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePreferences } from "../../lib/preferences";
import type { StarHitTarget } from "./CelestialEngine";

interface StarDetailCardProps {
  target: StarHitTarget | null;
  onClose: () => void;
}

export function StarDetailCard({ target, onClose }: StarDetailCardProps) {
  const { spoilerArc, isIfRouteAllowed, mounted } = usePreferences();
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  if (!target) return null;

  const { star, character } = target;

  // Check if character lore is spoiled based on current user preferences
  const isSpoiled = (() => {
    if (!character || !mounted) return false;
    if (revealedSpoilers[character.characterId]) return false;

    if (character.arc.startsWith("arc-")) {
      const arcNum = parseInt(character.arc.replace("arc-", ""), 10);
      return arcNum > spoilerArc;
    }
    if (character.arc.startsWith("if-")) {
      return !isIfRouteAllowed(character.arc);
    }
    return false;
  })();

  const handleReveal = () => {
    if (character) {
      setRevealedSpoilers((prev) => ({ ...prev, [character.characterId]: true }));
    }
  };

  const arcLabel = character
    ? character.arc.startsWith("arc-")
      ? `Arc ${character.arc.replace("arc-", "")}`
      : character.arc.replace("if-", "").toUpperCase() + " IF"
    : null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-4 sm:p-5 text-left max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-[var(--text-main)]">
              {star.name}
            </h3>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {star.constellationId}
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
            {star.bayer}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close star details"
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Astronomical Micro-Grid */}
      <div className="grid grid-cols-3 gap-2 py-3 border-b border-[var(--border-subtle)] text-center">
        <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="block text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">
            Magnitude
          </span>
          <span className="font-mono text-xs font-bold text-[var(--text-main)] mt-0.5 block">
            {star.magnitude.toFixed(2)}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="block text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">
            Spectral
          </span>
          <span className="font-mono text-xs font-bold text-[var(--text-main)] mt-0.5 block">
            {star.spectralClass}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="block text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">
            Distance
          </span>
          <span className="font-mono text-xs font-bold text-[var(--text-main)] mt-0.5 block">
            {star.distanceLy} ly
          </span>
        </div>
      </div>

      {/* Re:Zero Character Connection Section */}
      {character ? (
        <div className="pt-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
              Re:Zero Lore Origin
            </span>
            {arcLabel && !isSpoiled && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                {arcLabel}
              </span>
            )}
          </div>

          {isSpoiled ? (
            /* Spoiler Gate */
            <div className="p-3.5 rounded-xl border border-[var(--unverified-border)] bg-[var(--unverified-bg)] text-center space-y-2">
              <div className="text-xs font-semibold text-[var(--unverified-text)]">
                Spoiler Barrier: Introduced in {arcLabel}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                This star corresponds to a character introduced past your current story cutoff.
              </p>
              <button
                type="button"
                onClick={handleReveal}
                className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                Click to Reveal Character Connection
              </button>
            </div>
          ) : (
            /* Revealed Character Lore */
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <h4 className="font-bold text-sm text-[var(--text-main)]">
                  {character.characterName}
                </h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {character.affiliation}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-xs font-semibold text-[var(--text-main)] block">
                  {character.loreTitle}
                </span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {character.loreDescription}
                </p>
              </div>

              <Link
                href={character.characterPageUrl}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-[var(--accent-solid)] text-white hover:bg-[var(--accent-solid-hover)] transition-colors cursor-pointer shadow-xs"
              >
                <span>View Character Archive</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-3 text-xs text-[var(--text-muted)] leading-relaxed">
          This is an astronomical reference star in the constellation {star.constellationId}, providing accurate celestial context for the night sky.
        </div>
      )}
    </div>
  );
}

