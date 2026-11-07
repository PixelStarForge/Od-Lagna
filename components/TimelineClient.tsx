"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import { TimelineEra, TimelineEvent, TimelineIfRoute, TimelineIfEvent } from "../lib/schema";
import { CustomSelect, SelectOption } from "./CustomSelect";

interface TimelineClientProps {
  eras: TimelineEra[];
  events: TimelineEvent[];
  initialIfRoutes?: TimelineIfRoute[];
}

const ZOOM_LEVEL_LABELS: Record<number, { title: string; short: string; desc: string }> = {
  1: { title: "Top Milestones", short: "Top", desc: "Foundational events & world-defining lore" },
  2: { title: "Major Events", short: "Major", desc: "Core light novel milestones & major battles" },
  3: { title: "Standard Canon", short: "Standard", desc: "Recommended canon reading sequence" },
  4: { title: "Extended Lore", short: "Extended", desc: "EX novels, side stories & character lore" },
  5: { title: "Complete Lore", short: "Complete", desc: "Every historical record, short story & trivia" },
};

export type IfBranch = TimelineIfRoute;

export const IF_BRANCHES: IfBranch[] = [
  {
    slug: "if-vainglory",
    name: "School IF",
    kanjiTitle: "Gekkou",
    divergesFromEventId: "subaru-summoned-lugunica",
    divergencePoint: "Prologue Alternative",
    direction: "up",
    approxDate: "Day 0 (High School)",
    headline: "Lugunica Academy Days",
    description: "Subaru never crosses over to another world and instead attends Lugunica Private Academy alongside teachers, students, and club leaders.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-vainglory",
    subEvents: ["Homeroom Roll Call", "Disciplinary Committee Clash", "Rooftop Confession"],
  },
  {
    slug: "if-pride",
    name: "Pride IF",
    kanjiTitle: "Ayamatsu",
    divergesFromEventId: "loot-house-bowel-hunter-clash",
    divergencePoint: "Arc 1 Divergence",
    direction: "down",
    approxDate: "Day 1 (Slums)",
    headline: "The Sin Archbishop of Pride",
    description: "Subaru never cries for help in the alleyway. Forming a sinister pact with Elsa and Meili, he incinerates the royal capital to crown Emilia as king.",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-pride",
    subEvents: ["Elsa & Meili Alliance", "Slaying Sin Archbishops", "Burning of Capital"],
  },
  {
    slug: "if-wrath",
    name: "Wrath IF",
    kanjiTitle: "Oboreru",
    divergesFromEventId: "manor-curse-mabeast-forest",
    divergencePoint: "Arc 2 Divergence",
    direction: "up",
    approxDate: "Week 2 (Roswaal Manor)",
    headline: "The Purge King of Pleiades",
    description: "Paralyzed by fear, Subaru flees the manor rather than jumping from the cliff. In Kararagi, he rises as the feared syndicate ruler who perceives a colorless world.",
    image: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-wrath",
    subEvents: ["Flight to Kararagi", "Pleiades Syndicate", "Colorless Coin Flip"],
  },
  {
    slug: "if-lust",
    name: "Lust IF",
    kanjiTitle: "Koikagurui",
    divergesFromEventId: "royal-selection-ceremony-declaration",
    divergencePoint: "Arc 3 Divergence",
    direction: "down",
    approxDate: "Month 2 (Capital)",
    headline: "Butterfly Dream: The Golden King",
    description: "Subaru ascends the throne of Lugunica with a royal harem uniting all candidates, guiding the kingdom through an eccentric and peaceful era.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-lust",
    subEvents: ["Palace Coronation", "Candidate Council Accord", "Lugunica Golden Age"],
  },
  {
    slug: "if-sloth",
    name: "Sloth IF",
    kanjiTitle: "Rem IF",
    divergesFromEventId: "royal-selection-and-white-whale-conquest",
    divergencePoint: "Arc 3 Divergence",
    direction: "up",
    approxDate: "Month 2 (Capital)",
    headline: "Fugitives in Kararagi",
    description: "Subaru asks Rem to abandon Lugunica and run away together, and she says yes. They start a new life in Kararagi, raising their children Rigel and Spica.",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-sloth",
    subEvents: ["Flight to West", "Quiet Life with Rem", "Birth of Rigel & Spica"],
  },
  {
    slug: "if-melancholy",
    name: "Aganau IF",
    kanjiTitle: "Aganau",
    divergesFromEventId: "petelgeuse-sloth-defeat-forest",
    divergencePoint: "Arc 3 Alternate",
    direction: "down",
    approxDate: "20 Years Later",
    headline: "The Vengeful Swordsman's Path",
    description: "Following Rem's death, Subaru spends twenty bitter years training his body and blade to exact relentless vengeance on the Witch Cult.",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-melancholy",
    subEvents: ["Rem's Tragic Loss", "Twenty Years in Exile", "Final Duel with Sloth"],
  },
  {
    slug: "if-greed",
    name: "Greed IF",
    kanjiTitle: "Kasaneru",
    divergesFromEventId: "sanctuary-liberation-great-rabbit",
    divergencePoint: "Arc 4 Divergence",
    direction: "up",
    approxDate: "Month 3 (Sanctuary)",
    headline: "The Contract of Millions of Deaths",
    description: "Subaru accepts Echidna's contract at the Witch's Tea Party. Dying over 100 million times to optimize every event, his emotional soul slowly withers away.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-greed",
    subEvents: ["Echidna Tea Party Pact", "100 Million Deaths", "The Broken Knight"],
  },
  {
    slug: "if-gluttony",
    name: "Gluttony IF",
    kanjiTitle: "Tsugihagu",
    divergesFromEventId: "pleiades-watchtower-expedition",
    divergencePoint: "Arc 6 Divergence",
    direction: "down",
    approxDate: "Month 14 (Watchtower)",
    headline: "Patchwork of the Dead",
    description: "Awakening with complete amnesia, Subaru uses the Books of the Dead to kill anyone who ever knew him, desperately stitching together his lost identity.",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-gluttony",
    subEvents: ["Loss of Memories", "Pleiades Book Plunder", "Stitching the Self"],
  },
  {
    slug: "if-azamuku",
    name: "Azamuku IF",
    kanjiTitle: "Deceive IF",
    divergesFromEventId: "vollachia-empire-disaster-campaign",
    divergencePoint: "Arc 7 Divergence",
    direction: "down",
    approxDate: "Month 15 (Vollachia)",
    headline: "The Two Who Deceived Fate",
    description: "Subaru and Emperor Vincent Vollachia cross paths in the Land of the Sword Wolves to deceive destiny in an alternate imperial confrontation.",
    image: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=1200&q=80",
    href: "/ifs/if-azamuku",
    subEvents: ["Land of Sword Wolves", "Alliance with Vincent", "Deceiving Imperial Fate"],
  },
];

export interface IfRouteTheme {
  color: string;
  bg: string;
  border: string;
  shortReason: string;
}

export const IF_ROUTE_THEMES: Record<string, IfRouteTheme> = {
  "if-vainglory": {
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.45)",
    shortReason: "Never Summoned (Academy)",
  },
  "if-pride": {
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.45)",
    shortReason: "Refuses to Cry for Help",
  },
  "if-wrath": {
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.45)",
    shortReason: "Flees Rather Than Jumps",
  },
  "if-lust": {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.45)",
    shortReason: "Ascends Lugunican Throne",
  },
  "if-sloth": {
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.12)",
    border: "rgba(6, 182, 212, 0.45)",
    shortReason: "Runs Away With Rem",
  },
  "if-melancholy": {
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.45)",
    shortReason: "Rem Slain / Vengeance Vow",
  },
  "if-greed": {
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.45)",
    shortReason: "Accepts Echidna's Contract",
  },
  "if-gluttony": {
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.12)",
    border: "rgba(249, 115, 22, 0.45)",
    shortReason: "Amnesia / Books of Dead",
  },
  "if-azamuku": {
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.45)",
    shortReason: "Pact with Vincent",
  },
};

// Progressive visual stages for events (Elden Ring map continuous scaling):
// "full": Full panoramic card with artwork, description, character tags & actions.
// "compact": Medium card with artwork vignette, date, name & location.
// "pin": Sleek milestone pin with date & title directly on the stem.
// "dot": Subtle milestone node/pip sitting on the stem line for panoramic world view.
export type EventVisualStage = "dot" | "pin" | "compact" | "full";

export const getEventVisualStage = (importance: number, zoom: number): EventVisualStage => {
  if (importance === 1) {
    if (zoom < 0.32) return "compact";
    return "full";
  }
  if (importance === 2) {
    if (zoom < 0.28) return "pin";
    if (zoom < 0.58) return "compact";
    return "full";
  }
  if (importance === 3) {
    if (zoom < 0.36) return "dot";
    if (zoom < 0.62) return "pin";
    if (zoom < 0.86) return "compact";
    return "full";
  }
  if (importance === 4) {
    if (zoom < 0.50) return "dot";
    if (zoom < 0.76) return "pin";
    if (zoom < 1.02) return "compact";
    return "full";
  }
  // importance >= 5
  if (zoom < 0.65) return "dot";
  if (zoom < 0.88) return "pin";
  if (zoom < 1.12) return "compact";
  return "full";
};

export const getStageDimensions = (stage: EventVisualStage, importance: number) => {
  switch (stage) {
    case "dot":
      return {
        width: importance === 3 ? 28 : importance === 4 ? 24 : 22,
        height: importance === 3 ? 28 : importance === 4 ? 24 : 22,
        connectorWidth: importance === 3 ? 16 : 12,
      };
    case "pin":
      return {
        width: 220,
        height: 48,
        connectorWidth: 24,
      };
    case "compact":
      return {
        width: 340,
        height: 145,
        connectorWidth: 36,
      };
    case "full":
      return {
        width: importance >= 4 ? 540 : 500,
        height: 252,
        connectorWidth: 48,
      };
  }
};

export const getEventDisplayMode = (event: TimelineEvent, zoom: number): EventVisualStage => {
  return getEventVisualStage(event.importance, zoom);
};

// Smooth organic wave offset for events along the tree-like timeline stem
export const getEventTreeWaveOffset = (index: number): number => {
  // Gentle harmonic undulation: primary swell + subtle secondary wave
  const angle = (index + 1) * 0.78;
  const raw = Math.sin(angle) * 26 + Math.cos(angle * 0.45) * 8;
  return Math.round(raw);
};

