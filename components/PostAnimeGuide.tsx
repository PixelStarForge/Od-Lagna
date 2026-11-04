"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReadingGuideData } from "../lib/schema";

interface PostAnimeGuideProps {
  guide: ReadingGuideData;
}

export function PostAnimeGuide({ guide }: PostAnimeGuideProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Header Section */}
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8 sm:pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Post-Anime Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
          {guide.title}
        </h1>
        <p className="text-base sm:text-xl text-[var(--text-muted)] leading-relaxed max-w-3xl">
          {guide.subtitle}
        </p>
      </div>

      {/* Section 1: Formats & Terminologies */}
      <section className="space-y-6" aria-labelledby="terminologies-heading">
        <div className="space-y-1.5 border-b border-[var(--border-subtle)] pb-3">
          <h2
            id="terminologies-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]"
          >
            Formats &amp; Terminologies
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)]">
            Overview of the primary written and adapted formats of Re:Zero.
          </p>
        </div>

        {/* Detailed documentation prose for each format */}
        <div className="space-y-6">
          {guide.terminologies.map((term) => (
            <div key={term.id} className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3.5 shadow-2xs">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                  {term.title}
                </h3>
                <span className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">
                  ({term.badge})
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
                  {term.status.trim()}
                </span>
              </div>
              <p className="text-base sm:text-lg text-[var(--text-main)]/90 leading-relaxed">
                {term.description}
              </p>

              {/* Web Novel Translation Links */}
              {term.id === "wn" && (
                <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] space-y-2.5">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Reading &amp; Translation Sources
                  </div>
                  <ul className="space-y-2 text-sm sm:text-base">
                    <li className="flex flex-wrap items-baseline gap-2">
                      <a
                        href="https://ncode.syosetu.com/n2267be/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Shōsetsuka ni Narō</span>
                        <span className="text-xs">↗</span>
                      </a>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)]">(Original Japanese Web Novel)</span>
                    </li>
                    <li className="flex flex-wrap items-baseline gap-2">
                      <a
                        href="https://witchculttranslation.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Witch Cult Translations</span>
                        <span className="text-xs">↗</span>
                      </a>
                    </li>
                    <li className="flex flex-wrap items-baseline gap-2">
                      <a
                        href="https://eminenttranslations.com/series/rezero-starting-life-in-another-world-wn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Eminent Translations</span>
                        <span className="text-xs">↗</span>
                      </a>
                    </li>
                    <li className="flex flex-wrap items-baseline gap-2">
                      <a
                        href="https://chosozo.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>ChōSōZō</span>
                        <span className="text-xs">↗</span>
                      </a>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)]">(latest Arc 10 chapters only)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Technical Comparison Table */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Comparison Table
          </h4>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
            <table className="w-full text-left text-sm sm:text-base border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-mono text-[var(--text-muted)]">
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Attribute</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Light Novel (LN)</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Web Novel (WN)</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Manga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm sm:text-base">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">Type</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Official published commercial book</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Free online serialization</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Serialized comic adaptation</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">Canon Status</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">
                    <span className="font-mono text-xs sm:text-sm text-[var(--verified-text)] font-semibold">Definitive Canon</span>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">
                    <span className="font-mono text-xs sm:text-sm text-[var(--unverified-text)] font-semibold">Author Draft</span>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">
                    <span className="font-mono text-xs sm:text-sm text-[var(--text-muted)] font-semibold">Adaptation</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">Structure</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90 font-mono text-sm">Numbered Volumes</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90 font-mono text-sm">Story Arcs &amp; Chapters</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90 font-mono text-sm">Separate manga per story arc</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">Story Pacing</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Professionally edited and streamlined</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Uncut dialogues, ahead of LN translations</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Lags behind both novels and anime</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">Cost</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Retail purchase (Physical or eBook)</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">100% Free online</td>
                  <td className="py-3.5 px-4 text-[var(--text-main)]/90">Retail purchase per tankōbon volume</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5 shadow-2xs">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                Type
              </div>
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Light Novel (LN): </span>
                  <span className="text-[var(--text-main)]/90">Official published commercial book</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Web Novel (WN): </span>
                  <span className="text-[var(--text-main)]/90">Free online serialization</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Manga: </span>
                  <span className="text-[var(--text-main)]/90">Serialized comic adaptation</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5 shadow-2xs">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                Canon Status
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-main)]">Light Novel (LN): </span>
                  <span className="font-mono text-xs text-[var(--verified-text)] font-semibold">Definitive Canon</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-main)]">Web Novel (WN): </span>
                  <span className="font-mono text-xs text-[var(--unverified-text)] font-semibold">Author Draft</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-main)]">Manga: </span>
                  <span className="font-mono text-xs text-[var(--text-muted)] font-semibold">Adaptation</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5 shadow-2xs">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                Structure
              </div>
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Light Novel (LN): </span>
                  <span className="text-[var(--text-main)]/90 font-mono text-xs">Numbered Volumes</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Web Novel (WN): </span>
                  <span className="text-[var(--text-main)]/90 font-mono text-xs">Story Arcs &amp; Chapters</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Manga: </span>
                  <span className="text-[var(--text-main)]/90 font-mono text-xs">Separate manga per story arc</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5 shadow-2xs">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                Story Pacing
              </div>
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Light Novel (LN): </span>
                  <span className="text-[var(--text-main)]/90">Professionally edited and streamlined</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Web Novel (WN): </span>
                  <span className="text-[var(--text-main)]/90">Uncut dialogues, ahead of LN translations</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Manga: </span>
                  <span className="text-[var(--text-main)]/90">Lags behind both novels and anime</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5 shadow-2xs">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                Cost
              </div>
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Light Novel (LN): </span>
                  <span className="text-[var(--text-main)]/90">Retail purchase (Physical or eBook)</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Web Novel (WN): </span>
                  <span className="text-[var(--text-main)]/90">100% Free online</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-main)]">Manga: </span>
                  <span className="text-[var(--text-main)]/90">Retail purchase per tankōbon volume</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Where to Start Reading */}
      <section className="space-y-6" aria-labelledby="reading-order-heading">
        <div className="space-y-1.5 border-b border-[var(--border-subtle)] pb-3">
          <h2
            id="reading-order-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]"
          >
            Where to Start After Each Anime Season
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)]">
            Exact volume and chapter after anime season.
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
          <table className="w-full text-left text-sm sm:text-base border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-mono text-[var(--text-muted)]">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Completed Anime</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Adapted Scope</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Light Novel Start</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Web Novel Start</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Explore Arc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-sm sm:text-base">
              {guide.seasons.map((season) => (
                <tr key={season.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-[var(--text-main)] whitespace-nowrap">
                    {season.seasonName}
                  </td>
                  <td className="py-4 px-4 text-[var(--text-main)]/90">
                    {season.adaptedCoverage}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-[var(--text-main)] whitespace-nowrap">
                    {season.lnStart.volume}
                  </td>
                  <td className="py-4 px-4 font-mono text-[var(--text-main)]/90 whitespace-nowrap">
                    <span className="font-bold text-[var(--text-main)]">{season.wnStart.arc}</span>, {season.wnStart.chapter.split(":")[0]}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <Link
                      href={`/browse?arc=${season.nextArcSlug}`}
                      className="text-sm font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Arc Q&amp;As</span>
                      <span>→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden space-y-3.5">
          {guide.seasons.map((season) => (
            <div
              key={season.id}
              className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                <h3 className="font-bold text-base text-[var(--text-main)]">
                  {season.seasonName}
                </h3>
                <Link
                  href={`/browse?arc=${season.nextArcSlug}`}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Arc Q&amp;As</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs font-mono uppercase text-[var(--text-muted)] font-semibold block mb-0.5">
                    Adapted Scope
                  </span>
                  <span className="text-[var(--text-main)]/90">
                    {season.adaptedCoverage}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-0.5">
                    <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] font-semibold block">
                      Light Novel Start
                    </span>
                    <span className="font-mono font-bold text-sm sm:text-base text-[var(--text-main)] block">
                      {season.lnStart.volume}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-0.5">
                    <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] font-semibold block">
                      Web Novel Start
                    </span>
                    <span className="font-mono text-sm sm:text-base text-[var(--text-main)] block">
                      <span className="font-bold">{season.wnStart.arc}</span>, {season.wnStart.chapter.split(":")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Frequently Asked Questions */}
      {guide.faqs && guide.faqs.length > 0 && (
        <section className="space-y-6" aria-labelledby="faq-heading">
          <div className="space-y-1.5 border-b border-[var(--border-subtle)] pb-3">
            <h2
              id="faq-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)]">
              Common questions regarding canon validity, reading paths, and adaptations.
            </p>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-2xs">
            {guide.faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left gap-4 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-semibold text-[var(--text-main)]">
                      {faq.q}
                    </span>
                    <span className="text-[var(--text-muted)] text-base font-mono shrink-0">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-4 pt-1 text-base text-[var(--text-main)]/90 leading-relaxed bg-[var(--bg-elevated)]/30 border-t border-[var(--border-subtle)]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
