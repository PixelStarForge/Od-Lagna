"use client";

import React from "react";
import Link from "next/link";
import { useIsApp } from "../lib/is-app";

export function HomeDownloadSection() {
  const inApp = useIsApp();

  // Do not show the download banner if the user is already inside the installed application
  if (inApp) return null;

  return (
    <section className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:border-[var(--border-strong)]">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)]">
          <span>Desktop &amp; Mobile</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
          Download Offline App
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl leading-relaxed">
          Access all 4,100+ Q&amp;As, side stories, and world chronology offline without an internet connection. Available for Windows, Linux, macOS, Android, and iOS.
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        <Link
          href="/download"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent-solid)] text-white hover:bg-[var(--accent-solid-hover)] transition-colors shadow-xs"
        >
          <span>Get Application</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

