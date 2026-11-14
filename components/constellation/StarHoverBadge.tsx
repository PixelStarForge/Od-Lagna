"use client";

import React from "react";
import type { StarHitTarget } from "./CelestialEngine";

interface StarHoverBadgeProps {
  target: StarHitTarget | null;
  position?: { x: number; y: number };
}

export function StarHoverBadge({ target, position }: StarHoverBadgeProps) {
  if (!target || !position) return null;

  return (
    <div
      style={{
        left: `${position.x + 14}px`,
        top: `${position.y - 14}px`,
      }}
      className="pointer-events-none fixed z-30 transform -translate-y-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-3 py-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <div className="flex items-center gap-1.5">
        {target.character && (
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
        )}
        <span className="font-semibold text-xs text-[var(--text-main)]">
          {target.star.name}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
        <span>{target.star.bayer}</span>
        <span>•</span>
        <span>{target.star.constellationId}</span>
        {target.character && (
          <>
            <span>•</span>
            <span className="text-[var(--accent)] font-semibold">
              {target.character.characterName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

