"use client";

import React from "react";
import Link from "next/link";
import { useIsApp } from "../lib/is-app";

export function Footer() {
  const inApp = useIsApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const linkClass =
    "text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline transition-colors inline-flex items-center gap-1.5 group/link";

  const externalIcon = (
    <svg
      className="w-3 h-3 text-[var(--text-muted)] group-hover/link:text-[var(--accent)] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );

  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-main)] mt-auto pt-12 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand & Mission (Spans 2 columns on lg) */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                Ω
              </span>
              <span className="font-bold text-base text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                Od-Lagna Archive
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
              The definitive canonical archive for <em>Re:Zero kara Hajimeru Isekai Seikatsu</em>. Compiling verified author statements, world chronology, and side stories.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Static Canon Archive</span>
              <span className="text-[var(--border-strong)]">•</span>
              <span>Spoiler Safe</span>
            </div>
          </div>

          {/* Database & Chronology Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
              <span>Database</span>
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/browse" className={linkClass}>
                  Browse Q&amp;As
                </Link>
              </li>
              <li>
                <Link href="/characters" className={linkClass}>
                  Characters
                </Link>
              </li>
              <li>
                <Link href="/timeline" className={linkClass}>
                  World Timeline
                </Link>
              </li>
              <li>
                <Link href="/anime" className={linkClass}>
                  Anime Comments
                </Link>
              </li>
            </ul>
          </div>

          {/* Stories & Guides Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
              <span>Stories &amp; Guides</span>
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/guide" className={linkClass}>
                  Reading Guide
                </Link>
              </li>
              <li>
                <Link href="/side-stories" className={linkClass}>
                  Side Stories
                </Link>
              </li>
              <li>
                <Link href="/ifs" className={linkClass}>
                  IF Routes
                </Link>
              </li>
              <li>
                <Link href="/twitter-short-stories" className={linkClass}>
                  Twitter Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Translations & Web Novel Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
              <span>Translations</span>
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://ncode.syosetu.com/n2267be/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>Syosetu (JP)</span>
                  {externalIcon}
                </a>
              </li>
              <li>
                <a
                  href="https://witchculttranslation.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>Witch Cult</span>
                  {externalIcon}
                </a>
              </li>
              <li>
                <a
                  href="https://eminenttranslations.com/series/rezero-starting-life-in-another-world-wn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>Eminent Trans.</span>
                  {externalIcon}
                </a>
              </li>
              <li>
                <a
                  href="https://chosozo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>ChōSōZō</span>
                  {externalIcon}
                </a>
              </li>
            </ul>
          </div>

          {/* Project & Community Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
              <span>Community</span>
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/PixelStarForge/Od-Lagna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>GitHub</span>
                  {externalIcon}
                </a>
              </li>
              <li>
                <Link href="/contribute" className={linkClass}>
                  Contribute Lore
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  About Archive
                </Link>
              </li>
              {!inApp && (
                <li>
                  <Link href="/download" className={linkClass}>
                    Download App
                  </Link>
                </li>
              )}
              <li>
                <Link href="/saved" className={linkClass}>
                  Saved Bookmarks
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Attribution & Back to Top */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p className="max-w-xl leading-relaxed">
            Unofficial, non-commercial fan archive. <em>Re:Zero kara Hajimeru Isekai Seikatsu</em> is copyright &copy; Tappei Nagatsuki / KADOKAWA.
          </p>

          <div className="flex flex-wrap items-center gap-3 font-mono">
            <Link
              href="/"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline transition-colors"
            >
              Home
            </Link>
            <span className="text-[var(--border-strong)]">•</span>
            <Link
              href="/timeline"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline transition-colors"
            >
              Timeline
            </Link>
            <span className="text-[var(--border-strong)]">•</span>
            <Link
              href="/browse"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline transition-colors"
            >
              Browse
            </Link>
            <span className="text-[var(--border-strong)]">•</span>
            <Link
              href="/guide"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline transition-colors"
            >
              Guide
            </Link>
            <span className="text-[var(--border-strong)]">•</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-2xs"
              aria-label="Scroll back to top"
            >
              <span>Back to top</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
