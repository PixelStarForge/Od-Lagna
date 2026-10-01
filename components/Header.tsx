"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePreferences } from "../lib/preferences";
import { getRandomEntryId } from "../lib/random-entry";
import { preloadSearchIndex } from "../lib/search-index";
import { dispatchUrlChange } from "../lib/navigation-events";
import { useBookmarks } from "../lib/bookmarks";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    theme,
    setTheme,
    setIsSettingsOpen,
    setIsSearchOpen,
    spoilerArc,
    allowedIfRoutes,
  } = usePreferences();
  const { bookmarkCount, mounted: bookmarksMounted } = useBookmarks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"stories" | "more" | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const navRef = useRef<HTMLElement>(null);

  // Close menus on route change during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }

  // Handle clicking outside or pressing Escape to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSurpriseMe = async () => {
    if (isRolling) return;
    setIsRolling(true);
    try {
      const randomId = await getRandomEntryId(spoilerArc, allowedIfRoutes);
      if (randomId) {
        const targetUrl = `/qna?id=${randomId}`;
        router.push(targetUrl);
        dispatchUrlChange(targetUrl);
      }
    } finally {
      setIsRolling(false);
    }
  };

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const isBrowseActive = pathname === "/browse" || pathname?.startsWith("/browse/");
  const isCharactersActive = pathname?.startsWith("/characters");
  const isAnimeActive = pathname?.startsWith("/anime");
  const isStoriesActive = pathname?.startsWith("/side-stories") || pathname?.startsWith("/ifs") || pathname?.startsWith("/stories");
  const isMoreActive = pathname === "/about" || pathname === "/contribute";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/95 backdrop-blur-none transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link href="/" aria-label="Od-Lagna Home" className="group flex items-center gap-2 text-decoration-none shrink-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs group-hover:bg-[var(--accent-hover)] transition-colors">
              Ω
            </span>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                Od-Lagna
              </span>
              <span className="text-xs uppercase font-mono tracking-wider text-[var(--text-muted)] font-medium hidden xl:inline">
                Re:Zero Q&amp;A Archive
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav ref={navRef} className="hidden lg:flex items-center gap-1">
            <Link
              href="/browse"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isBrowseActive
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Browse
            </Link>
            <Link
              href="/characters"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isCharactersActive
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Characters
            </Link>
            <Link
              href="/anime"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isAnimeActive
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Anime
            </Link>

            {/* Stories Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === "stories" ? null : "stories"))}
                aria-expanded={openDropdown === "stories"}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isStoriesActive
                    ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                    : openDropdown === "stories"
                    ? "bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span>Stories</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === "stories" ? "rotate-180" : ""
                  } ${
                    isStoriesActive
                      ? "text-[var(--accent)]"
                      : openDropdown === "stories"
                      ? "text-[var(--text-main)]"
                      : "text-[var(--text-muted)]"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === "stories" && (
                <div
                  role="menu"
                  className="absolute left-0 mt-1.5 w-60 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100 z-50"
                >
                  <Link
                    href="/side-stories"
                    role="menuitem"
                    onClick={() => setOpenDropdown(null)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname?.startsWith("/side-stories")
                        ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className={`font-medium text-xs sm:text-sm ${pathname?.startsWith("/side-stories") ? "text-[var(--accent)] font-semibold" : "text-[var(--text-main)]"}`}>
                      Side Stories
                    </div>
                    <div className={`text-xs ${pathname?.startsWith("/side-stories") ? "text-[var(--accent)] opacity-85" : "text-[var(--text-muted)]"}`}>
                      Canon side stories
                    </div>
                  </Link>
                  <Link
                    href="/ifs"
                    role="menuitem"
                    onClick={() => setOpenDropdown(null)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors mt-0.5 ${
                      pathname?.startsWith("/ifs")
                        ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className={`font-medium text-xs sm:text-sm ${pathname?.startsWith("/ifs") ? "text-[var(--accent)] font-semibold" : "text-[var(--text-main)]"}`}>
                      IF Routes
                    </div>
                    <div className={`text-xs ${pathname?.startsWith("/ifs") ? "text-[var(--accent)] opacity-85" : "text-[var(--text-muted)]"}`}>
                      Alternative what-if timelines
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* More Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === "more" ? null : "more"))}
                aria-expanded={openDropdown === "more"}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isMoreActive
                    ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                    : openDropdown === "more"
                    ? "bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span>More</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === "more" ? "rotate-180" : ""
                  } ${
                    isMoreActive
                      ? "text-[var(--accent)]"
                      : openDropdown === "more"
                      ? "text-[var(--text-main)]"
                      : "text-[var(--text-muted)]"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === "more" && (
                <div
                  role="menu"
                  className="absolute left-0 mt-1.5 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100 z-50"
                >
                  <Link
                    href="/about"
                    role="menuitem"
                    onClick={() => setOpenDropdown(null)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname === "/about"
                        ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className={`font-medium text-xs sm:text-sm ${pathname === "/about" ? "text-[var(--accent)] font-semibold" : "text-[var(--text-main)]"}`}>
                      About
                    </div>
                    <div className={`text-xs ${pathname === "/about" ? "text-[var(--accent)] opacity-85" : "text-[var(--text-muted)]"}`}>
                      About this Website
                    </div>
                  </Link>
                  <Link
                    href="/contribute"
                    role="menuitem"
                    onClick={() => setOpenDropdown(null)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors mt-0.5 ${
                      pathname === "/contribute"
                        ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                        : "hover:bg-[var(--bg-elevated)] text-[var(--text-main)]"
                    }`}
                  >
                    <div className={`font-medium text-xs sm:text-sm ${pathname === "/contribute" ? "text-[var(--accent)] font-semibold" : "text-[var(--text-main)]"}`}>
                      Contribute
                    </div>
                    <div className={`text-xs ${pathname === "/contribute" ? "text-[var(--accent)] opacity-85" : "text-[var(--text-muted)]"}`}>
                      Contribution guidelines &amp; templates</div>
                  </Link>
                  <div className="my-1 border-t border-[var(--border-subtle)]" />
                  <a
                    href="https://github.com/PixelStarForge/Od-Lagna"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <span>GitHub Repository</span>
                    <span className="text-xs text-[var(--text-muted)]">↗</span>
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Search trigger & Control buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            onMouseEnter={preloadSearchIndex}
            onFocus={preloadSearchIndex}
            aria-label="Search archive... (press / or Cmd+K)"
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4 shrink-0"
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
            <span className="hidden md:inline">Search archive...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono border rounded bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
              /
            </kbd>
          </button>

          {/* Surprise Me / Random Entry Button */}
          <button
            type="button"
            onClick={handleSurpriseMe}
            disabled={isRolling}
            aria-label="Discover a random lore statement"
            title="Surprise Me — Discover a random spoiler-safe statement"
            className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer group"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isRolling ? "animate-spin text-[var(--accent)]" : "group-hover:rotate-45"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="16" cy="8" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="8" cy="16" r="1.5" fill="currentColor" />
              <circle cx="16" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </button>

          {/* Saved Hub Quick Access */}
          <Link
            href="/saved"
            aria-label={`Saved bookmarks (${bookmarksMounted ? bookmarkCount : 0} items)`}
            title={`Saved bookmarks (${bookmarksMounted ? bookmarkCount : 0} items)`}
            className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
              pathname === "/saved"
                ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={pathname === "/saved" ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={pathname === "/saved" ? 2 : 1.75}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {bookmarksMounted && bookmarkCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-surface)] animate-in zoom-in-75 duration-150" />
            )}
          </Link>

          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Current theme: ${theme}. Click to switch theme.`}
            title={`Current theme: ${theme}. Click to switch.`}
            className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : theme === "light" ? (
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" strokeWidth={2} />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Preferences and Spoiler Settings"
            title="Spoiler & Preferences Settings"
            className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Section: Explore */}
          <div className="space-y-1">
            <div className="px-3 pt-1 pb-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Explore
            </div>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Home</span>
              <span className={`text-xs font-mono ${pathname === "/" ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Index
              </span>
            </Link>
            <Link
              href="/browse"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isBrowseActive
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Browse Q&amp;A</span>
              <span className={`text-xs font-mono ${isBrowseActive ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Archive
              </span>
            </Link>
            <Link
              href="/characters"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCharactersActive
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Characters</span>
              <span className={`text-xs font-mono ${isCharactersActive ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Database
              </span>
            </Link>
            <Link
              href="/anime"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isAnimeActive
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Anime Comments</span>
              <span className={`text-xs font-mono ${isAnimeActive ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Episodes
              </span>
            </Link>
          </div>

          {/* Section: Stories & Lore */}
          <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
            <div className="px-3 pt-1 pb-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Stories &amp; Lore
            </div>
            <Link
              href="/side-stories"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith("/side-stories")
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Side Stories</span>
              <span className={`text-xs font-mono ${pathname?.startsWith("/side-stories") ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Canon
              </span>
            </Link>
            <Link
              href="/ifs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith("/ifs")
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>IF Routes</span>
              <span className={`text-xs font-mono ${pathname?.startsWith("/ifs") ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                What-If
              </span>
            </Link>
          </div>

          {/* Section: Project */}
          <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
            <div className="px-3 pt-1 pb-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Project
            </div>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/about"
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>About</span>
              <span className={`text-xs font-mono ${pathname === "/about" ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Info
              </span>
            </Link>
            <Link
              href="/contribute"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/contribute"
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <span>Contribute</span>
              <span className={`text-xs font-mono ${pathname === "/contribute" ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"}`}>
                Guide
              </span>
            </Link>
            <a
              href="https://github.com/PixelStarForge/Od-Lagna"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <span>GitHub Repository</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">↗</span>
            </a>
          </div>

          {/* Surprise Me / Action button in Mobile */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleSurpriseMe();
              }}
              disabled={isRolling}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    isRolling ? "animate-spin text-[var(--accent)]" : "group-hover:rotate-45"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" />
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                </svg>
                <span>Surprise Me</span>
              </div>
              <span className="text-xs font-mono text-[var(--accent)] font-semibold">Random Lore</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