export function TimelineClient({ eras, events, initialIfRoutes }: TimelineClientProps) {
  // Continuous desktop zoom scale: 0.10 (Full multi-era World View) to 1.25 (125% full reading view)
  const [desktopZoom, setDesktopZoom] = useState<number>(1.0);
  const [contentBaseWidth, setContentBaseWidth] = useState<number>(0);
  const contentLayerRef = useRef<HTMLDivElement>(null);

  // Resolved list of IF divergence routes (from JSON files with fallback)
  const ifRoutes = useMemo(() => {
    return initialIfRoutes && initialIfRoutes.length > 0 ? initialIfRoutes : IF_BRANCHES;
  }, [initialIfRoutes]);

  // Multi-selection state for IF routes: users can toggle any combination of routes to view or hide
  const [selectedIfSlugs, setSelectedIfSlugs] = useState<string[]>(() =>
    (initialIfRoutes && initialIfRoutes.length > 0 ? initialIfRoutes : IF_BRANCHES).map((r) => r.slug)
  );
  const lastSelectedIfSlugsRef = useRef<string[]>([]);
  const showIfBranches = selectedIfSlugs.length > 0;
  const soloIfSlug = selectedIfSlugs.length === 1 ? selectedIfSlugs[0] : null;

  const toggleIfRoute = (slug: string) => {
    setSelectedIfSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAllIfRoutes = () => {
    setSelectedIfSlugs(ifRoutes.map((r) => r.slug));
  };

  const clearAllIfRoutes = () => {
    if (selectedIfSlugs.length > 0) {
      lastSelectedIfSlugsRef.current = selectedIfSlugs;
    }
    setSelectedIfSlugs([]);
  };

  const soloIfRoute = (slug: string) => {
    setSelectedIfSlugs((prev) =>
      prev.length === 1 && prev[0] === slug ? ifRoutes.map((r) => r.slug) : [slug]
    );
  };

  // Map IF branches by divergence event id for fast O(1) lookup
  const ifBranchesByEventId = useMemo(() => {
    const map: Record<string, TimelineIfRoute> = {};
    for (const b of ifRoutes) {
      map[b.divergesFromEventId] = b;
    }
    return map;
  }, [ifRoutes]);

  // Mobile view states: standalone IF divergence mode vs Canon eras mode
  const [mobileViewMode, setMobileViewMode] = useState<"canon" | "if">("canon");
  const [selectedIfSlug, setSelectedIfSlug] = useState<string>("if-pride");

  const currentIfRoute = useMemo(() => {
    return ifRoutes.find((r) => r.slug === selectedIfSlug) || ifRoutes[0];
  }, [ifRoutes, selectedIfSlug]);

  const canonDivergenceEvent = useMemo(() => {
    if (!currentIfRoute) return null;
    return events.find((e) => e.id === currentIfRoute.divergesFromEventId) || null;
  }, [currentIfRoute, events]);

  // Derived Semantic LOD Tier from desktop zoom (1 to 5)
  const desktopTier = useMemo(() => {
    if (desktopZoom < 0.48) return 1;
    if (desktopZoom < 0.72) return 2;
    if (desktopZoom < 0.95) return 3;
    if (desktopZoom < 1.15) return 4;
    return 5;
  }, [desktopZoom]);

  // Zoom level state: drives event filtering (1: Top Milestones to 5: Complete Lore)
  const [zoomLevel, setZoomLevel] = useState<number>(3);

  // Synchronize desktop zoom scale to zoomLevel tier
  useEffect(() => {
    setZoomLevel((prev) => (prev !== desktopTier ? desktopTier : prev));
  }, [desktopTier]);

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [activeEraId, setActiveEraId] = useState<string>(eras[0]?.id || "ancient-era");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // IF Route Selector Dropdown
  const [isIfDropdownOpen, setIsIfDropdownOpen] = useState(false);
  const ifDropdownRef = useRef<HTMLDivElement>(null);

  // Controls Guide Modal
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);

  // Radar / Minimap 2D Overview
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const minimapTrackRef = useRef<HTMLDivElement>(null);
  const isMinimapScrubbingRef = useRef(false);
  const [canvasScrollMetrics, setCanvasScrollMetrics] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 1,
    scrollHeight: 1,
    clientWidth: 1,
    clientHeight: 1,
  });

  const scrollMetricsRafRef = useRef<number | null>(null);
  const updateScrollMetrics = () => {
    const c = desktopCanvasRef.current;
    if (!c) return;
    if (scrollMetricsRafRef.current !== null) return;
    scrollMetricsRafRef.current = requestAnimationFrame(() => {
      scrollMetricsRafRef.current = null;
      const el = desktopCanvasRef.current;
      if (!el) return;
      setCanvasScrollMetrics((prev) => {
        if (
          prev.scrollLeft === el.scrollLeft &&
          prev.scrollTop === el.scrollTop &&
          prev.scrollWidth === el.scrollWidth &&
          prev.scrollHeight === el.scrollHeight &&
          prev.clientWidth === el.clientWidth &&
          prev.clientHeight === el.clientHeight
        ) {
          return prev;
        }
        return {
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
          scrollWidth: Math.max(1, el.scrollWidth),
          scrollHeight: Math.max(1, el.scrollHeight),
          clientWidth: Math.max(1, el.clientWidth),
          clientHeight: Math.max(1, el.clientHeight),
        };
      });
    });
  };

  // Refs for desktop horizontal navigation & smooth pointer drag
  const desktopCanvasRef = useRef<HTMLDivElement>(null);
  const eraRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);
  const hasMovedRef = useRef(false);
  const pressedEventRef = useRef<TimelineEvent | null>(null);
  const dragDistanceRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const targetEraIdRef = useRef<string | null>(null);
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const desktopZoomRef = useRef(desktopZoom);
  useEffect(() => {
    desktopZoomRef.current = desktopZoom;
  }, [desktopZoom]);
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; zoom: number; midX: number } | null>(null);

  // Measure canvas clientWidth for dynamic horizontal centering and responsive Fit All
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    const update = () => {
      const w = canvas.clientWidth;
      setCanvasWidth((prev) => (prev !== w ? w : prev));
      updateScrollMetrics();
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const scaledContentWidth = contentBaseWidth ? Math.round(contentBaseWidth * desktopZoom) : 0;
  const isContentCentered = scaledContentWidth > 0 && canvasWidth > 0 && scaledContentWidth < canvasWidth - 48;

  // Anchor reference for smooth continuous pinch & zoom without resetting or drift
  const focalAnchorRef = useRef<{
    selector: string;
    clientX: number;
    offset: number;
  } | null>(null);

  // Helper to locate the closest event or era card to a screen X coordinate
  const findAnchorAtX = (screenX: number): { selector: string; clientX: number; offset: number } | null => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return null;

    const candidates = Array.from(canvas.querySelectorAll<HTMLElement>("[data-event-id], [data-era-id]"));
    if (candidates.length === 0) return null;

    let bestEl: HTMLElement | null = null;
    let bestDist = Infinity;

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const midX = (rect.left + rect.right) / 2;
      const dist = Math.abs(midX - screenX);
      if (dist < bestDist) {
        bestDist = dist;
        bestEl = el;
      }
    }

    if (!bestEl) return null;
    const eventId = bestEl.getAttribute("data-event-id");
    const eraId = bestEl.getAttribute("data-era-id");
    const selector = eventId ? `[data-event-id="${eventId}"]` : `[data-era-id="${eraId}"]`;
    const rect = bestEl.getBoundingClientRect();

    return {
      selector,
      clientX: screenX,
      offset: rect.left - screenX,
    };
  };

  // Synchronously lock the anchor element under the cursor after React commits DOM zoom changes
  useLayoutEffect(() => {
    const anchor = focalAnchorRef.current;
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    if (anchor) {
      const targetEl = canvas.querySelector<HTMLElement>(anchor.selector);
      if (targetEl) {
        const newRect = targetEl.getBoundingClientRect();
        const currentOffset = newRect.left - anchor.clientX;
        const delta = currentOffset - anchor.offset;
        if (Math.abs(delta) > 0.5) {
          canvas.scrollLeft += delta;
        }
      }
      focalAnchorRef.current = null;
    }

    // Keep vertical scroll centered on the canon spine across zoom changes
    const maxScrollY = canvas.scrollHeight - canvas.clientHeight;
    if (maxScrollY > 0) {
      canvas.scrollTop = maxScrollY / 2;
    }
  }, [desktopZoom, contentBaseWidth]);

  // Measure base unscaled width of sequence content for transform envelope
  useEffect(() => {
    const el = contentLayerRef.current;
    if (!el) return;

    const measure = () => {
      if (el) {
        const sw = el.scrollWidth;
        setContentBaseWidth((prev) => (Math.abs(prev - sw) > 1 ? sw : prev));
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, [eras, events, zoomLevel, showIfBranches]);

  // Keep vertical scroll centered on the canon stem on mount and when toggling branches
  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;
    const timer = setTimeout(() => {
      const maxScrollY = canvas.scrollHeight - canvas.clientHeight;
      if (maxScrollY > 0) {
        canvas.scrollTop = maxScrollY / 2;
      }
      updateScrollMetrics();
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedIfSlugs]);

  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;
    const timer = setTimeout(() => {
      const maxScrollY = canvas.scrollHeight - canvas.clientHeight;
      if (maxScrollY > 0) {
        canvas.scrollTop = maxScrollY / 2;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

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

  // Mobile timeline: events filtered by zoomLevel tier, Topic & Search
  const mobileFilteredEvents = useMemo(() => {
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

  // Mobile events grouped by Era
  const mobileEventsByEra = useMemo(() => {
    const map: Record<string, TimelineEvent[]> = {};
    for (const era of eras) {
      map[era.id] = [];
    }
    for (const event of mobileFilteredEvents) {
      if (!map[event.eraId]) map[event.eraId] = [];
      map[event.eraId].push(event);
    }
    return map;
  }, [eras, mobileFilteredEvents]);

  // Desktop timeline: all events matching Topic & Search query; all importance tiers are physically rendered on the stem
  const desktopFilteredEvents = useMemo(() => {
    return events.filter((e) => {
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
  }, [events, topicFilter, searchQuery]);

  // Desktop events grouped by Era
  const desktopEventsByEra = useMemo(() => {
    const map: Record<string, TimelineEvent[]> = {};
    for (const era of eras) {
      map[era.id] = [];
    }
    for (const event of desktopFilteredEvents) {
      if (!map[event.eraId]) map[event.eraId] = [];
      map[event.eraId].push(event);
    }
    return map;
  }, [eras, desktopFilteredEvents]);

  // Backwards-compatible aliases
  const filteredEvents = mobileFilteredEvents;
  const eventsByEra = mobileEventsByEra;

  // Mobile active era
  const currentMobileEra = useMemo(() => {
    return eras.find((e) => e.id === activeEraId) || eras[0];
  }, [eras, activeEraId]);

  const activeMobileEraIndex = useMemo(() => {
    return eras.findIndex((e) => e.id === activeEraId);
  }, [eras, activeEraId]);

  // Unified index of all events: canon events, IF divergence gateways, and IF milestone events
  const allEventsById = useMemo(() => {
    const map = new Map<string, TimelineEvent>();
    // 1. Canon events
    for (const ev of events) {
      map.set(ev.id, ev);
    }
    // 2. IF routes: divergence gateways and milestone events
    for (const route of ifRoutes) {
      const parentCanonEvt = events.find((e) => e.id === route.divergesFromEventId);
      const eraId = parentCanonEvt ? parentCanonEvt.eraId : "modern-era";

      // Register gateway card as interactive event record
      const gatewayId = `gateway-${route.slug}`;
      map.set(gatewayId, {
        id: gatewayId,
        eraId,
        name: `${route.name}: ${route.headline}`,
        approxStartDate: route.approxDate,
        location: route.divergencePoint,
        characters: [],
        topic: `${route.name} Gateway`,
        importance: 5,
        description: route.divergenceSummary
          ? `${route.description}\n\nPoint of Divergence Summary:\n${route.divergenceSummary}`
          : route.description,
        image: route.image,
        source: {
          title: `Read ${route.name} (${route.kanjiTitle}) Story Route`,
          url: route.href,
        },
      });

      // Register all milestone events of this IF route
      if (route.events) {
        for (const ifEv of route.events) {
          map.set(ifEv.id, {
            id: ifEv.id,
            eraId,
            name: ifEv.name,
            approxStartDate: ifEv.approxStartDate,
            duration: ifEv.duration,
            location: ifEv.location,
            characters: ifEv.characters || [],
            topic: route.name,
            importance: ifEv.importance ?? 2,
            description: ifEv.description,
            image: ifEv.image,
            source: {
              title: `${route.name} (${route.kanjiTitle}) Route`,
              url: route.href,
            },
          });
        }
      }
    }
    return map;
  }, [events, ifRoutes]);

  // Map event ID to its parent IF Route (for both gateways and milestone events)
  const ifRouteByEventId = useMemo(() => {
    const map = new Map<string, TimelineIfRoute>();
    for (const route of ifRoutes) {
      map.set(`gateway-${route.slug}`, route);
      if (route.events) {
        for (const ev of route.events) {
          map.set(ev.id, route);
        }
      }
    }
    return map;
  }, [ifRoutes]);

  const selectedIfRoute = useMemo(() => {
    if (!selectedEvent) return null;
    return ifRouteByEventId.get(selectedEvent.id) || null;
  }, [selectedEvent, ifRouteByEventId]);

  const selectedDivergenceEvent = useMemo(() => {
    if (!selectedIfRoute) return null;
    return events.find((e) => e.id === selectedIfRoute.divergesFromEventId) || null;
  }, [selectedIfRoute, events]);

  const selectedIfTheme = useMemo(() => {
    if (!selectedIfRoute) return null;
    return IF_ROUTE_THEMES[selectedIfRoute.slug] || null;
  }, [selectedIfRoute]);

  // Sequenced list of events for the currently selected IF route (Gateway + Milestones)
  const currentIfRouteEvents = useMemo(() => {
    if (!selectedIfRoute) return [];
    const list: TimelineEvent[] = [];
    const gw = allEventsById.get(`gateway-${selectedIfRoute.slug}`);
    if (gw) list.push(gw);
    if (selectedIfRoute.events) {
      for (const ifEv of selectedIfRoute.events) {
        const item = allEventsById.get(ifEv.id);
        if (item) list.push(item);
      }
    }
    return list;
  }, [selectedIfRoute, allEventsById]);

  // Context-aware events list for modal previous/next navigation
  const modalEventsList = useMemo(() => {
    if (selectedIfRoute) {
      return currentIfRouteEvents;
    }
    return desktopFilteredEvents;
  }, [selectedIfRoute, currentIfRouteEvents, desktopFilteredEvents]);

  const currentModalIndex = useMemo(() => {
    if (!selectedEvent) return -1;
    return modalEventsList.findIndex((e) => e.id === selectedEvent.id);
  }, [selectedEvent, modalEventsList]);

  const selectedEventEra = useMemo(() => {
    if (!selectedEvent) return null;
    return eras.find((e) => e.id === selectedEvent.eraId) || null;
  }, [selectedEvent, eras]);

  // Click handler that ignores accidental clicks when dragging
  const handleCardClick = (event: TimelineEvent) => {
    if (hasMovedRef.current || isDraggingRef.current) return;
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  // Snap to that era starting on desktop without flashing intermediate tabs, preserving zoom
  const scrollToEra = (eraId: string) => {
    targetEraIdRef.current = eraId;
    setActiveEraId(eraId);
    isProgrammaticScrollRef.current = true;

    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    scrollDebounceTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      targetEraIdRef.current = null;
    }, 600);

    const targetElement = eraRefs.current[eraId];
    const canvas = desktopCanvasRef.current;
    if (targetElement && canvas) {
      // Calculate exact scaled horizontal offset of this era's starting gateway card
      const targetLeft = Math.max(0, Math.round(targetElement.offsetLeft * desktopZoom) - 24);
      // Center vertically along the central canon spine
      const targetTop = Math.max(0, Math.round((canvas.scrollHeight - canvas.clientHeight) / 2));
      canvas.scrollTo({
        left: targetLeft,
        top: targetTop,
        behavior: "smooth",
      });
      updateScrollMetrics();
    }
  };

  // Smooth scroll to an IF Route divergence in desktop canvas
  const jumpToIfRoute = (slug: string) => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;
    if (!selectedIfSlugs.includes(slug)) {
      setSelectedIfSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
    }
    const route = ifRoutes.find((r) => r.slug === slug);
    if (!route) return;

    isProgrammaticScrollRef.current = true;
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    scrollDebounceTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);

    const performScroll = () => {
      const el =
        canvas.querySelector<HTMLElement>(`[data-if-gateway="${slug}"]`) ||
        canvas.querySelector<HTMLElement>(`[data-event-id="${route.divergesFromEventId}"]`);
      if (el) {
        const canvasRect = canvas.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetScrollLeft =
          canvas.scrollLeft + (elRect.left - canvasRect.left) - canvasRect.width / 2 + elRect.width / 2;
        const targetScrollTop =
          canvas.scrollTop + (elRect.top - canvasRect.top) - canvasRect.height / 2 + elRect.height / 2;
        canvas.scrollTo({
          left: Math.max(0, targetScrollLeft),
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
        updateScrollMetrics();
        return true;
      }
      return false;
    };

    if (!performScroll()) {
      setTimeout(performScroll, 80);
      setTimeout(performScroll, 200);
    }
  };

  // Smooth scroll to a specific Event ID
  const scrollToEvent = (eventId: string) => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;
    const targetElement = canvas.querySelector<HTMLElement>(`[data-event-id="${eventId}"]`);
    if (targetElement) {
      const canvasRect = canvas.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollOffset =
        canvas.scrollLeft + (targetRect.left - canvasRect.left) - canvasRect.width / 2 + targetRect.width / 2;
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
  // Supports both Left-Click (0) and Middle-Click (1) drag panning
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only track touch pointers (from actual touchscreens) for multi-touch pinch-to-zoom
    // Trackpads and mice are indirect pointer streams that must not be counted here
    if (e.pointerType === "touch") {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

      // Two-finger touchscreen pinch detected: cancel any single-pointer drag/click and begin pinch-zoom
      if (activePointersRef.current.size >= 2) {
        const canvas = desktopCanvasRef.current;
        if (canvas && canvas.hasPointerCapture(e.pointerId)) {
          try { canvas.releasePointerCapture(e.pointerId); } catch {}
        }
        isPointerDownRef.current = false;
        isDraggingRef.current = false;
        pressedEventRef.current = null;
        hasMovedRef.current = true;

        const pts = Array.from(activePointersRef.current.values());
        const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        const midX = (pts[0].clientX + pts[1].clientX) / 2;
        pinchStartRef.current = { dist: Math.max(1, dist), zoom: desktopZoomRef.current, midX };
        focalAnchorRef.current = findAnchorAtX(midX);
        return;
      }
    }

    if (e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) {
      e.preventDefault();
    }
    const target = e.target as HTMLElement;
    // Don't intercept clicks on interactive controls like buttons, links, inputs, selects, or minimap
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest(".minimap-widget")
    ) {
      return;
    }
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    // Detect if pointer pressed down on an event card or IF route gateway
    const cardEl = target.closest(".timeline-card, [data-if-gateway]") as HTMLElement | null;
    const eventId = cardEl?.getAttribute("data-event-id");
    const gatewaySlug = cardEl?.getAttribute("data-if-gateway");
    if (eventId) {
      pressedEventRef.current = allEventsById.get(eventId) || null;
    } else if (gatewaySlug) {
      pressedEventRef.current = allEventsById.get(`gateway-${gatewaySlug}`) || null;
    } else {
      pressedEventRef.current = null;
    }

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    dragDistanceRef.current = 0;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    scrollLeftRef.current = canvas.scrollLeft;
    scrollTopRef.current = canvas.scrollTop;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Two-finger touchscreen pinch-to-zoom active
    if (e.pointerType === "touch" && activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

      if (activePointersRef.current.size >= 2 && pinchStartRef.current) {
        e.preventDefault();
        const pts = Array.from(activePointersRef.current.values());
        const currentDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        const { dist: startDist, zoom: startZoom, midX } = pinchStartRef.current;

        if (startDist > 0) {
          const scale = currentDist / startDist;
          const nextZoom = Math.min(1.25, Math.max(0.10, Number((startZoom * scale).toFixed(3))));
          const anchor = findAnchorAtX(midX);
          if (anchor) {
            focalAnchorRef.current = anchor;
          }
          setDesktopZoom((prev) => (Math.abs(prev - nextZoom) < 0.001 ? prev : nextZoom));
        }
        return;
      }
    }

    if (!isPointerDownRef.current) return;
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    dragDistanceRef.current = Math.max(Math.abs(dx), Math.abs(dy));

    // Immediately start dragging as soon as mouse moves >= 4px in any direction
    if (!isDraggingRef.current && (Math.abs(dx) >= 4 || Math.abs(dy) >= 4)) {
      isDraggingRef.current = true;
      hasMovedRef.current = true;
      pressedEventRef.current = null; // Dragged, cancel card click!
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      canvas.scrollLeft = scrollLeftRef.current - dx;
      canvas.scrollTop = scrollTopRef.current - dy;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        pinchStartRef.current = null;
      }
    }

    if (!isPointerDownRef.current) return;

    const canvas = desktopCanvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const wasDragging = isDraggingRef.current;
    const clickedEvent = pressedEventRef.current;

    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    pressedEventRef.current = null;

    if (!wasDragging && clickedEvent && dragDistanceRef.current < 4 && e.button === 0) {
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

  // Radar / Minimap scrubbing interactions
  const handleMinimapInteraction = (clientX: number, clientY: number) => {
    const canvas = desktopCanvasRef.current;
    const track = minimapTrackRef.current;
    if (!canvas || !track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const ratioX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ratioY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const maxScrollLeft = canvas.scrollWidth - canvas.clientWidth;
    const maxScrollTop = canvas.scrollHeight - canvas.clientHeight;

    canvas.scrollLeft = ratioX * maxScrollLeft;
    if (maxScrollTop > 0) {
      canvas.scrollTop = ratioY * maxScrollTop;
    }
    updateScrollMetrics();
  };

  const handleMinimapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isMinimapScrubbingRef.current = true;
    handleMinimapInteraction(e.clientX, e.clientY);
  };

  const handleMinimapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMinimapScrubbingRef.current) return;
    handleMinimapInteraction(e.clientX, e.clientY);
  };

  const handleMinimapPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    isMinimapScrubbingRef.current = false;
  };

  // Update active era on natural scroll (skipped during programmatic scrollToEra or active pointer dragging)
  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    const handleScroll = () => {
      updateScrollMetrics();

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
      updateScrollMetrics();
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

  // Step-based or direct-value zoom changer with canvas center focal anchoring
  const handleZoomStep = (direction: "in" | "out" | "reset" | "fit", targetScale?: number) => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    if (direction === "fit") {
      const availableWidth = canvas.clientWidth - 64;
      const fitScale = contentBaseWidth > 0
        ? Math.min(1.0, Math.max(0.10, Number((availableWidth / contentBaseWidth).toFixed(3))))
        : 0.16;
      focalAnchorRef.current = null;
      setDesktopZoom(fitScale);
      requestAnimationFrame(() => {
        if (desktopCanvasRef.current) {
          desktopCanvasRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
          });
          updateScrollMetrics();
        }
      });
      return;
    }

    // Anchor to the center of the visible viewport for toolbar / button zoom
    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.left + canvasRect.width / 2;
    const anchor = findAnchorAtX(centerX);
    if (anchor) {
      focalAnchorRef.current = anchor;
    }

    setDesktopZoom((prevZoom) => {
      let nextZoom = prevZoom;
      if (targetScale !== undefined) {
        nextZoom = Math.min(1.25, Math.max(0.10, Number(targetScale.toFixed(2))));
      } else if (direction === "in") {
        nextZoom = Math.min(1.25, Number((prevZoom + 0.15).toFixed(2)));
      } else if (direction === "out") {
        nextZoom = Math.max(0.10, Number((prevZoom - 0.15).toFixed(2)));
      } else if (direction === "reset") {
        nextZoom = 1.0;
      }
      return nextZoom === prevZoom ? prevZoom : nextZoom;
    });
  };

  // Touchpad pinch-to-zoom and mouse wheel listener (smooth horizontal pan + Ctrl pinch)
  useEffect(() => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) return;

    let wheelRafId: number | null = null;
    let accumulatedDeltaY = 0;
    let lastClientX = 0;

    // Continuously maintain last pointer position for accurate focal zooming
    const handleGlobalPointerMove = (e: PointerEvent) => {
      lastClientX = e.clientX;
    };
    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });

    const handleWheel = (e: WheelEvent) => {
      const canvas = desktopCanvasRef.current;
      if (!canvas) return;

      // Touchpad pinch or Ctrl / Cmd + Mouse Wheel
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        let delta = e.deltaY;
        if (e.deltaMode === 1) { // Line delta
          delta *= 24;
        } else if (e.deltaMode === 2) { // Page delta
          delta *= 400;
        }

        accumulatedDeltaY += delta;
        if (e.clientX > 0) {
          lastClientX = e.clientX;
        }

        if (wheelRafId === null) {
          wheelRafId = requestAnimationFrame(() => {
            wheelRafId = null;
            const deltaY = accumulatedDeltaY;
            accumulatedDeltaY = 0;

            const canvasRect = canvas.getBoundingClientRect();
            const isOverCanvas = lastClientX >= canvasRect.left && lastClientX <= canvasRect.right;
            const targetX = isOverCanvas && lastClientX > 0 ? lastClientX : (canvasRect.left + canvasRect.width / 2);

            const anchor = findAnchorAtX(targetX);
            if (anchor) {
              focalAnchorRef.current = anchor;
            }

            const zoomFactor = Math.exp(-deltaY * 0.0035);
            setDesktopZoom((prevZoom) => {
              const nextZoom = Math.min(1.25, Math.max(0.10, Number((prevZoom * zoomFactor).toFixed(3))));
              return Math.abs(nextZoom - prevZoom) < 0.001 ? prevZoom : nextZoom;
            });
          });
        }
        return;
      }

      // Check if scroll is intended for the canvas
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-timeline-canvas]")) {
        return;
      }

      // Shift + Mouse Wheel: horizontal movement inside canvas
      if (e.shiftKey) {
        e.preventDefault();
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        canvas.scrollLeft += delta;
        return;
      }

      // Trackpad horizontal swipe or mouse tilt wheel
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        canvas.scrollLeft += e.deltaX;
        return;
      }

      // Standard vertical mouse wheel: vertical movement inside canvas
      if (Math.abs(e.deltaY) > 0) {
        const canScrollVertically = canvas.scrollHeight > canvas.clientHeight;
        if (canScrollVertically) {
          e.preventDefault();
          canvas.scrollTop += e.deltaY;
        }
      }
    };

    // Native Tauri GTK gesture listener (Linux Wayland / X11 WebKitGTK continuous pinch zoom)
    let isTauriGestureActive = false;
    let tauriGestureStartZoom = desktopZoomRef.current;

    const handleTauriPinchStart = (e: Event) => {
      isTauriGestureActive = true;
      tauriGestureStartZoom = desktopZoomRef.current;
      const ce = e as CustomEvent<{ x?: number | null; y?: number | null }>;
      const canvas = desktopCanvasRef.current;
      if (canvas) {
        const clientX = typeof ce.detail?.x === "number" && ce.detail.x > 0
          ? ce.detail.x
          : (canvas.getBoundingClientRect().left + canvas.clientWidth / 2);
        const anchor = findAnchorAtX(clientX);
        if (anchor) focalAnchorRef.current = anchor;
      }
    };

    const handleTauriPinchChange = (e: Event) => {
      const ce = e as CustomEvent<{ scale?: number; x?: number | null; y?: number | null; isLevelDelta?: boolean }>;
      const scale = typeof ce.detail?.scale === "number" && ce.detail.scale > 0 ? ce.detail.scale : 1;
      const canvas = desktopCanvasRef.current;
      if (canvas && typeof ce.detail?.x === "number" && ce.detail.x > 0) {
        const anchor = findAnchorAtX(ce.detail.x);
        if (anchor) focalAnchorRef.current = anchor;
      }

      if (ce.detail?.isLevelDelta) {
        setDesktopZoom((prev) => {
          const nextZoom = Math.min(1.25, Math.max(0.10, Number((prev * scale).toFixed(3))));
          return Math.abs(prev - nextZoom) < 0.001 ? prev : nextZoom;
        });
        return;
      }

      if (!isTauriGestureActive) {
        isTauriGestureActive = true;
        tauriGestureStartZoom = desktopZoomRef.current;
      }
      const nextZoom = Math.min(1.25, Math.max(0.10, Number((tauriGestureStartZoom * scale).toFixed(3))));
      setDesktopZoom((prev) => (Math.abs(prev - nextZoom) < 0.001 ? prev : nextZoom));
    };

    const handleTauriPinchEnd = () => {
      isTauriGestureActive = false;
      focalAnchorRef.current = null;
    };

    // WebKit Gesture Events (Safari & WebKitGTK trackpad pinch gestures)
    let gestureStartZoom = desktopZoomRef.current;
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      gestureStartZoom = desktopZoomRef.current;
      const ge = e as unknown as { clientX?: number };
      const clientX = ge.clientX ?? (canvas.getBoundingClientRect().left + canvas.clientWidth / 2);
      const anchor = findAnchorAtX(clientX);
      if (anchor) focalAnchorRef.current = anchor;
    };

    const handleGestureChange = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const ge = e as unknown as { scale?: number };
      const scale = typeof ge.scale === "number" ? ge.scale : 1;
      const nextZoom = Math.min(1.25, Math.max(0.10, Number((gestureStartZoom * scale).toFixed(3))));
      setDesktopZoom((prev) => (Math.abs(prev - nextZoom) < 0.001 ? prev : nextZoom));
    };

    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Native Touch events for multi-touch touchscreens/trackpads with passive: false to cancel native webview zoom
    let touchStartDist = 0;
    let touchStartZoom = desktopZoomRef.current;
    let touchMidX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartZoom = desktopZoomRef.current;
        touchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const anchor = findAnchorAtX(touchMidX);
        if (anchor) focalAnchorRef.current = anchor;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = dist / touchStartDist;
        const nextZoom = Math.min(1.25, Math.max(0.10, Number((touchStartZoom * scale).toFixed(3))));
        const anchor = findAnchorAtX(touchMidX);
        if (anchor) focalAnchorRef.current = anchor;
        setDesktopZoom((prev) => (Math.abs(prev - nextZoom) < 0.001 ? prev : nextZoom));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("tauri-pinch-zoom-start", handleTauriPinchStart);
    window.addEventListener("tauri-pinch-zoom-change", handleTauriPinchChange);
    window.addEventListener("tauri-pinch-zoom-end", handleTauriPinchEnd);
    window.addEventListener("gesturestart", handleGestureStart as EventListener, { passive: false });
    window.addEventListener("gesturechange", handleGestureChange as EventListener, { passive: false });
    window.addEventListener("gestureend", handleGestureEnd as EventListener, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      if (wheelRafId !== null) cancelAnimationFrame(wheelRafId);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("tauri-pinch-zoom-start", handleTauriPinchStart);
      window.removeEventListener("tauri-pinch-zoom-change", handleTauriPinchChange);
      window.removeEventListener("tauri-pinch-zoom-end", handleTauriPinchEnd);
      window.removeEventListener("gesturestart", handleGestureStart as EventListener);
      window.removeEventListener("gesturechange", handleGestureChange as EventListener);
      window.removeEventListener("gestureend", handleGestureEnd as EventListener);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Keyboard navigation (Escape to close modals, arrows for pan/events, hotkeys for zoom/help)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or textareas
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      // Controls Modal shortcuts
      if (isControlsModalOpen) {
        if (e.key === "Escape") {
          setIsControlsModalOpen(false);
          return;
        }
      }

      // Event Details Modal shortcuts
      if (selectedEvent) {
        if (e.key === "Escape") {
          setSelectedEvent(null);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        } else if (e.key === "ArrowLeft") {
          const idx = modalEventsList.findIndex((ev) => ev.id === selectedEvent.id);
          if (idx > 0) {
            setSelectedEvent(modalEventsList[idx - 1]);
          }
        } else if (e.key === "ArrowRight") {
          const idx = modalEventsList.findIndex((ev) => ev.id === selectedEvent.id);
          if (idx >= 0 && idx < modalEventsList.length - 1) {
            setSelectedEvent(modalEventsList[idx + 1]);
          }
        }
        return;
      }

      // Global hotkeys when no modal is open
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsControlsModalOpen((prev) => !prev);
        return;
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomStep("in");
        return;
      }

      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomStep("out");
        return;
      }

      if (e.key === "0") {
        e.preventDefault();
        handleZoomStep("reset", 1.0);
        return;
      }

      if (e.key === "ArrowLeft") {
        panTimeline("left");
      } else if (e.key === "ArrowRight") {
        panTimeline("right");
      } else if (e.key === "ArrowUp") {
        const c = desktopCanvasRef.current;
        if (c) {
          c.scrollBy({ top: -140, behavior: "smooth" });
          updateScrollMetrics();
        }
      } else if (e.key === "ArrowDown") {
        const c = desktopCanvasRef.current;
        if (c) {
          c.scrollBy({ top: 140, behavior: "smooth" });
          updateScrollMetrics();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, modalEventsList, isControlsModalOpen, handleZoomStep]);

  // Handle URL hash on mount and hashchange for deep-linking
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;

      // If matches an IF route slug directly
      const matchedRoute = ifRoutes.find((r) => r.slug === hash);
      if (matchedRoute) {
        setSelectedIfSlug(hash);
        setSelectedIfSlugs((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
        setTimeout(() => {
          jumpToIfRoute(hash);
        }, 250);
        return;
      }

      // If matches an event ID (canon event, IF milestone, or IF gateway)
      const matchedEvt = allEventsById.get(hash);
      if (matchedEvt) {
        const parentRoute = ifRouteByEventId.get(hash);
        if (parentRoute) {
          setSelectedIfSlugs((prev) => (prev.includes(parentRoute.slug) ? prev : [...prev, parentRoute.slug]));
        }
        setSelectedEvent(matchedEvt);
        setTimeout(() => {
          scrollToEvent(hash);
        }, 250);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [ifRoutes, events, allEventsById, ifRouteByEventId]);

  // Synchronize URL hash when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      window.history.replaceState(null, "", `#${selectedEvent.id}`);
    }
  }, [selectedEvent]);

  // Close IF dropdown on click outside
  useEffect(() => {
    if (!isIfDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ifDropdownRef.current && !ifDropdownRef.current.contains(e.target as Node)) {
        setIsIfDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isIfDropdownOpen]);

  // Distinct vertical track offsets for divergent IF routes:
  // Monotonically decreasing levels for sequential branches guarantee zero intersecting feeder lines:
  // UP Branches:
  // Level 4: School IF (Prologue) - outermost UP track
  // Level 3: Wrath IF (Arc 2 Manor)
  // Level 2: Sloth IF (Arc 3 Whale)
  // Level 1: Greed IF (Arc 4 Sanctuary) & Azamuku IF (Arc 7 Vollachia) - innermost UP track
  // DOWN Branches:
  // Level 3: Pride IF (Arc 1 Slums) - outermost DOWN track
  // Exact track offsets engineered for:
  // 1. Guaranteed clearance from canon cards (which span +/- 150px)
  // 2. 68px guaranteed clearance between adjacent IF tracks (320px separation - 252px card height)
  // 3. Strict 1:1 row assignment - ZERO shared tracks (guaranteed no card clashing across all 9 IF routes)
  // 4. Monotonic ordering: outer tracks diverge first, inner tracks diverge later (0 spline crossings)
  const getIfRouteTrackOffset = (slug: string): number => {
    switch (slug) {
      // UP Tracks (y < 0) - Each route has its own strictly unique row
      case "if-vainglory": // Arc 1 Divergence (Prologue) -> Level 4 (Outer Sky)
        return -1280;
      case "if-wrath": // Arc 2 Divergence (Roswaal Manor) -> Level 3 (Upper)
        return -960;
      case "if-sloth": // Arc 3 Divergence (White Whale) -> Level 2 (Mid Upper)
        return -640;
      case "if-greed": // Arc 4 Divergence (Sanctuary) -> Level 1 (Near Upper)
        return -320;

      // DOWN Tracks (y > 0) - Each route has its own strictly unique row
      case "if-azamuku": // Arc 7 Divergence (Vollachia) -> Level 1 (Near Lower)
        return 320;
      case "if-gluttony": // Arc 6 Divergence (Watchtower) -> Level 2 (Mid Lower)
        return 640;
      case "if-melancholy": // Arc 3 Divergence (Aganau / Petelgeuse) -> Level 3 (Lower)
        return 960;
      case "if-lust": // Arc 3 Divergence (Royal Selection) -> Level 4 (Deep Lower)
        return 1280;
      case "if-pride": // Arc 1 Divergence (Loot House) -> Level 5 (Outermost Abyss)
        return 1600;

      default:
        return 320;
    }
  };

  // Shared helper to render any timeline event card (Canon or IF alternate timeline)
  // Ensures 100% visual parity across all cards with identical styling, images, and progressive LOD
  const renderTimelineEventCard = (
    event: TimelineEvent | TimelineIfEvent,
    stage: EventVisualStage,
    dims: { width: number; height: number; connectorWidth: number },
    onClick: () => void,
    isIfEvent?: boolean,
    ifRouteName?: string,
    ifRouteSlug?: string
  ) => {
    const chars = event.characters || [];
    const importance = event.importance ?? 2;
    const ifTheme = ifRouteSlug ? IF_ROUTE_THEMES[ifRouteSlug] : null;
    const divergentBranch = !isIfEvent ? ifBranchesByEventId[event.id] : null;
    const isDivergentVisible = divergentBranch && selectedIfSlugs.includes(divergentBranch.slug);
    const divergentTheme = isDivergentVisible ? IF_ROUTE_THEMES[divergentBranch.slug] : null;

    return (
      <div
        data-event-id={event.id}
        onClick={onClick}
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          contentVisibility: stage === "full" || stage === "compact" ? "auto" : "visible",
          containIntrinsicSize: `${dims.width}px ${dims.height}px`,
          borderColor: ifTheme ? ifTheme.border : undefined,
          transition:
            "width 320ms cubic-bezier(0.16, 1, 0.3, 1), height 320ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 300ms ease",
        }}
        className={`timeline-card relative cursor-pointer select-none group shrink-0 ${
          stage === "dot"
            ? `overflow-visible rounded-full border-2 ${
                isIfEvent ? "border-[var(--accent)]" : "border-[var(--border-strong)]"
              } bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:scale-125 shadow-xs flex items-center justify-center`
            : stage === "pin"
              ? `overflow-hidden rounded-xl border ${
                  isIfEvent ? "border-[var(--accent)]/50" : "border-[var(--border-subtle)]"
                } bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:shadow-md shadow-2xs flex items-center px-3 gap-2.5`
              : `overflow-hidden rounded-2xl border ${
                  isIfEvent
                    ? "border-[var(--accent)]/60 hover:border-[var(--accent)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--accent)]"
                } hover:shadow-md shadow-xs`
        }`}
        title={
          stage === "dot"
            ? `${event.name} (${event.approxStartDate}) - Tier ${importance} - Click for details`
            : undefined
        }
      >
        {/* STAGE: DOT */}
        {stage === "dot" && (
          <>
            <span
              style={{
                backgroundColor: ifTheme ? ifTheme.color : "var(--accent)",
              }}
              className={`w-2.5 h-2.5 rounded-full ${
                isIfEvent ? "animate-pulse" : ""
              } shrink-0 group-hover:scale-125 transition-transform`}
            />

            {divergentTheme && (
              <span
                className="absolute -inset-1 rounded-full animate-ping pointer-events-none opacity-40"
                style={{ backgroundColor: divergentTheme.color }}
              />
            )}

            {/* Hover Tooltip */}
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-40 whitespace-nowrap px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-md text-[11px] font-mono text-[var(--text-main)] flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: ifTheme ? ifTheme.color : "var(--accent)" }}
              />
              <span
                className="font-bold"
                style={{ color: ifTheme ? ifTheme.color : "var(--accent)" }}
              >
                {event.approxStartDate}
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="font-medium max-w-[200px] truncate">{event.name}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                T{importance}
              </span>
            </div>
          </>
        )}

        {/* STAGE: PIN */}
        {stage === "pin" && (
          <div className="flex items-center gap-2.5 w-full min-w-0 pr-1 pointer-events-none">
            <span
              style={{
                backgroundColor: ifTheme ? ifTheme.color : "var(--accent)",
              }}
              className="w-2 h-2 rounded-full shrink-0 ring-2 ring-[var(--accent)]/20"
            />
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span
                  style={{ color: ifTheme ? ifTheme.color : "var(--accent)" }}
                  className="text-[10px] font-mono font-bold"
                >
                  {event.approxStartDate}
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)] truncate">
                  • Tier {importance} {ifRouteName ? `(${ifRouteName})` : ""}
                </span>
                {isDivergentVisible && divergentBranch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToIfRoute(divergentBranch.slug);
                    }}
                    style={{
                      borderColor: divergentTheme?.border,
                      color: divergentTheme?.color,
                      background: divergentTheme?.bg,
                    }}
                    className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border inline-flex items-center gap-1 shrink-0 cursor-pointer hover:brightness-110 transition-all pointer-events-auto"
                    title={`Jump to ${divergentBranch.name} gateway`}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ background: divergentTheme?.color }} />
                    <span>Branch: {divergentBranch.name}</span>
                  </button>
                )}
              </div>
              <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors truncate mt-0.5">
                {event.name}
              </h3>
            </div>
          </div>
        )}

        {/* STAGE: COMPACT */}
        {stage === "compact" && (
          <>
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
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
              </div>
            )}

            <div className="relative z-10 p-3.5 flex flex-col justify-between h-full max-w-[72%] space-y-1 pointer-events-none">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)]">
                  {event.approxStartDate}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                  Tier {importance}
                </span>
                {ifRouteName && (
                  <span
                    style={{
                      borderColor: ifTheme?.border,
                      color: ifTheme?.color,
                      background: ifTheme?.bg,
                    }}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
                  >
                    {ifRouteName}
                  </span>
                )}
                {isDivergentVisible && divergentBranch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToIfRoute(divergentBranch.slug);
                    }}
                    style={{
                      borderColor: divergentTheme?.border,
                      color: divergentTheme?.color,
                      background: divergentTheme?.bg,
                    }}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border inline-flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer hover:brightness-110 transition-all pointer-events-auto"
                    title={`Alternate timeline branches into ${divergentBranch.name} from this point. Click to jump.`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: divergentTheme?.color }} />
                    <span>Branch: {divergentBranch.name}</span>
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                  {event.name}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 flex items-center gap-1 mt-0.5">
                  <span
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: ifTheme ? ifTheme.color : "var(--accent)" }}
                  />
                  <span>{event.location}</span>
                </p>
              </div>

              <div
                style={{ color: ifTheme ? ifTheme.color : "var(--accent)" }}
                className="text-[10px] font-mono font-semibold flex items-center gap-1"
              >
                <span>Details</span>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </>
        )}

        {/* STAGE: FULL */}
        {stage === "full" && (
          <>
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
                <div
                  className="absolute right-5 top-1/2 -translate-y-1/2 opacity-10 font-mono text-8xl font-black select-none"
                  style={{ color: ifTheme ? ifTheme.color : "var(--accent)" }}
                >
                  {isIfEvent ? "Ψ" : "Ω"}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
              </div>
            )}

            <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none">
              <span
                style={{ backgroundColor: ifTheme ? ifTheme.color : "var(--accent)" }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full text-white shadow-sm inline-flex items-center gap-1"
              >
                <span>Details</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            <div className="relative z-10 p-5 flex flex-col justify-between h-full max-w-[70%] space-y-2 pointer-events-none">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] shadow-2xs">
                    {event.approxStartDate}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                    Tier {importance}
                  </span>
                  {ifRouteName && (
                    <span
                      style={{
                        borderColor: ifTheme?.border,
                        color: ifTheme?.color,
                        background: ifTheme?.bg,
                      }}
                      className="px-2 py-0.5 rounded-md text-xs font-mono font-bold border"
                    >
                      {ifRouteName}
                    </span>
                  )}
                  {isDivergentVisible && divergentBranch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        jumpToIfRoute(divergentBranch.slug);
                      }}
                      style={{
                        borderColor: divergentTheme?.border,
                        color: divergentTheme?.color,
                        background: divergentTheme?.bg,
                      }}
                      className="px-2 py-0.5 rounded-md text-xs font-mono font-bold border inline-flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer hover:brightness-110 transition-all pointer-events-auto"
                      title={`Alternate timeline branches into ${divergentBranch.name} from this point. Click to jump.`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: divergentTheme?.color }} />
                      <span>Branch: {divergentBranch.name}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                    {event.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ifTheme ? ifTheme.color : "var(--accent)" }}
                    />
                    <span>{event.location}</span>
                  </p>
                </div>

                <p className="text-xs text-[var(--text-muted)] line-clamp-2 sm:line-clamp-3 leading-relaxed font-prose">
                  {event.description}
                </p>

                {chars.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {chars.slice(0, 3).map((char) => (
                      <span
                        key={char}
                        className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-[var(--bg-elevated)]/90 text-[var(--text-muted)] border border-[var(--border-subtle)]"
                      >
                        {char}
                      </span>
                    ))}
                    {chars.length > 3 && (
                      <span className="text-[10px] text-[var(--text-muted)] font-mono self-center">
                        +{chars.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Route Gateway card that starts the IF branch sequence with matching visual stage & branch theme
  const renderIfRouteGatewayCard = (
    branch: IfBranch,
    stage: EventVisualStage,
    dims: { width: number; height: number; connectorWidth: number }
  ) => {
    const theme = IF_ROUTE_THEMES[branch.slug] || {
      color: "var(--accent)",
      bg: "var(--accent-bg)",
      border: "var(--border-subtle)",
      shortReason: branch.divergencePoint,
    };

    if (stage === "dot") {
      return (
        <div
          data-if-gateway={branch.slug}
          data-event-id={`gateway-${branch.slug}`}
          onClick={() => {
            const evt = allEventsById.get(`gateway-${branch.slug}`);
            if (evt) handleCardClick(evt);
          }}
          title={`${branch.name} (${branch.kanjiTitle}) - ${branch.divergencePoint} - Click for gateway details`}
          style={{
            borderColor: theme.border,
          }}
          className="timeline-card cursor-pointer h-6 px-2.5 rounded-full border-2 border-dashed bg-[var(--bg-surface)] text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 shadow-xs whitespace-nowrap hover:scale-110 hover:border-[var(--accent)] transition-all"
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: theme.color }}
          />
          <span style={{ color: theme.color }}>{branch.name}</span>
        </div>
      );
    }

    if (stage === "pin") {
      return (
        <div
          data-if-gateway={branch.slug}
          data-event-id={`gateway-${branch.slug}`}
          onClick={() => {
            const evt = allEventsById.get(`gateway-${branch.slug}`);
            if (evt) handleCardClick(evt);
          }}
          style={{
            width: `${dims.width}px`,
            height: `${dims.height}px`,
            borderColor: theme.border,
          }}
          className="timeline-card cursor-pointer rounded-xl border border-dashed bg-[var(--bg-surface)] px-3 flex items-center justify-between shrink-0 shadow-2xs group hover:border-[var(--accent)] hover:shadow-xs transition-all"
        >
          <div className="flex items-center gap-2 min-w-0 mr-1">
            <span
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{ backgroundColor: theme.color }}
            />
            <span
              style={{ color: theme.color }}
              className="text-xs font-mono font-bold truncate"
            >
              {branch.name}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-normal shrink-0">
              ({branch.kanjiTitle})
            </span>
          </div>
          <span
            style={{
              borderColor: theme.border,
              color: theme.color,
              background: theme.bg,
            }}
            className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0"
          >
            {branch.divergencePoint}
          </span>
        </div>
      );
    }

    if (stage === "compact") {
      return (
        <div
          data-if-gateway={branch.slug}
          data-event-id={`gateway-${branch.slug}`}
          onClick={() => {
            const evt = allEventsById.get(`gateway-${branch.slug}`);
            if (evt) handleCardClick(evt);
          }}
          style={{
            width: `${dims.width}px`,
            height: `${dims.height}px`,
            borderColor: theme.border,
          }}
          className="timeline-card cursor-pointer rounded-2xl border-2 border-dashed bg-[var(--bg-surface)] p-3.5 relative overflow-hidden flex flex-col justify-between shrink-0 shadow-xs group hover:border-[var(--accent)] hover:shadow-md transition-all"
        >
          {branch.image && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img
                src={branch.image}
                alt={branch.name}
                className="w-full h-full object-cover opacity-15"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
            </div>
          )}
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <div
                style={{ color: theme.color }}
                className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider truncate"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: theme.color }}
                />
                <span className="truncate">{branch.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal shrink-0">
                  ({branch.kanjiTitle})
                </span>
              </div>
              <span
                style={{
                  borderColor: theme.border,
                  color: theme.color,
                  background: theme.bg,
                }}
                className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0"
              >
                {branch.divergencePoint}
              </span>
            </div>
            <h4 className="font-bold text-xs text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 leading-snug">
              {branch.headline}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-relaxed font-prose">
              {branch.description}
            </p>
          </div>
          <div className="relative z-10 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[9px] font-mono text-[var(--text-muted)]">
              {(branch.events || []).length} Milestones
            </span>
            <Link
              href={branch.href}
              onClick={(e) => e.stopPropagation()}
              style={{ color: theme.color }}
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold hover:underline"
            >
              <span>Read Story</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      );
    }

    // STAGE: FULL
    return (
      <div
        data-if-gateway={branch.slug}
        data-event-id={`gateway-${branch.slug}`}
        onClick={() => {
          const evt = allEventsById.get(`gateway-${branch.slug}`);
          if (evt) handleCardClick(evt);
        }}
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          borderColor: theme.border,
        }}
        className="timeline-card cursor-pointer rounded-2xl border-2 border-dashed bg-[var(--bg-surface)] p-5 relative overflow-hidden flex flex-col justify-between shrink-0 shadow-sm group hover:border-[var(--accent)] hover:shadow-md transition-all"
      >
        {branch.image && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src={branch.image}
              alt={branch.name}
              className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
          </div>
        )}
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div
              style={{ color: theme.color }}
              className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider truncate"
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: theme.color }}
              />
              <span className="truncate">{branch.name}</span>
              <span className="text-[11px] text-[var(--text-muted)] font-normal shrink-0">
                ({branch.kanjiTitle})
              </span>
            </div>
            <span
              style={{
                borderColor: theme.border,
                color: theme.color,
                background: theme.bg,
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold shrink-0"
            >
              {branch.divergencePoint}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Point of Divergence ({branch.approxDate})
            </span>
            <h4 className="font-bold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-snug">
              {branch.headline}
            </h4>
            <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed font-prose">
              {branch.description}
            </p>
          </div>

          {branch.divergenceSummary && (
            <p
              style={{ borderColor: theme.color }}
              className="text-[11px] text-[var(--text-muted)] italic border-l-2 pl-2 line-clamp-2"
            >
              &ldquo;{branch.divergenceSummary}&rdquo;
            </p>
          )}
        </div>

        <div className="relative z-10 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {(branch.events || []).length} Alternate Events
          </span>
          <Link
            href={branch.href}
            onClick={(e) => e.stopPropagation()}
            style={{ color: theme.color }}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold hover:underline"
          >
            <span>Read Story Route</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  };

  // Helper to render continuous divergent IF Story branch with events along upper and lower tracks
  const renderIfBranch = (
    branch: IfBranch,
    canonDims: { width: number; height: number; connectorWidth: number },
    canonWaveOffset: number = 0
  ) => {
    const gwStage = getEventVisualStage(2, desktopZoom);
    const gwDims = getStageDimensions(gwStage, 2);
    // Neutralize parent canon tree-wave offset so all IF tracks remain perfectly horizontal and parallel
    const dy = getIfRouteTrackOffset(branch.slug) - canonWaveOffset;
    const isUp = dy < 0;
    const theme = IF_ROUTE_THEMES[branch.slug] || {
      color: "var(--accent)",
      bg: "var(--accent-bg)",
      border: "var(--border-subtle)",
      shortReason: branch.divergencePoint,
    };

    // Start feeder from exact canon card border so it never cuts through card content or buttons
    const startX = Math.round(canonDims.connectorWidth + canonDims.width * 0.55);
    const startY = isUp ? -Math.round(canonDims.height / 2) : Math.round(canonDims.height / 2);
    const verticalDelta = Math.abs(dy - startY);

    // Feeder curves gracefully outward and to the right, clearing the canon card horizontally by ~90px
    const feederWidth = Math.max(120, Math.round(canonDims.width * 0.55 + 90));

    return (
      <div key={`branch-${branch.slug}`} className="contents pointer-events-auto">
        {/* Branch Feeder Stem (Curved Dashed Accent Spline from Canon Node Border into Alternate Track) */}
        <svg
          style={{
            position: "absolute",
            left: `${startX}px`,
            top: isUp ? `calc(50% + ${dy}px)` : `calc(50% + ${startY}px)`,
            width: `${feederWidth}px`,
            height: `${verticalDelta}px`,
            overflow: "visible",
          }}
          className="pointer-events-none z-20"
        >
          <path
            d={
              isUp
                ? `M 0,${verticalDelta} C ${feederWidth * 0.45},${verticalDelta} ${feederWidth * 0.55},0 ${feederWidth},0`
                : `M 0,0 C ${feederWidth * 0.45},0 ${feederWidth * 0.55},${verticalDelta} ${feederWidth},${verticalDelta}`
            }
            fill="none"
            stroke={theme.color}
            strokeWidth={2.5}
            strokeDasharray="6 4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={0} cy={isUp ? verticalDelta : 0} r={3.5} fill={theme.color} />
          <circle cx={feederWidth} cy={isUp ? 0 : verticalDelta} r={3} fill={theme.color} />
        </svg>

        {/* Divergence Trigger Reason Badge positioned at midpoint of feeder spline */}
        <div
          style={{
            position: "absolute",
            left: `${startX + Math.round(feederWidth * 0.5)}px`,
            top: `calc(50% + ${Math.round((startY + dy) / 2)}px)`,
            transform: "translate(-50%, -50%)",
            borderColor: theme.border,
            background: "var(--bg-surface)",
          }}
          className="z-30 pointer-events-none px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-tight whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs select-none shadow-2xs"
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: theme.color }} />
          <span style={{ color: theme.color }}>{theme.shortReason}</span>
        </div>

        {/* Continuous Horizontal Sequence of Route Gateway & IF Events along Alternate Track */}
        <div
          style={{
            position: "absolute",
            left: `${startX + feederWidth}px`,
            top: `calc(50% + ${dy}px)`,
            transform: "translateY(-50%)",
          }}
          className="flex items-center shrink-0 z-30 pointer-events-auto select-none"
        >
          {/* Route Gateway Card with matching visual stage */}
          {renderIfRouteGatewayCard(branch, gwStage, gwDims)}

          {/* Continuous Sequence of IF Events along Branch Stem (Using IDENTICAL card styling as canon) */}
          {(branch.events || []).map((ifEvt) => {
            const ifImportance = ifEvt.importance ?? 2;
            const ifStage = getEventVisualStage(ifImportance, desktopZoom);
            const ifDims = getStageDimensions(ifStage, ifImportance);

            return (
              <div key={ifEvt.id} className="flex items-center shrink-0">
                {/* Horizontal Connecting Thematic Accent Line */}
                <div
                  style={{
                    width: `${ifDims.connectorWidth}px`,
                    height: "2px",
                    backgroundColor: theme.color,
                  }}
                  className="shrink-0"
                />

                {/* IF Event Card (Identical rendering, dimensions, image, text, and stages to Canon Cards) */}
                {renderTimelineEventCard(
                  ifEvt,
                  ifStage,
                  ifDims,
                  () => {
                    const evt = allEventsById.get(ifEvt.id);
                    if (evt) {
                      handleCardClick(evt);
                    }
                  },
                  true,
                  branch.name,
                  branch.slug
                )}
              </div>
            );
          })}

          {/* Terminal Pip at end of alternate branch */}
          <div
            style={{
              width: `${Math.round(gwDims.connectorWidth * 0.6)}px`,
              height: "2px",
              backgroundColor: theme.color,
            }}
            className="shrink-0"
          />
          <div
            style={{
              borderColor: theme.color,
              backgroundColor: theme.color,
            }}
            className="w-2.5 h-2.5 rounded-full border shrink-0 opacity-80"
          />
        </div>
      </div>
    );
  };

  // Semantic Level of Detail (LOD) threshold for panoramic desktop view
  const isCompactLOD = desktopZoom < 0.50;

  // Visible IF Routes (accounting for multi-selection, solo isolation mode, and toggle)
  const visibleIfRoutes = useMemo(() => {
    return ifRoutes.filter((r) => selectedIfSlugs.includes(r.slug));
  }, [ifRoutes, selectedIfSlugs]);

  const totalDesktopCount = desktopFilteredEvents.length;

  const minimapEraDividers = useMemo(() => {
    let accumulated = 0;
    return eras.map((era) => {
      const count = desktopEventsByEra[era.id]?.length || 0;
      accumulated += count;
      const pct = totalDesktopCount > 0 ? (accumulated / totalDesktopCount) * 100 : 0;
      return { id: era.id, name: era.name, pct };
    });
  }, [eras, desktopEventsByEra, totalDesktopCount]);

  const getIfMinimapPosition = (divergenceEventId: string): number => {
    const idx = desktopFilteredEvents.findIndex((e) => e.id === divergenceEventId);
    if (idx < 0 || desktopFilteredEvents.length === 0) return 50;
    return Math.max(4, Math.min(96, (idx / desktopFilteredEvents.length) * 100));
  };

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
          {/* Chronological Detail Controls: Responsive between Mobile (Interactive Touch Slider) & Desktop (Segmented Tier Buttons synced with Canvas Zoom) */}
          <div className="md:col-span-5 space-y-2 select-none">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <span>Chronological Detail</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)] font-semibold">
                  Tier {zoomLevel}
                </span>
              </label>
              <span className="text-xs font-mono font-semibold text-[var(--text-main)] truncate max-w-[200px] text-right">
                {ZOOM_LEVEL_LABELS[zoomLevel]?.title}
              </span>
            </div>

            {/* Mobile Touch Slider (lg:hidden) */}
            <div className="block lg:hidden">
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

            {/* Desktop View Segmented Tiers (hidden lg:grid) */}
            <div className="hidden lg:grid grid-cols-5 gap-1 p-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isCurrent = zoomLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      const tierZooms: Record<number, number> = { 1: 0.35, 2: 0.60, 3: 0.85, 4: 1.05, 5: 1.25 };
                      handleZoomStep("reset", tierZooms[lvl] || 1.0);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-xs font-mono font-medium transition-all text-center cursor-pointer ${
                      isCurrent
                        ? "bg-[var(--accent)] text-white font-bold shadow-2xs"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
                    }`}
                    title={ZOOM_LEVEL_LABELS[lvl]?.desc}
                  >
                    <span className="block text-[11px] leading-tight">{lvl}: {ZOOM_LEVEL_LABELS[lvl]?.short}</span>
                  </button>
                );
              })}
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
            <span className="lg:hidden">
              Showing <strong className="text-[var(--text-main)]">{mobileFilteredEvents.length}</strong> of{" "}
              <strong>{events.length}</strong> events (Importance &le; {zoomLevel})
            </span>
            <span className="hidden lg:inline">
              Focus: <strong className="text-[var(--text-main)]">Tier {zoomLevel}</strong> ({ZOOM_LEVEL_LABELS[zoomLevel]?.title}) •{" "}
              <strong className="text-[var(--text-main)]">{desktopFilteredEvents.length}</strong> events visible
            </span>
            {(topicFilter !== "all" || searchQuery.trim() || zoomLevel !== 3 || desktopZoom !== 1.0) && (
              <button
                type="button"
                onClick={() => {
                  setTopicFilter("all");
                  setSearchQuery("");
                  setDesktopZoom(1.0);
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
        {/* Era Jump Pill Tabs & IF Route Selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mr-2 shrink-0">
              Jump to:
            </span>
            {eras.map((era) => {
              const count = desktopEventsByEra[era.id]?.length || 0;
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

          {/* IF Routes Jump & Solo Selector (outside overflow-x-auto so dropdown is never clipped) */}
          <div className="relative shrink-0" ref={ifDropdownRef}>
            <button
              type="button"
              onClick={() => setIsIfDropdownOpen(!isIfDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedIfSlugs.length === 0
                  ? "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  : selectedIfSlugs.length === 1
                    ? "bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--accent)] shadow-2xs"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[var(--accent)]"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background:
                    selectedIfSlugs.length === 1
                      ? (IF_ROUTE_THEMES[selectedIfSlugs[0]]?.color || "var(--accent)")
                      : selectedIfSlugs.length > 0
                        ? "var(--accent)"
                        : "var(--text-muted)",
                }}
              />
              <span className="font-semibold">
                {selectedIfSlugs.length === 0
                  ? "Canon Only"
                  : selectedIfSlugs.length === 1
                    ? `Solo: ${ifRoutes.find((r) => r.slug === selectedIfSlugs[0])?.name || selectedIfSlugs[0]}`
                    : selectedIfSlugs.length === ifRoutes.length
                      ? `IF Routes (${ifRoutes.length})`
                      : `IF Routes (${selectedIfSlugs.length}/${ifRoutes.length})`}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
                  isIfDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* IF Route Dropdown Menu (Multi-Select, Solo & Jump) */}
            {isIfDropdownOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-80 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xl p-2.5 space-y-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-1 pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Divergent Multiverse
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold">
                      {selectedIfSlugs.length}/{ifRoutes.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllIfRoutes}
                      className="text-[10px] font-mono font-bold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-[var(--text-muted)]">•</span>
                    <button
                      type="button"
                      onClick={clearAllIfRoutes}
                      className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      Hide All
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 py-0.5">
                  {ifRoutes.map((r) => {
                    const th = IF_ROUTE_THEMES[r.slug];
                    const isSelected = selectedIfSlugs.includes(r.slug);
                    const isSolo = soloIfSlug === r.slug;
                    return (
                      <div
                        key={r.slug}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors group cursor-pointer ${
                          isSelected
                            ? "bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)]"
                            : "hover:bg-[var(--bg-elevated)]/40 opacity-70 hover:opacity-100"
                        }`}
                        onClick={() => {
                          if (!isSelected) {
                            toggleIfRoute(r.slug);
                          }
                          jumpToIfRoute(r.slug);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 select-none">
                          {/* Checkbox indicator */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const willSelect = !isSelected;
                              toggleIfRoute(r.slug);
                              if (willSelect) {
                                jumpToIfRoute(r.slug);
                              }
                            }}
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                              isSelected
                                ? "bg-[var(--accent)] text-white"
                                : "border border-[var(--border-strong)] bg-[var(--bg-surface)]"
                            }`}
                            title={isSelected ? `Hide ${r.name}` : `Show & Jump to ${r.name}`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: th?.color || "var(--accent)" }}
                          />

                          <div className="truncate">
                            <span className={`font-semibold ${isSelected ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>
                              {r.name}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] ml-1 font-mono">
                              ({r.kanjiTitle})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isSelected) {
                                toggleIfRoute(r.slug);
                              }
                              jumpToIfRoute(r.slug);
                              setIsIfDropdownOpen(false);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)] cursor-pointer"
                            title="Jump to route gateway node"
                          >
                            Jump
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              soloIfRoute(r.slug);
                              jumpToIfRoute(r.slug);
                              setIsIfDropdownOpen(false);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                              isSolo
                                ? "bg-[var(--accent)] text-white shadow-2xs"
                                : "text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
                            }`}
                            title={isSolo ? "Show all routes" : "Isolate this IF branch only"}
                          >
                            {isSolo ? "Active" : "Solo"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active IF Route Jump Buttons (rendered below Era buttons when any IF route is active) */}
        {selectedIfSlugs.length > 0 && (
          <div className="flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mr-2 shrink-0 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>Jump to IF:</span>
              </span>

              {ifRoutes
                .filter((r) => selectedIfSlugs.includes(r.slug))
                .map((r) => {
                  const th = IF_ROUTE_THEMES[r.slug];
                  const count = (r.events || []).length;
                  const isSolo = soloIfSlug === r.slug;

                  return (
                    <div
                      key={r.slug}
                      className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all shrink-0 shadow-2xs group"
                    >
                      <button
                        type="button"
                        onClick={() => jumpToIfRoute(r.slug)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors text-[var(--text-main)] hover:text-[var(--accent)]"
                        title={`Jump to ${r.name} (${r.kanjiTitle}) starting gateway node`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: th?.color || "var(--accent)" }}
                        />
                        <span className="font-semibold">{r.name}</span>
                        <span
                          className={`inline-flex items-center justify-center min-w-[1.25rem] h-4.5 px-1.5 rounded-full text-[10px] font-mono font-bold leading-none shrink-0 ${
                            isSolo
                              ? "bg-[var(--accent)] text-white"
                              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIfRoute(r.slug);
                        }}
                        className="pr-2 pl-0.5 py-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
                        title={`Hide ${r.name}`}
                        aria-label={`Hide ${r.name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearAllIfRoutes}
                className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                title="Hide all IF routes and view Canon only"
              >
                Hide All IF
              </button>
            </div>
          </div>
        )}

        {/* Quick Navigation Controls & Hints Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none py-0.5">
            <span className="flex items-center gap-1.5 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] text-[var(--text-main)] font-semibold shadow-2xs">
                Wheel
              </kbd>
              <span>Scroll Vertically</span>
            </span>
            <span className="text-[var(--border-strong)] hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] text-[var(--text-main)] font-semibold shadow-2xs">
                Shift + Wheel
              </kbd>
              <span>Pan Horizontally</span>
            </span>
            <span className="text-[var(--border-strong)] hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] text-[var(--text-main)] font-semibold shadow-2xs">
                Ctrl + Wheel / Pinch
              </kbd>
              <span>Zoom</span>
            </span>
            <span className="text-[var(--border-strong)] hidden md:inline">•</span>
            <span className="hidden md:flex items-center gap-1.5 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] text-[var(--text-main)] font-semibold shadow-2xs">
                Drag
              </kbd>
              <span>Pan Canvas</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsControlsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-colors cursor-pointer shrink-0 ml-3 shadow-2xs"
            title="Open full mouse and keyboard controls cheatsheet (Press ?)"
          >
            <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="font-semibold text-xs">Controls</span>
            <kbd className="px-1 py-0.2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono font-bold">
              ?
            </kbd>
          </button>
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

          {/* Floating Zoom & Canvas Controls Toolbar */}
          <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md shadow-md px-3 py-1.5 text-xs font-mono text-[var(--text-main)] select-none">
            {/* IF Branches Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedIfSlugs.length > 0) {
                  lastSelectedIfSlugsRef.current = selectedIfSlugs;
                  setSelectedIfSlugs([]);
                } else {
                  setSelectedIfSlugs(
                    lastSelectedIfSlugsRef.current.length > 0
                      ? lastSelectedIfSlugsRef.current
                      : ifRoutes.map((r) => r.slug)
                  );
                }
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                showIfBranches
                  ? "bg-[var(--accent)] text-white shadow-2xs"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]"
              }`}
              title={showIfBranches ? "Hide all IF branches" : "Restore IF branches"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showIfBranches ? "bg-white animate-pulse" : "bg-[var(--text-muted)]"}`} />
              <span>
                {selectedIfSlugs.length === ifRoutes.length
                  ? "IF Branches"
                  : selectedIfSlugs.length > 0
                    ? `IF Branches (${selectedIfSlugs.length})`
                    : "IF Branches (Off)"}
              </span>
            </button>

            {/* Minimap Radar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMinimapOpen(!isMinimapOpen)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMinimapOpen
                  ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]"
              }`}
              title={isMinimapOpen ? "Minimize Radar overview" : "Open 2D Radar overview"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isMinimapOpen ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--text-muted)]"}`} />
              <span>Radar</span>
            </button>

            <span className="w-[1px] h-3.5 bg-[var(--border-subtle)] mx-0.5" />

            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={() => handleZoomStep("out")}
              disabled={desktopZoom <= 0.10}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>

            {/* Continuous Mini Slider */}
            <div className="w-16 sm:w-20 relative flex items-center mx-1">
              <input
                type="range"
                min={10}
                max={125}
                step={1}
                value={Math.round(desktopZoom * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  handleZoomStep("reset", val);
                }}
                className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                aria-label="Timeline canvas continuous zoom"
                title={`Continuous Zoom: ${Math.round(desktopZoom * 100)}%`}
              />
            </div>

            {/* Zoom In Button */}
            <button
              type="button"
              onClick={() => handleZoomStep("in")}
              disabled={desktopZoom >= 1.25}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Divider */}
            <span className="w-[1px] h-3.5 bg-[var(--border-subtle)] mx-0.5" />

            {/* Fit All (World View) Button */}
            <button
              type="button"
              onClick={() => handleZoomStep("fit")}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title="Fit entire world timeline on screen"
            >
              Fit All
            </button>

            {/* Default 100% Zoom Button inside canvas */}
            <button
              type="button"
              onClick={() => handleZoomStep("reset", 1.0)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                Math.round(desktopZoom * 100) === 100
                  ? "bg-[var(--accent)] text-white shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)]"
              }`}
              title="Reset timeline to default zoom (100%)"
            >
              <span>Default (100%)</span>
            </button>

            {/* Controls Guide Button */}
            <button
              type="button"
              onClick={() => setIsControlsModalOpen(true)}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer flex items-center gap-1"
              title="Mouse & Keyboard Controls Guide (Press ?)"
            >
              <span>Controls</span>
              <kbd className="px-1 py-0.2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[9px] text-[var(--text-muted)] font-mono">?</kbd>
            </button>

            {/* Percentage Display if not at default 100% */}
            {Math.round(desktopZoom * 100) !== 100 && (
              <span className="text-[11px] font-mono font-bold text-[var(--accent)] pl-0.5 select-none">
                {Math.round(desktopZoom * 100)}%
              </span>
            )}
          </div>

          {/* Continuous Horizontal Canvas (Snug Vertical Sizing) */}
          {(() => {
            const baseContentHeight = selectedIfSlugs.length === 0
              ? 360
              : (() => {
                  const maxOffset = Math.max(...selectedIfSlugs.map((s) => Math.abs(getIfRouteTrackOffset(s))));
                  return Math.min(3100, maxOffset * 2 + 500);
                })();

            return (
              <>
                {/* Floating Minimap / 2D Timeline Radar */}
                {isMinimapOpen && (
                  <div className="minimap-widget absolute bottom-3 left-4 z-30 select-none hidden sm:flex flex-col gap-1.5 p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md shadow-xl w-[240px]">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Timeline Radar
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMinimapOpen(false)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5 cursor-pointer"
                        title="Minimize radar"
                        aria-label="Minimize radar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Minimap Track Viewport Screen */}
                    <div
                      ref={minimapTrackRef}
                      onPointerDown={handleMinimapPointerDown}
                      onPointerMove={handleMinimapPointerMove}
                      onPointerUp={handleMinimapPointerUp}
                      className="relative w-full h-[62px] rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] overflow-hidden cursor-crosshair group/radar select-none"
                    >
                      {/* Central Canon Spine */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[var(--border-strong)] opacity-80" />

                      {/* Era Divider Lines */}
                      {minimapEraDividers.map((d, i) => (
                        <div
                          key={d.id || i}
                          style={{ left: `${d.pct}%` }}
                          className="absolute top-0 bottom-0 w-[1px] bg-[var(--border-subtle)]/60 pointer-events-none"
                        />
                      ))}

                      {/* Visible IF Branch Nodes on Radar */}
                      {showIfBranches &&
                        visibleIfRoutes.map((b) => {
                          const th = IF_ROUTE_THEMES[b.slug];
                          const pctX = getIfMinimapPosition(b.divergesFromEventId);
                          const dy = getIfRouteTrackOffset(b.slug);
                          const halfH = Math.max(180, baseContentHeight / 2);
                          const offsetY = Math.max(-24, Math.min(24, (dy / halfH) * 24));
                          return (
                            <button
                              key={b.slug}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                jumpToIfRoute(b.slug);
                              }}
                              style={{
                                left: `${pctX}%`,
                                top: `calc(50% + ${offsetY}px)`,
                                backgroundColor: th?.color || "var(--accent)",
                              }}
                              className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-2xs hover:scale-150 transition-transform z-10"
                              title={`Jump to ${b.name} (${b.kanjiTitle})`}
                            />
                          );
                        })}

                      {/* Draggable & Clickable Viewport Box */}
                      {(() => {
                        const leftRatio = canvasScrollMetrics.scrollLeft / canvasScrollMetrics.scrollWidth;
                        const widthRatio = Math.min(1, canvasScrollMetrics.clientWidth / canvasScrollMetrics.scrollWidth);
                        const topRatio = canvasScrollMetrics.scrollTop / canvasScrollMetrics.scrollHeight;
                        const heightRatio = Math.min(1, canvasScrollMetrics.clientHeight / canvasScrollMetrics.scrollHeight);

                        const boxLeft = Math.max(0, Math.min(100 - 12, leftRatio * 100));
                        const boxWidth = Math.max(12, Math.min(100, widthRatio * 100));
                        const boxTop = Math.max(0, Math.min(100 - 20, topRatio * 100));
                        const boxHeight = Math.max(20, Math.min(100, heightRatio * 100));

                        return (
                          <div
                            style={{
                              left: `${boxLeft}%`,
                              width: `${boxWidth}%`,
                              top: `${boxTop}%`,
                              height: `${boxHeight}%`,
                            }}
                            className="absolute rounded border-2 border-[var(--accent)] bg-[var(--accent)]/15 backdrop-blur-[1px] pointer-events-none shadow-xs transition-[left,top,width,height] duration-75"
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div
                  ref={desktopCanvasRef}
                  data-timeline-canvas="true"
                  tabIndex={0}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="relative w-full max-h-[82vh] overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 px-6 py-5 select-none cursor-grab active:cursor-grabbing focus:outline-none timeline-scrollbar flex flex-col touch-none"
                  style={{
                    minHeight: `${Math.max(360, Math.min(800, Math.round(baseContentHeight * desktopZoom)))}px`,
                    touchAction: "none",
                  }}
                >
                {/* Sizing envelope: dictating scroll container dimensions & centered horizontally and vertically when fully zoomed out */}
                <div
                  style={{
                    width: scaledContentWidth ? `${scaledContentWidth}px` : "max-content",
                    height: `${Math.round(baseContentHeight * desktopZoom)}px`,
                    position: "relative",
                  }}
                  className={`my-auto shrink-0 ${isContentCentered ? "mx-auto" : "ml-0 mr-auto"}`}
                >
                  {/* Scaled Layer: rendered at base width and scaled smoothly with GPU acceleration */}
                  <div
                    ref={contentLayerRef}
                    style={{
                      width: "max-content",
                      height: `${baseContentHeight}px`,
                      transform: `scale(${desktopZoom})`,
                      transformOrigin: "0 0",
                      position: "absolute",
                      left: 0,
                      top: 0,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    className="select-none"
                  >
            {eras.map((era, eraIndex) => {
              const eraEvents = desktopEventsByEra[era.id] || [];

              return (
                <div
                  key={era.id}
                  ref={(el) => {
                    eraRefs.current[era.id] = el;
                  }}
                  className="inline-flex items-center relative z-10 shrink-0"
                >
                  {/* Era Milestone Gateway Card */}
                  <div
                    data-era-id={era.id}
                    className="relative w-[335px] h-[252px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between shrink-0 shadow-xs z-10"
                  >
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
                      {!isCompactLOD && (
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed font-prose">
                          {era.headline}
                        </p>
                      )}
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
                      <div className="w-14 h-[2.5px] bg-[var(--border-strong)]" />
                      <div className="px-3 py-1.5 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 text-xs text-[var(--text-muted)] italic shrink-0">
                        No events match filter
                      </div>
                      <div className="w-14 h-[2.5px] bg-[var(--border-strong)]" />
                    </div>
                  ) : (
                    eraEvents.map((event, eventIdx) => {
                      const stage = getEventVisualStage(event.importance, desktopZoom);
                      const dims = getStageDimensions(stage, event.importance);
                      const candidateBranch = ifBranchesByEventId[event.id];
                      const branch =
                        candidateBranch && selectedIfSlugs.includes(candidateBranch.slug)
                          ? candidateBranch
                          : null;

                      // Organic tree-branch wave offsets
                      const prevOffset = eventIdx === 0 ? 0 : getEventTreeWaveOffset(eventIdx - 1);
                      const currOffset = getEventTreeWaveOffset(eventIdx);
                      const dy = prevOffset - currOffset;

                      return (
                        <div
                          key={event.id}
                          style={{
                            transform: `translateY(${currOffset}px)`,
                            transition: "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          className="inline-flex items-center shrink-0 relative"
                        >
                          {/* Organic Curved Tree Branch Connector from Previous Node */}
                          <div
                            style={{
                              width: `${dims.connectorWidth}px`,
                              height: "2px",
                              transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                            className="relative flex items-center justify-center shrink-0"
                          >
                            <svg
                              style={{
                                width: `${dims.connectorWidth}px`,
                                height: "140px",
                                overflow: "visible",
                              }}
                              className="absolute inset-0 pointer-events-none"
                            >
                              <path
                                d={`M 0,${dy} C ${dims.connectorWidth * 0.5},${dy} ${dims.connectorWidth * 0.5},0 ${dims.connectorWidth},0`}
                                fill="none"
                                stroke="var(--border-strong)"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                              />
                              {stage !== "dot" && (
                                <circle
                                  cx={dims.connectorWidth * 0.5}
                                  cy={dy * 0.5}
                                  r={2}
                                  fill="var(--accent)"
                                  opacity={0.65}
                                />
                              )}
                            </svg>
                          </div>

                          {/* Persistent Event Container: Smoothly Transitions Dimensions & Content */}
                          {renderTimelineEventCard(
                            event,
                            stage,
                            dims,
                            () => handleCardClick(event),
                            false
                          )}

                          {/* Divergent IF Branch */}
                          {branch && renderIfBranch(branch, dims, currOffset)}
                        </div>
                      );
                    })
                  )}

                  {/* Inter-Era Transition Connector */}
                  {eraIndex < eras.length - 1 && (() => {
                    const lastOffset = eraEvents.length > 0 ? getEventTreeWaveOffset(eraEvents.length - 1) : 0;
                    return (
                      <div className="w-16 h-12 relative flex items-center justify-center shrink-0 mx-2 pointer-events-none">
                        <svg
                          style={{
                            width: "64px",
                            height: "140px",
                            overflow: "visible",
                          }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          <path
                            d={`M 0,${lastOffset} C 32,${lastOffset} 32,0 64,0`}
                            fill="none"
                            stroke="var(--border-strong)"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                          />
                          <circle cx={32} cy={lastOffset * 0.5} r={2.5} fill="var(--accent)" opacity={0.7} />
                        </svg>
                        <span
                          style={{ transform: `translateY(${Math.round(lastOffset * 0.5)}px)` }}
                          className="w-2.5 h-2.5 rotate-45 border-t-2 border-r-2 border-[var(--accent)] z-10"
                        />
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Dynamic trailing runway: scales down smoothly at overview zoom levels so the timeline fits snugly without empty void */}
            <div
              style={{
                width: `${(() => {
                  if (desktopZoom <= 0.25) {
                    return 64;
                  }
                  const progress = Math.min(1, Math.max(0, (desktopZoom - 0.25) / 0.75));
                  const targetScreenRunway = Math.round((canvasWidth ? canvasWidth * 0.45 : 550) * progress);
                  return Math.round(targetScreenRunway / desktopZoom);
                })()}px`,
                transition: "width 300ms ease",
              }}
              className="shrink-0 pointer-events-none"
            />
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW: Canon Eras vs Standalone IF Divergences
          ========================================================================= */}
      <div className="block lg:hidden space-y-6">
        {/* Mobile Mode Switcher: Canon History vs IF Divergences */}
        <div className="grid grid-cols-2 p-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-mono font-semibold">
          <button
            type="button"
            onClick={() => setMobileViewMode("canon")}
            className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileViewMode === "canon"
                ? "bg-[var(--accent)] text-white shadow-2xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <span>Canon Eras</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                mobileViewMode === "canon" ? "bg-white text-[var(--accent)]" : "bg-[var(--bg-elevated)]"
              }`}
            >
              {eras.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode("if")}
            className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileViewMode === "if"
                ? "bg-[var(--accent)] text-white shadow-2xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <span>IF Routes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                mobileViewMode === "if" ? "bg-white text-[var(--accent)]" : "bg-[var(--bg-elevated)]"
              }`}
            >
              {ifRoutes.length}
            </span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            MODE 1: CANON ERAS VIEW
            ------------------------------------------------------------- */}
        {mobileViewMode === "canon" && (
          <div className="space-y-6">
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
            <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-5 before:bottom-6 before:w-[2px] before:bg-[var(--accent)]">
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
                  const branch = ifBranchesByEventId[event.id];

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
                      <div className="absolute -left-3.5 top-6 w-3.5 h-[2px] bg-[var(--accent)] pointer-events-none" />

                      {/* Event Card with Picture as Background & Text on Side */}
                      <div
                        data-event-id={event.id}
                        onClick={() => !isExiting && setSelectedEvent(event)}
                        className="timeline-card relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all shadow-xs cursor-pointer active:scale-[0.99] select-none min-h-[195px]"
                      >
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

                      {/* Prominent Divergent IF Route Link Pill on Mobile */}
                      {branch && (
                        <div className="mt-2 pl-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIfSlug(branch.slug);
                              setMobileViewMode("if");
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-[var(--accent)]/80 bg-[var(--accent-bg)]/40 hover:bg-[var(--accent-bg)] transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 animate-pulse" />
                              <div className="min-w-0">
                                <div className="text-[10px] font-mono font-bold text-[var(--accent-text)] uppercase tracking-wider">
                                  Divergent Route: {branch.name}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] truncate font-sans">
                                  {branch.headline}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[var(--accent)] shrink-0 flex items-center gap-1">
                              <span>Explore</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      )}
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
        )}

        {/* -------------------------------------------------------------
            MODE 2: STANDALONE IF DIVERGENCES VIEW (ONLY SHOWS THE IF)
            ------------------------------------------------------------- */}
        {mobileViewMode === "if" && currentIfRoute && (
          <div className="space-y-6">
            {/* IF Route Selector Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Select IF Route:
                </span>
                <button
                  type="button"
                  onClick={() => setMobileViewMode("canon")}
                  className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Canon</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ifRoutes.map((r) => {
                  const isActive = r.slug === selectedIfSlug;
                  const count = r.events?.length || 0;
                  return (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => setSelectedIfSlug(r.slug)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[var(--accent)] text-white font-bold border-transparent shadow-2xs"
                          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 mr-1 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white" : ""}`}
                          style={{
                            backgroundColor: isActive ? undefined : (IF_ROUTE_THEMES[r.slug]?.color || "var(--accent)"),
                          }}
                        />
                        <span className="truncate">{r.name}</span>
                      </div>
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

            {/* Selected IF Overview Card */}
            {(() => {
              const curTheme = IF_ROUTE_THEMES[currentIfRoute.slug];
              return (
                <div
                  data-if-gateway={currentIfRoute.slug}
                  data-event-id={`gateway-${currentIfRoute.slug}`}
                  onClick={() => {
                    const evt = allEventsById.get(`gateway-${currentIfRoute.slug}`);
                    if (evt) setSelectedEvent(evt);
                  }}
                  style={{
                    borderColor: curTheme ? curTheme.border : undefined,
                  }}
                  className="rounded-2xl border-2 border-dashed bg-[var(--bg-surface)] p-5 space-y-3 shadow-md cursor-pointer hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                    <div
                      style={{ color: curTheme?.color }}
                      className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider"
                    >
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: curTheme?.color || "var(--accent)" }}
                      />
                      <span>{currentIfRoute.name}</span>
                      <span className="text-[11px] text-[var(--text-muted)] font-normal">({currentIfRoute.kanjiTitle})</span>
                    </div>
                    <span
                      style={{
                        borderColor: curTheme?.border,
                        color: curTheme?.color,
                        background: curTheme?.bg,
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold"
                    >
                      {currentIfRoute.divergencePoint}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
                      {currentIfRoute.headline}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 font-prose">
                      {currentIfRoute.description}
                    </p>
                  </div>

                  {currentIfRoute.subEvents && currentIfRoute.subEvents.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Key Divergence Milestones:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentIfRoute.subEvents.map((step, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] flex items-center gap-1"
                          >
                            <span
                              className="w-1 h-1 rounded-full"
                              style={{ background: curTheme?.color || "var(--accent)" }}
                            />
                            <span>{step}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {(currentIfRoute.events || []).length} Alternate Events
                    </span>
                    <Link
                      href={currentIfRoute.href}
                      style={{ color: curTheme?.color }}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold hover:underline"
                    >
                      <span>Read Story Route</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Point of Divergence Origin Card */}
            {canonDivergenceEvent && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-[var(--accent)] uppercase tracking-wider">
                    Branches Off From Canon Event:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEraId(canonDivergenceEvent.eraId);
                      setMobileViewMode("canon");
                    }}
                    className="text-[11px] text-[var(--accent)] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Jump to Canon</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="font-bold text-xs sm:text-sm text-[var(--text-main)]">
                  {canonDivergenceEvent.name} ({canonDivergenceEvent.approxStartDate})
                </div>
                {currentIfRoute.divergenceSummary && (
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                    &ldquo;{currentIfRoute.divergenceSummary}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Vertical Stream of IF Events */}
            <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-5 before:bottom-6 before:w-[2px] before:bg-[var(--accent)]">
              {(currentIfRoute.events || []).map((ifEvent, ifIdx) => (
                <div key={ifEvent.id} className="relative timeline-card-enter">
                  {/* Connecting tick */}
                  <div className="absolute -left-3.5 top-6 w-3.5 h-[2px] bg-[var(--accent)] pointer-events-none" />

                  {/* IF Event Card */}
                  <div
                    data-event-id={ifEvent.id}
                    onClick={() => {
                      const evt = allEventsById.get(ifEvent.id);
                      if (evt) {
                        setSelectedEvent(evt);
                      }
                    }}
                    className="timeline-card relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all shadow-xs cursor-pointer active:scale-[0.99] select-none min-h-[180px]"
                  >
                    {ifEvent.image ? (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img
                          src={ifEvent.image}
                          alt={ifEvent.name}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/92 to-[var(--bg-surface)]/25 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-0 bg-[var(--bg-surface)] overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-surface)]/95 to-[var(--bg-surface)]/75" />
                      </div>
                    )}

                    <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white shadow-xs inline-flex items-center gap-1">
                        <span>Details</span>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </div>

                    <div className="relative z-10 p-4.5 flex flex-col justify-between min-h-[180px] max-w-[76%] space-y-2 pointer-events-none">
                      <div className="flex flex-wrap items-center gap-1.5 w-full">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] shadow-2xs">
                          {ifEvent.approxStartDate}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                          Stage 0{ifIdx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--accent)] font-semibold truncate max-w-[100px]">
                          {currentIfRoute.name}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] leading-snug line-clamp-2">
                          {ifEvent.name}
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                          <span>{ifEvent.location}</span>
                        </p>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] leading-relaxed font-prose line-clamp-3">
                        {ifEvent.description}
                      </p>

                      {ifEvent.characters.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {ifEvent.characters.slice(0, 3).map((char) => (
                            <span
                              key={char}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-elevated)]/90 text-[var(--text-muted)] border border-[var(--border-subtle)]"
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Canon Button */}
            <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
              <button
                type="button"
                onClick={() => setMobileViewMode("canon")}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-mono font-bold text-[var(--text-main)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Return to Canon Eras Timeline</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          EVENT DETAIL MODAL (Clean Design, No Emojis, Matches Site Modals)
          ========================================================================= */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleCloseModal}
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
                  onClick={handleCloseModal}
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
                    {selectedIfRoute ? (
                      <>
                        <span
                          style={{
                            backgroundColor: selectedIfTheme?.color || "var(--accent)",
                          }}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white shadow-2xs"
                        >
                          {selectedIfRoute.name} ({selectedIfRoute.kanjiTitle})
                        </span>
                        <span
                          style={{
                            borderColor: selectedIfTheme?.border,
                            color: selectedIfTheme?.color,
                            background: selectedIfTheme?.bg,
                          }}
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
                        >
                          {selectedIfRoute.divergencePoint}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                          {selectedEvent.id.startsWith("gateway-") ? "Route Gateway" : "Alternate Milestone"}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                          Tier {selectedEvent.importance}
                        </span>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
                    {selectedEvent.name}
                  </h3>
                </div>

                {!selectedEvent.image && (
                  <button
                    type="button"
                    onClick={handleCloseModal}
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
                {selectedIfRoute ? (
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">
                      Divergence Origin
                    </span>
                    <div className="font-semibold text-[var(--text-main)] truncate" title={selectedDivergenceEvent ? `${selectedDivergenceEvent.name} (${selectedIfRoute.divergencePoint})` : selectedIfRoute.divergencePoint}>
                      {selectedDivergenceEvent ? `${selectedDivergenceEvent.name} (${selectedIfRoute.divergencePoint})` : selectedIfRoute.divergencePoint}
                    </div>
                  </div>
                ) : (
                  selectedEventEra && (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">
                        Historical Era
                      </span>
                      <div className="font-semibold text-[var(--text-main)]">
                        {selectedEventEra.name} <span className="text-[var(--text-muted)] font-mono text-[11px]">({selectedEventEra.timeSpan})</span>
                      </div>
                    </div>
                  )
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

                <div className={`rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-0.5 ${!selectedEvent.duration ? "sm:col-span-2" : ""}`}>
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
                <p className="text-sm text-[var(--text-main)] leading-relaxed font-prose whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Characters Involved */}
              {(selectedEvent.characters || []).length > 0 && (
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

              {/* Dedicated IF Route Narrative Link Banner */}
              {selectedIfRoute && (
                <div
                  style={{
                    borderColor: selectedIfTheme?.border || "var(--border-subtle)",
                    backgroundColor: selectedIfTheme?.bg || "var(--bg-elevated)",
                  }}
                  className="rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div
                      className="text-xs font-mono uppercase tracking-wider font-bold"
                      style={{ color: selectedIfTheme?.color || "var(--accent)" }}
                    >
                      {selectedIfRoute.name} Narrative Route
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-prose">
                      Explore the complete {selectedIfRoute.name} ({selectedIfRoute.kanjiTitle}) story overview, chapters, and lore.
                    </p>
                  </div>
                  <Link
                    href={selectedIfRoute.href}
                    style={{
                      backgroundColor: selectedIfTheme?.color || "var(--accent)",
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold text-white shrink-0 hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <span>Read Story Route</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Canonical Source Citation (Handled if present or omitted) */}
              {!selectedIfRoute && (
                selectedEvent.source ? (
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
                )
              )}

              {/* Modal Navigation & Close Controls */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={currentModalIndex <= 0}
                  onClick={() => {
                    if (currentModalIndex > 0) {
                      setSelectedEvent(modalEventsList[currentModalIndex - 1]);
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

                <div className="text-[11px] font-mono text-[var(--text-muted)] text-center hidden sm:block">
                  {currentModalIndex >= 0 && `${currentModalIndex + 1} / ${modalEventsList.length}`}
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 max-w-[140px] py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)]/20 text-xs font-bold text-[var(--text-main)] transition-colors cursor-pointer text-center"
                >
                  Close (Esc)
                </button>

                <button
                  type="button"
                  disabled={currentModalIndex < 0 || currentModalIndex >= modalEventsList.length - 1}
                  onClick={() => {
                    if (currentModalIndex >= 0 && currentModalIndex < modalEventsList.length - 1) {
                      setSelectedEvent(modalEventsList[currentModalIndex + 1]);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    currentModalIndex < 0 || currentModalIndex >= modalEventsList.length - 1
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

      {/* Controls & Shortcuts Guide Modal */}
      {isControlsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="controls-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsControlsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h3 id="controls-modal-title" className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                  Canvas Navigation &amp; Controls
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  How to operate and navigate the Re:Zero interactive multiverse timeline
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsControlsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer shrink-0"
                aria-label="Close controls guide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mouse & Trackpad Navigation Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Mouse &amp; Trackpad Navigation
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)]">Vertical Navigation</span>
                    <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-2xs">
                      Wheel
                    </kbd>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Scroll mouse wheel to move vertically up and down through canon and parallel IF route lanes.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)]">Horizontal Timeline Pan</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-2xs">
                        Shift
                      </kbd>
                      <span className="text-[10px] text-[var(--text-muted)]">+</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-2xs">
                        Wheel
                      </kbd>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Hold Shift while scrolling, or use trackpad horizontal swipe, to travel left and right across eras.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)]">Smooth Zoom</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-2xs">
                        Ctrl
                      </kbd>
                      <span className="text-[10px] text-[var(--text-muted)]">+</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-2xs">
                        Wheel
                      </kbd>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Hold Ctrl while scrolling, or pinch on trackpad, to zoom in or out centered on your cursor.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)]">Free Drag Pan</span>
                    <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-2xs">
                      Drag
                    </kbd>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Click and drag anywhere on the canvas background to glide in any 2D direction freely.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Quick Navigation Shortcuts
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 space-y-1">
                  <span className="font-bold text-[var(--text-main)]">Era Buttons</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Click any era tab to instantly snap to that era start while preserving your current zoom.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 space-y-1">
                  <span className="font-bold text-[var(--text-main)]">IF Route Jumps</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Click any route in the IF dropdown, Solo button, or branch badge to center on its starting gateway.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 space-y-1">
                  <span className="font-bold text-[var(--text-main)]">2D Radar Minimap</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Drag the viewport box or click any route dot on the radar to rapidly scrub through the entire universe.
                  </p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Keyboard Shortcuts
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Pan Left/Right</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">&larr;</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">&rarr;</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Pan Up/Down</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">&uarr;</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">&darr;</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Zoom In / Out</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">+</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">-</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Reset Zoom (100%)</span>
                  <kbd className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-mono text-[10px] font-bold text-[var(--text-main)]">0</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Event Details Nav</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">&larr;</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-bold text-[var(--text-main)]">&rarr;</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Close / Dismiss</span>
                  <kbd className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-mono text-[10px] font-bold text-[var(--text-main)]">Esc</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Controls Guide</span>
                  <kbd className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-mono text-[10px] font-bold text-[var(--text-main)]">?</kbd>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <span className="text-[11px] text-[var(--text-muted)]">Fit World View</span>
                  <kbd className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-strong)] font-mono text-[10px] font-bold text-[var(--text-main)]">Fit All</kbd>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsControlsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
              >
                Got it, back to timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
