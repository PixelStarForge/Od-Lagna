"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { StarHoverBadge } from "./StarHoverBadge";
import { StarDetailCard } from "./StarDetailCard";
import { CharacterDrawer } from "./CharacterDrawer";
import { SkyControls } from "./SkyControls";
import { raDecToVector3 } from "./celestial-math";
import type { StarHitTarget } from "./CelestialEngine";
import type { StarRecord, ConstellationRecord, CharacterStarRecord } from "../../lib/constellation-schema";

// Dynamically import Three.js Canvas with ssr: false to prevent SSR hydration errors
const CelestialCanvas = dynamic(
  () => import("./CelestialCanvas").then((mod) => mod.CelestialCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black text-[var(--text-muted)] font-mono text-xs">
        Loading Celestial Sphere...
      </div>
    ),
  }
);

interface ConstellationClientProps {
  stars: StarRecord[];
  constellations: ConstellationRecord[];
  characterStars: CharacterStarRecord[];
}

export function ConstellationClient({
  stars,
  constellations,
  characterStars,
}: ConstellationClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<StarHitTarget | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<StarHitTarget | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | undefined>();

  const [flyToStarId, setFlyToStarId] = useState<string | null>(null);
  const [flyToConstellationId, setFlyToConstellationId] = useState<string | null>(null);
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | null>(null);

  const [showLines, setShowLines] = useState(true);
  const [showHalos, setShowHalos] = useState(true);

  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);

  // Live astronomical coordinates HUD
  const [coords, setCoords] = useState<{ ra: string; dec: string }>({
    ra: "00h 00m",
    dec: "+00° 00'",
  });

  // Hotkey help modal toggle
  const [showHelp, setShowHelp] = useState(false);

  const handleResetCamera = useCallback(() => {
    setFlyToStarId(null);
    setFlyToConstellationId(null);
    setSelectedConstellationId(null);
    setSelectedTarget(null);
    setResetTrigger((prev) => prev + 1);
  }, []);

  const handleSelectCharacter = useCallback(
    (cs: CharacterStarRecord) => {
      const star = stars.find((s) => s.id === cs.starId);
      if (!star) return;

      setSelectedConstellationId(null);
      setFlyToConstellationId(null);
      setFlyToStarId(cs.starId);
      setSelectedTarget({
        star,
        character: cs,
        worldPosition: raDecToVector3(star.ra, star.dec),
      });
    },
    [stars]
  );

  const handleSelectConstellation = useCallback((id: string) => {
    setSelectedConstellationId(id);
    setFlyToStarId(null);
    setSelectedTarget(null);
    setFlyToConstellationId(id);
  }, []);

  const handleCoordinatesUpdate = useCallback((ra: string, dec: string) => {
    setCoords({ ra, dec });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (showHelp) {
          setShowHelp(false);
        } else if (selectedTarget) {
          setSelectedTarget(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      } else if (e.key === "+" || e.key === "=") {
        setZoomInTrigger((prev) => prev + 1);
      } else if (e.key === "-" || e.key === "_") {
        setZoomOutTrigger((prev) => prev + 1);
      } else if (e.key === "r" || e.key === "R") {
        handleResetCamera();
      } else if (e.key === "l" || e.key === "L") {
        setShowLines((prev) => !prev);
      } else if (e.key === "b" || e.key === "B") {
        setShowHalos((prev) => !prev);
      } else if (e.key === "c" || e.key === "C") {
        setIsDrawerOpen((prev) => !prev);
      } else if (e.key === "?") {
        setShowHelp((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTarget, isDrawerOpen, showHelp, handleResetCamera]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] bg-[var(--bg-main)] overflow-hidden select-none">
      {/* Top Header: Breadcrumb & Sky Controls outside and above canvas */}
      <div className="w-full shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 sm:px-6 lg:px-8 pt-4 pb-3 space-y-3 z-30">
        {/* Exact Breadcrumb Navigation matching other sections */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3"
        >
          <Link className="hover:text-[var(--accent)] transition-colors" href="/">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--text-main)] font-semibold">Constellations</span>
        </nav>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-[var(--text-muted)] hidden sm:block">
            Celestial Sphere • 360° Lore Map
          </div>
          <SkyControls
            constellations={constellations}
            selectedConstellationId={selectedConstellationId}
            onSelectConstellation={handleSelectConstellation}
            showLines={showLines}
            onToggleLines={() => setShowLines((prev) => !prev)}
            showHalos={showHalos}
            onToggleHalos={() => setShowHalos((prev) => !prev)}
            onZoomIn={() => setZoomInTrigger((prev) => prev + 1)}
            onZoomOut={() => setZoomOutTrigger((prev) => prev + 1)}
            onResetCamera={handleResetCamera}
            onOpenDrawer={() => setIsDrawerOpen((prev) => !prev)}
            isDrawerOpen={isDrawerOpen}
          />
        </div>
      </div>

      {/* Main 3D Canvas Area (fills all space below header) */}
      <main className="relative flex-1 w-full bg-black overflow-hidden">
        {/* WebGL 3D Canvas */}
        <CelestialCanvas
          stars={stars}
          constellations={constellations}
          characterStars={characterStars}
          showLines={showLines}
          showHalos={showHalos}
          flyToStarId={flyToStarId}
          flyToConstellationId={flyToConstellationId}
          resetTrigger={resetTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
          onFlyToComplete={() => {
            setFlyToStarId(null);
            setFlyToConstellationId(null);
          }}
          onHoverStar={(target, pos) => {
            setHoveredTarget(target);
            setHoverPos(pos);
          }}
          onSelectStar={(target) => {
            setSelectedTarget(target);
          }}
          onCoordinatesUpdate={handleCoordinatesUpdate}
        />

        {/* Live Astronomical Coordinates HUD (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur-md text-[11px] font-mono text-[var(--text-muted)] shadow-md">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
              <span className="font-semibold text-[var(--text-main)]">Target:</span>
            </span>
            <span>
              RA: <span className="font-semibold text-[var(--text-main)]">{coords.ra}</span>
            </span>
            <span className="text-[var(--border-subtle)]">•</span>
            <span>
              Dec: <span className="font-semibold text-[var(--text-main)]">{coords.dec}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            title="Keyboard Shortcuts & Navigation Guide (?)"
            aria-label="Show hotkeys and navigation guide"
            className="pointer-events-auto p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer text-xs font-mono font-bold"
          >
            ?
          </button>
        </div>

        {/* Subtle Navigation Guide (Bottom-Right, desktop only) */}
        <div className="hidden lg:block absolute bottom-4 right-4 z-20 pointer-events-none">
          <div className="text-[11px] font-mono text-[var(--text-muted)]/80 bg-[var(--bg-surface)]/60 backdrop-blur-xs px-3 py-1 rounded-md border border-[var(--border-subtle)]/40">
            Drag to orbit • Scroll to zoom • Click star for lore
          </div>
        </div>

        {/* Character Quick-Jump Drawer */}
        <CharacterDrawer
          characterStars={characterStars}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSelectCharacter={handleSelectCharacter}
          selectedStarId={selectedTarget?.star.id}
        />

        {/* Hover Screen-space Tooltip */}
        {!selectedTarget && (
          <StarHoverBadge target={hoveredTarget} position={hoverPos} />
        )}

        {/* Floating Star Detail Card */}
        <StarDetailCard
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
        />

        {/* Hotkey & Guide Modal */}
        {showHelp && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Shortcuts"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="font-bold text-sm text-[var(--text-main)]">
                  Navigation & Shortcuts
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  aria-label="Close shortcuts guide"
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Orbit Sky</span>
                  <span className="font-semibold text-[var(--text-main)]">Left Click + Drag</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Zoom In / Out</span>
                  <span className="font-semibold text-[var(--text-main)]">Scroll or + / -</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Select Star</span>
                  <span className="font-semibold text-[var(--text-main)]">Left Click Star</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Reset View</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-bold">R</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Toggle Lines</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-bold">L</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Toggle Beacons</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-bold">B</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--text-muted)]">Character Index</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-bold">C</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--text-muted)]">Close Overlays</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-bold">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
