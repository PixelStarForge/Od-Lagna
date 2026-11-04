"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { TimelineEra, TimelineEvent } from "../lib/schema";
import { CustomSelect, SelectOption } from "./CustomSelect";

interface TimelineClientProps {
  eras: TimelineEra[];
  events: TimelineEvent[];
}

const ZOOM_LEVEL_LABELS: Record<number, { title: string; short: string; desc: string }> = {
  1: { title: "Top Milestones", short: "Top", desc: "Foundational events & world-defining lore" },
  2: { title: "Major Events", short: "Major", desc: "Core light novel milestones & major battles" },
  3: { title: "Standard Canon", short: "Standard", desc: "Recommended canon reading sequence" },
  4: { title: "Extended Lore", short: "Extended", desc: "EX novels, side stories & character lore" },
  5: { title: "Complete Lore", short: "Complete", desc: "Every historical record, short story & trivia" },
};

export function TimelineClient({ eras, events }: TimelineClientProps) {
  // Zoom level: 1 (Macro / World Altering) to 5 (Full Granular Lore)
  const [zoomLevel, setZoomLevel] = useState<number>(3);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [activeEraId, setActiveEraId] = useState<string>(eras[0]?.id || "ancient-era");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Drag slider state
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const handleSliderChangeFromClientX = (clientX: number) => {
    const track = sliderTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newLvl = Math.round(ratio * 4) + 1;
    setZoomLevel(newLvl);
  };

  const handleSliderPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSlider(true);
    handleSliderChangeFromClientX(e.clientX);
  };

  const handleSliderPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSlider) return;
    handleSliderChangeFromClientX(e.clientX);
  };

  const handleSliderPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDraggingSlider(false);
  };

  // Refs for desktop horizontal navigation & smooth pointer drag
  const desktopCanvasRef = useRef<HTMLDivElement>(null);
  const eraRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const pressedEventRef = useRef<TimelineEvent | null>(null);
  const dragDistanceRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const targetEraIdRef = useRef<string | null>(null);
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Collect unique topics and build options for CustomSelect
  const topicOptions = useMemo<SelectOption[]>(() => {
    const topicsSet = new Set<string>();
    for (const e of events) {
      if (e.topic) topicsSet.add(e.topic);
    }
    const sorted = Array.from(topicsSet).sort();
    return [
      { value: "all", label: "All Topics" },
      ...sorted.map((t) => ({ value: t, label: t })),
    ];
  }, [events]);

  // Track exiting events for smooth, noticeable disappear animations on zoom-out
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const prevZoomLevelRef = useRef<number>(zoomLevel);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prevLvl = prevZoomLevelRef.current;
    if (zoomLevel < prevLvl) {
      // Zooming out: collect events being retired
      const retiring = new Set<string>();
      for (const e of events) {
        if (e.importance > zoomLevel && e.importance <= prevLvl) {
          retiring.add(e.id);
        }
      }

      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setExitingIds(retiring);

      exitTimerRef.current = setTimeout(() => {
        setExitingIds(new Set());
        prevZoomLevelRef.current = zoomLevel;
      }, 300);
    } else {
      // Zooming in: cancel pending retirements & update reference
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setExitingIds(new Set());
      prevZoomLevelRef.current = zoomLevel;
    }
  }, [zoomLevel, events]);

  // Filter events based on Zoom level (including currently exiting events), Topic, and Search
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isVisibleForZoom = e.importance <= zoomLevel || exitingIds.has(e.id);
      if (!isVisibleForZoom) return false;
      if (topicFilter !== "all" && e.topic !== topicFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesDesc = e.description.toLowerCase().includes(q);
        const matchesLoc = e.location.toLowerCase().includes(q);
        const matchesChars = e.characters.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesLoc && !matchesChars) return false;
      }
      return true;
    });
  }, [events, zoomLevel, exitingIds, topicFilter, searchQuery]);

  // Group events by Era
  const eventsByEra = useMemo(() => {
    const map: Record<string, TimelineEvent[]> = {};
    for (const era of eras) {
      map[era.id] = [];
    }
    for (const event of filteredEvents) {
      if (!map[event.eraId]) map[event.eraId] = [];
      map[event.eraId].push(event);
    }
    return map;
  }, [eras, filteredEvents]);

  // Mobile active era
  const currentMobileEra = useMemo(() => {
    return eras.find((e) => e.id === activeEraId) || eras[0];
  }, [eras, activeEraId]);

  const activeMobileEraIndex = useMemo(() => {
    return eras.findIndex((e) => e.id === activeEraId);
  }, [eras, activeEraId]);

  const currentModalIndex = useMemo(() => {
    if (!selectedEvent) return -1;
    return filteredEvents.findIndex((e) => e.id === selectedEvent.id);
  }, [selectedEvent, filteredEvents]);

  const selectedEventEra = useMemo(() => {
    if (!selectedEvent) return null;
    return eras.find((e) => e.id === selectedEvent.eraId) || null;
  }, [selectedEvent, eras]);

  // Click handler that ignores accidental clicks when dragging
  const handleCardClick = (event: TimelineEvent) => {
    if (hasMovedRef.current || isDraggingRef.current) return;
    setSelectedEvent(event);
  };

  // Smooth scroll to an era on desktop without flashing intermediate tabs
  const scrollToEra = (eraId: string) => {
    targetEraIdRef.current = eraId;
    setActiveEraId(eraId);
    isProgrammaticScrollRef.current = true;

    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }

    const targetElement = eraRefs.current[eraId];
    const canvas = desktopCanvasRef.current;
    if (targetElement && canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollOffset = canvas.scrollLeft + (targetRect.left - canvasRect.left) - 32;
      canvas.scrollTo({
        left: Math.max(0, scrollOffset),
        behavior: "smooth",
      });
    }
  };

  // Pan horizontal scroll
  const panTimeline = (direction: "left" | "right") => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;
    const amount = 520;
    canvas.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Pointer drag-to-scroll handlers (Pointer Events API for instantaneous 1:1 direct tracking)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Don't intercept clicks on interactive controls like buttons or links
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select")
    ) {
      return;
    }
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    // Detect if pointer pressed down on an event card
    const cardEl = target.closest(".timeline-card") as HTMLElement | null;
    const eventId = cardEl?.getAttribute("data-event-id");
    if (eventId) {
      pressedEventRef.current = events.find((ev) => ev.id === eventId) || null;
    } else {
      pressedEventRef.current = null;
    }

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    dragDistanceRef.current = 0;
    startXRef.current = e.clientX;
    scrollLeftRef.current = canvas.scrollLeft;

    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - startXRef.current;
    dragDistanceRef.current = Math.abs(dx);

    // Immediately start dragging as soon as mouse moves >= 4px
    if (!isDraggingRef.current && Math.abs(dx) >= 4) {
      isDraggingRef.current = true;
      hasMovedRef.current = true;
      pressedEventRef.current = null; // Dragged, cancel card click!
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      canvas.scrollLeft = scrollLeftRef.current - dx;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const canvas = desktopCanvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const wasDragging = isDraggingRef.current;
    const clickedEvent = pressedEventRef.current;

    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    pressedEventRef.current = null;

    if (!wasDragging && clickedEvent && dragDistanceRef.current < 4) {
      // Instant click on desktop card: opens popup!
      setSelectedEvent(clickedEvent);
      hasMovedRef.current = false;
      return;
    }

    if (wasDragging) {
      // Update active era based on final landing position
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const probeX = canvasRect.left + 260;
        for (const era of eras) {
          const el = eraRefs.current[era.id];
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.left <= probeX && rect.right >= probeX) {
              setActiveEraId(era.id);
              break;
            }
          }
        }
      }
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 60);
    } else {
      hasMovedRef.current = false;
    }
  };

  // Update active era on natural scroll (skipped during programmatic scrollToEra or active pointer dragging)
  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    const handleScroll = () => {
      // Programmatic scroll: keep activeEraId locked to targetEraId!
      if (isProgrammaticScrollRef.current) {
        if (scrollDebounceTimerRef.current) {
          clearTimeout(scrollDebounceTimerRef.current);
        }
        scrollDebounceTimerRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          targetEraIdRef.current = null;
        }, 150);
        return;
      }

      // Skip probing during active mouse drag to preserve silky 60fps/120fps motion
      if (isDraggingRef.current) return;

      const canvasRect = canvas.getBoundingClientRect();
      const probeX = canvasRect.left + 300;

      for (const era of eras) {
        const el = eraRefs.current[era.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.left <= probeX && rect.right >= probeX) {
            setActiveEraId((prev) => (prev === era.id ? prev : era.id));
            break;
          }
        }
      }
    };

    const handleScrollEnd = () => {
      if (isProgrammaticScrollRef.current) {
        if (scrollDebounceTimerRef.current) {
          clearTimeout(scrollDebounceTimerRef.current);
        }
        isProgrammaticScrollRef.current = false;
        targetEraIdRef.current = null;
      }
    };

    canvas.addEventListener("scroll", handleScroll, { passive: true });
    canvas.addEventListener("scrollend", handleScrollEnd, { passive: true });

    return () => {
      canvas.removeEventListener("scroll", handleScroll);
      canvas.removeEventListener("scrollend", handleScrollEnd);
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
    };
  }, [eras]);

  // Touchpad pinch-to-zoom listener with haptic-style threshold resistance
  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    let accumulatedDelta = 0;
    let isCooldown = false;
    let resetTimer: NodeJS.Timeout | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Touchpad pinch gesture sets e.ctrlKey to true in modern browsers
      if (e.ctrlKey) {
        e.preventDefault();
        if (isCooldown) return;

        accumulatedDelta += e.deltaY;

        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          accumulatedDelta = 0;
        }, 180);

        // Threshold resistance for deliberate step transition
        if (accumulatedDelta < -25) {
          // Pinch out -> Zoom in
          setZoomLevel((z) => Math.min(5, z + 1));
          accumulatedDelta = 0;
          isCooldown = true;
          setTimeout(() => {
            isCooldown = false;
          }, 240);
        } else if (accumulatedDelta > 25) {
          // Pinch in -> Zoom out
          setZoomLevel((z) => Math.max(1, z - 1));
          accumulatedDelta = 0;
          isCooldown = true;
          setTimeout(() => {
            isCooldown = false;
          }, 240);
        }
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  // Keyboard navigation (Escape to close modal, arrows for events / pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedEvent) {
        if (e.key === "Escape") {
          setSelectedEvent(null);
        } else if (e.key === "ArrowLeft") {
          const idx = filteredEvents.findIndex((ev) => ev.id === selectedEvent.id);
          if (idx > 0) {
            setSelectedEvent(filteredEvents[idx - 1]);
          }
        } else if (e.key === "ArrowRight") {
          const idx = filteredEvents.findIndex((ev) => ev.id === selectedEvent.id);
          if (idx >= 0 && idx < filteredEvents.length - 1) {
            setSelectedEvent(filteredEvents[idx + 1]);
          }
        }
      } else if (e.key === "ArrowLeft" && document.activeElement === desktopCanvasRef.current) {
        panTimeline("left");
      } else if (e.key === "ArrowRight" && document.activeElement === desktopCanvasRef.current) {
        panTimeline("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, filteredEvents]);

  return (
    <div className={`space-y-8 select-none transition-all ${isExpanded ? "w-full" : "max-w-7xl mx-auto"}`}>
      {/* =========================================================================
          PAGE HEADER (Matches PostAnimeGuide & Browse Header)
          ========================================================================= */}
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
  
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
          Re:Zero World Timeline
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed w-full">
          A chronological Timeline of the <em>Re:Zero</em> world, tracking events from ancient myths and the Witch of Envy&apos;s calamity to the Demi-Human War and Modern day and the story's events.
        </p>

        {/* Disclaimer Notice */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 px-4 py-3 sm:px-5 sm:py-3.5 space-y-1.5">
          <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-sm text-[var(--accent)]">
            <span className="text-sm text-[var(--accent)]">A quick note on dates &amp; eras</span>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            This timeline is our attempt at piecing together the history of the <em>Re:Zero</em> world from the light novels, web novel, side stories, and author Q&amp;As. Tappei leaves many dates intentionally vague, so relative placements may be slightly off. Also, the era names (Ancient Era, Witch Era, Mystery Era, etc.) aren&apos;t official canon terminology—they&apos;re just fanmade labels we use to keep all these events organized.
          </p>
        </div>
      </div>

      {/* =========================================================================
          FILTER CONTROLS BAR (Matches BrowseClient filter bar exactly)
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Smooth Drag Slider with Snap Points */}
          <div className="md:col-span-5 space-y-2 select-none">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <span>Zoom Level</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)] font-semibold">
                  Tiers 1–{zoomLevel}
                </span>
              </label>
              <span className="text-xs font-mono font-semibold text-[var(--text-main)] truncate max-w-[200px] text-right">
                {ZOOM_LEVEL_LABELS[zoomLevel]?.title}
              </span>
            </div>

            {/* Draggable Slider Track with 5 Snap Points */}
            <div
              ref={sliderTrackRef}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
              className="relative py-2.5 cursor-pointer touch-none"
              title="Click or drag to change chronological detail level"
            >
              {/* Background Track Bar */}
              <div className="h-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] relative overflow-hidden">
                {/* Active Accent Fill Bar */}
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-150 ease-out rounded-full"
                  style={{ width: `${((zoomLevel - 1) / 4) * 100}%` }}
                />
              </div>

              {/* 5 Snap Node Dots */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const percent = ((lvl - 1) / 4) * 100;
                  const isPassed = lvl <= zoomLevel;
                  const isCurrent = lvl === zoomLevel;

                  return (
                    <div
                      key={lvl}
                      style={{ left: `${percent}%` }}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all ${
                        isCurrent
                          ? "border-[var(--accent)] bg-white dark:bg-[var(--bg-surface)] ring-4 ring-[var(--accent)]/20 scale-125 z-10"
                          : isPassed
                            ? "border-[var(--accent)] bg-[var(--accent)]"
                            : "border-[var(--border-strong)] bg-[var(--bg-surface)]"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Draggable Thumb Handle */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Timeline Chronological Detail Zoom"
                aria-valuemin={1}
                aria-valuemax={5}
                aria-valuenow={zoomLevel}
                aria-valuetext={ZOOM_LEVEL_LABELS[zoomLevel]?.title}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setZoomLevel((z) => Math.max(1, z - 1));
                  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setZoomLevel((z) => Math.min(5, z + 1));
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    setZoomLevel(1);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    setZoomLevel(5);
                  }
                }}
                style={{ left: `${((zoomLevel - 1) / 4) * 100}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[var(--accent)] text-white shadow-md flex items-center justify-center text-[11px] font-mono font-bold hover:scale-115 active:scale-105 transition-transform z-20 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
              >
                {zoomLevel}
              </div>
            </div>

            {/* Snap Node Text Labels */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[var(--text-muted)] pt-0.5 px-0.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setZoomLevel(lvl)}
                  className={`transition-colors cursor-pointer hover:text-[var(--text-main)] ${
                    zoomLevel === lvl
                      ? "text-[var(--accent)] font-bold"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  <span>{lvl}: {ZOOM_LEVEL_LABELS[lvl]?.short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selector via Standard CustomSelect */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Filter by Topic
            </label>
            <CustomSelect
              value={topicFilter}
              onChange={setTopicFilter}
              options={topicOptions}
              placeholder="Select topic..."
              compact
            />
          </div>

          {/* Search by Keyword */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Search Events
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, character..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Line */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)] gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-[var(--text-main)]">{filteredEvents.length}</strong> of{" "}
              <strong>{events.length}</strong> events (Importance &le; {zoomLevel})
            </span>
            {(topicFilter !== "all" || searchQuery.trim() || zoomLevel !== 3) && (
              <button
                type="button"
                onClick={() => {
                  setTopicFilter("all");
                  setSearchQuery("");
                  setZoomLevel(3);
                }}
                className="text-[var(--accent)] hover:underline font-semibold cursor-pointer ml-1"
              >
                Reset view
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Viewing: <strong className="text-[var(--text-main)]">{currentMobileEra.name}</strong>
            </span>
            <span className="text-xs text-[var(--border-strong)]">•</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">Pinch to zoom</span>
            <span className="text-xs text-[var(--border-strong)]">•</span>
            <span className="text-xs font-mono">Pan:</span>
            <button
              type="button"
              onClick={() => panTimeline("left")}
              aria-label="Pan left"
              className="px-2 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Left</span>
            </button>
            <button
              type="button"
              onClick={() => panTimeline("right")}
              aria-label="Pan right"
              className="px-2 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Right</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-xs text-[var(--border-strong)]">•</span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              title={isExpanded ? "Switch to standard container width" : "Switch to expanded full width"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 5M4 4h5M4 4v5m11 0l5-5m0 0h-5m5 0v5m-5 11l5 5m0 0h-5m5 0v-5m-11 0l-5 5m0 0h5m-5 0v-5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                )}
              </svg>
              <span>{isExpanded ? "Standard" : "Expanded"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW: Clean Unified Horizontal Timeline
          ========================================================================= */}
      <div className="hidden lg:block space-y-4">
        {/* Era Jump Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mr-2 shrink-0">
            Jump to:
          </span>
          {eras.map((era) => {
            const count = eventsByEra[era.id]?.length || 0;
            const isActive = activeEraId === era.id;

            return (
              <button
                key={era.id}
                type="button"
                onClick={() => scrollToEra(era.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[var(--accent)] text-white font-bold border-transparent"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span>{era.name}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-4.5 px-1.5 rounded-full text-[10px] font-mono font-bold leading-none shrink-0 ${
                    isActive
                      ? "bg-white text-[var(--accent)] shadow-2xs"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Horizontal Timeline Canvas with Floating Quick Pan Arrows */}
        <div className="relative group/canvas">
          {/* Floating Pan Left Button */}
          <button
            type="button"
            onClick={() => panTimeline("left")}
            aria-label="Pan left"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md shadow-md flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-white transition-all opacity-0 group-hover/canvas:opacity-100 cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Floating Pan Right Button */}
          <button
            type="button"
            onClick={() => panTimeline("right")}
            aria-label="Pan right"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md shadow-md flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-white transition-all opacity-0 group-hover/canvas:opacity-100 cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Continuous Horizontal Canvas (Snug 1.2x Vertical Sizing) */}
          <div
            ref={desktopCanvasRef}
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 px-6 py-5 select-none cursor-grab active:cursor-grabbing focus:outline-none timeline-scrollbar"
            style={{ minHeight: "310px" }}
          >
          {/* Continuous Chronological Timeline Sequence with Event Succession Lines */}
          <div className="inline-flex items-center gap-0 relative z-10 py-1" style={{ minWidth: "max-content" }}>
            {eras.map((era, eraIndex) => {
              const eraEvents = eventsByEra[era.id] || [];

              return (
                <div
                  key={era.id}
                  ref={(el) => {
                    eraRefs.current[era.id] = el;
                  }}
                  className="inline-flex items-center"
                >
                  {/* Era Milestone Gateway Card (1.2x) */}
                  <div className="relative w-[335px] h-[252px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between shrink-0 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
                          Era 0{eraIndex + 1}
                        </span>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {era.timeSpan}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                        {era.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed font-prose">
                        {era.headline}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3.5 border-t border-[var(--border-subtle)]">
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        Chronology
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        {eraEvents.length} {eraEvents.length === 1 ? "Event" : "Events"}
                      </span>
                    </div>
                  </div>

                  {/* Succession Line from Era Gateway into Event Stream */}
                  {eraEvents.length === 0 ? (
                    <div className="inline-flex items-center px-4">
                      <div className="w-14 h-[2px] bg-[var(--border-strong)]" />
                      <div className="px-3 py-1.5 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 text-xs text-[var(--text-muted)] italic shrink-0">
                        No events match Level {zoomLevel}
                      </div>
                      <div className="w-14 h-[2px] bg-[var(--border-strong)]" />
                    </div>
                  ) : (
                    eraEvents.map((event, eventIdx) => {
                      const isExiting = exitingIds.has(event.id);

                      return (
                        <div
                          key={event.id}
                          className={`inline-flex items-center shrink-0 ${
                            isExiting ? "timeline-card-exit" : "timeline-card-enter"
                          }`}
                          style={{
                            animationDelay: isExiting ? "0ms" : `${Math.min(eventIdx * 35, 210)}ms`,
                          }}
                        >
                          {/* Connecting Succession Line with Milestone Node & Directional Arrow */}
                          <div className="w-14 sm:w-16 h-[2px] bg-[var(--border-strong)] relative flex items-center justify-center shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)] bg-[var(--accent)] ring-1 ring-[var(--border-subtle)] shadow-xs" />
                            <svg className="absolute -right-0.5 w-3 h-3 text-[var(--border-strong)]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>

                          {/* Event Card with Picture as Background & Text on Side (Clean Neutral Hover, 1.2x) */}
                          <div
                            data-event-id={event.id}
                            onClick={() => !isExiting && handleCardClick(event)}
                            className="timeline-card relative h-[252px] rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:shadow-md transition-all shadow-xs cursor-pointer group shrink-0 select-none"
                            style={{ width: zoomLevel >= 4 ? "550px" : "500px" }}
                          >
                          {/* Background Picture with Vignette Gradient Overlay */}
                          {event.image ? (
                            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                              <img
                                src={event.image}
                                alt={event.name}
                                draggable={false}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/90 to-[var(--bg-surface)]/25 pointer-events-none" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 z-0 bg-[var(--bg-surface)] overflow-hidden pointer-events-none">
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-10 font-mono text-8xl font-black text-[var(--accent)] select-none">
                                Ω
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
                            </div>
                          )}

                          {/* Top-Right Corner Hover Action Badge (Over Background Artwork) */}
                          <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none">
                            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[var(--accent)] text-white shadow-sm inline-flex items-center gap-1">
                              <span>Details</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                          </div>

                          {/* Foreground Content: Text on the side (left 66%) */}
                          <div className="relative z-10 p-6 flex flex-col justify-between h-full max-w-[66%] space-y-2 pointer-events-none">
                            <div className="flex flex-wrap items-center gap-1.5 w-full">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] shadow-2xs">
                                {event.approxStartDate}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                                Tier {event.importance}
                              </span>
                              <span className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[130px]">
                                {event.topic}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <h3 className="font-bold text-base sm:text-lg text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                                {event.name}
                              </h3>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                                <span>{event.location}</span>
                              </p>
                            </div>

                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 sm:line-clamp-3 leading-relaxed font-prose">
                              {event.description}
                            </p>

                            {event.characters.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {event.characters.slice(0, 3).map((char) => (
                                  <span
                                    key={char}
                                    className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-[var(--bg-elevated)]/90 text-[var(--text-muted)] border border-[var(--border-subtle)]"
                                  >
                                    {char}
                                  </span>
                                ))}
                                {event.characters.length > 3 && (
                                  <span className="text-[10px] text-[var(--text-muted)] font-mono self-center">
                                    +{event.characters.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                  {/* Inter-Era Transition Connector */}
                  {eraIndex < eras.length - 1 && (
                    <div className="w-16 h-[2px] bg-[var(--border-strong)] relative flex items-center justify-center shrink-0 mx-2">
                      <span className="w-2 h-2 rotate-45 border-t-2 border-r-2 border-[var(--accent)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

      {/* =========================================================================
          MOBILE VIEW: All 6 Eras Visible on Screen Grid (No Horizontal Drag Needed)
          ========================================================================= */}
      <div className="block lg:hidden space-y-6">
        {/* All 6 Eras Grid - Fits Cleanly on Screen */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Select Era:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {eras.map((era) => {
              const isActive = era.id === activeEraId;
              const count = eventsByEra[era.id]?.length || 0;

              return (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => setActiveEraId(era.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent)] text-white font-bold border-transparent"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  <span className="truncate mr-1">{era.name}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[1.25rem] h-4.5 px-1.5 rounded-full text-[10px] font-mono font-bold leading-none shrink-0 ${
                      isActive
                        ? "bg-white text-[var(--accent)] shadow-2xs"
                        : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Era Overview Card */}
        {currentMobileEra && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase">
                Era 0{activeMobileEraIndex + 1} of {eras.length}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {currentMobileEra.timeSpan}
              </span>
            </div>

            <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
              {currentMobileEra.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {currentMobileEra.description}
            </p>
          </div>
        )}

        {/* Vertical Stream of Events Connected by Chronological Line */}
        <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-5 before:bottom-6 before:w-[2px] before:bg-[var(--border-strong)]">
          {!eventsByEra[activeEraId] || eventsByEra[activeEraId].length === 0 ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center text-xs text-[var(--text-muted)] italic">
              No events match Zoom Level {zoomLevel} in this era.
              <br />
              <button
                type="button"
                onClick={() => setZoomLevel(5)}
                className="mt-2 text-[var(--accent)] font-semibold hover:underline cursor-pointer"
              >
                Reveal all events (Level 5)
              </button>
            </div>
          ) : (
            eventsByEra[activeEraId].map((event, eventIdx) => {
              const isExiting = exitingIds.has(event.id);

              return (
                <div
                  key={event.id}
                  className={`relative ${
                    isExiting ? "timeline-card-exit-mobile" : "timeline-card-enter"
                  }`}
                  style={{
                    animationDelay: isExiting ? "0ms" : `${Math.min(eventIdx * 30, 180)}ms`,
                  }}
                >
                  {/* Horizontal connecting tick from the line to the card */}
                  <div className="absolute -left-3.5 top-6 w-3.5 h-[2px] bg-[var(--border-strong)] pointer-events-none" />

                  {/* Event Card with Picture as Background & Text on Side */}
                  <div
                    data-event-id={event.id}
                    onClick={() => !isExiting && setSelectedEvent(event)}
                    className="timeline-card relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all shadow-xs cursor-pointer active:scale-[0.99] select-none min-h-[195px]"
                  >
                  {/* Background Picture with Vignette Gradient Overlay */}
                  {event.image ? (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/92 to-[var(--bg-surface)]/25 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0 bg-[var(--bg-surface)] overflow-hidden pointer-events-none">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-10 font-mono text-7xl font-black text-[var(--accent)] select-none">
                        Ω
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
                    </div>
                  )}

                  {/* Top-Right Corner Action Badge on Mobile */}
                  <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white shadow-xs inline-flex items-center gap-1">
                      <span>Details</span>
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </div>

                  {/* Foreground Content: Text on the side (left 75%) */}
                  <div className="relative z-10 p-4.5 flex flex-col justify-between min-h-[195px] max-w-[76%] space-y-2 pointer-events-none">
                    <div className="flex flex-wrap items-center gap-1.5 w-full">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] shadow-2xs">
                        {event.approxStartDate}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                        Tier {event.importance}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[100px]">
                        {event.topic}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] leading-snug line-clamp-2">
                        {event.name}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                        <span>{event.location}</span>
                      </p>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-prose line-clamp-3">
                      {event.description}
                    </p>

                    {event.characters.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {event.characters.slice(0, 3).map((char) => (
                          <span
                            key={char}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-elevated)]/90 text-[var(--text-muted)] border border-[var(--border-subtle)]"
                          >
                            {char}
                          </span>
                        ))}
                        {event.characters.length > 3 && (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono self-center">
                            +{event.characters.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>

        {/* Previous Era / Next Era Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
          {activeMobileEraIndex > 0 ? (
            <button
              type="button"
              onClick={() => setActiveEraId(eras[activeMobileEraIndex - 1].id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{eras[activeMobileEraIndex - 1].name}</span>
            </button>
          ) : (
            <div />
          )}

          {activeMobileEraIndex < eras.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveEraId(eras[activeMobileEraIndex + 1].id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer ml-auto"
            >
              <span>{eras[activeMobileEraIndex + 1].name}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          EVENT DETAIL MODAL (Clean Design, No Emojis, Matches Site Modals)
          ========================================================================= */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xl space-y-5 animate-in zoom-in-95 duration-150 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header (if event has image) */}
            {selectedEvent.image && (
              <div className="h-48 w-full relative overflow-hidden bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close dialog"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className={`p-6 space-y-5 ${selectedEvent.image ? "pt-4" : "pt-6"}`}>
              {/* Header Title & Tags */}
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedEventEra && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent)] text-white shadow-2xs">
                        {selectedEventEra.name}
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      {selectedEvent.topic}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                      Tier {selectedEvent.importance} Milestone
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
                    {selectedEvent.name}
                  </h3>
                </div>

                {!selectedEvent.image && (
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    aria-label="Close dialog"
                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Event Attributes (No Emojis) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedEventEra && (
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">
                      Historical Era
                    </span>
                    <div className="font-semibold text-[var(--text-main)]">
                      {selectedEventEra.name} <span className="text-[var(--text-muted)] font-mono text-[11px]">({selectedEventEra.timeSpan})</span>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">
                    Chronological Date
                  </span>
                  <div className="font-semibold text-[var(--text-main)]">
                    {selectedEvent.approxStartDate}
                  </div>
                </div>

                {selectedEvent.duration && (
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">
                      Duration
                    </span>
                    <div className="font-semibold text-[var(--text-main)]">
                      {selectedEvent.duration}
                    </div>
                  </div>
                )}

                <div className={`rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5 ${!selectedEvent.duration && selectedEventEra ? "sm:col-span-2" : ""}`}>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">
                    Location
                  </span>
                  <div className="font-semibold text-[var(--text-main)]">
                    {selectedEvent.location}
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                  Overview
                </h4>
                <p className="text-sm text-[var(--text-main)] leading-relaxed font-prose">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Characters Involved */}
              {selectedEvent.characters.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    Characters Involved
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.characters.map((char) => (
                      <Link
                        key={char}
                        href={`/characters?name=${encodeURIComponent(char)}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-elevated)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent-text)] border border-[var(--border-subtle)] hover:border-[var(--accent-border)] transition-colors"
                      >
                        {char}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Canonical Source Citation (Handled if present or omitted) */}
              {selectedEvent.source ? (
                <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center justify-between">
                  <span>
                    Source:{" "}
                    <strong className="text-[var(--text-main)]">
                      {typeof selectedEvent.source === "string"
                        ? selectedEvent.source
                        : selectedEvent.source.title}
                    </strong>
                  </span>
                  {typeof selectedEvent.source === "object" && selectedEvent.source.url && (
                    <a
                      href={selectedEvent.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>Link</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center justify-between">
                  <span>
                    Source:{" "}
                    <span className="text-[var(--text-muted)] italic">
                      Primary Canon Chronology
                    </span>
                  </span>
                </div>
              )}

              {/* Modal Navigation & Close Controls */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={currentModalIndex <= 0}
                  onClick={() => {
                    if (currentModalIndex > 0) {
                      setSelectedEvent(filteredEvents[currentModalIndex - 1]);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    currentModalIndex <= 0
                      ? "border-[var(--border-subtle)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:bg-[var(--border-strong)]/20 cursor-pointer"
                  }`}
                  aria-label="Previous event"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 max-w-[140px] py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)]/20 text-xs font-bold text-[var(--text-main)] transition-colors cursor-pointer text-center"
                >
                  Close (Esc)
                </button>

                <button
                  type="button"
                  disabled={currentModalIndex < 0 || currentModalIndex >= filteredEvents.length - 1}
                  onClick={() => {
                    if (currentModalIndex >= 0 && currentModalIndex < filteredEvents.length - 1) {
                      setSelectedEvent(filteredEvents[currentModalIndex + 1]);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    currentModalIndex < 0 || currentModalIndex >= filteredEvents.length - 1
                      ? "border-[var(--border-subtle)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-main)] hover:bg-[var(--border-strong)]/20 cursor-pointer"
                  }`}
                  aria-label="Next event"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
