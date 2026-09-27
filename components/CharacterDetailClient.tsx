"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CharacterCatalogItem } from "../lib/content-loader";
import { QnaEntry, TriviaEntry } from "../lib/schema";
import { QnaCard } from "./QnaCard";
import { TriviaCard } from "./TriviaCard";
import { usePreferences } from "../lib/preferences";
import { getArcMetadata, isArcSpoiler } from "../lib/arc-utils";

interface CharacterDetailClientProps {
  character: CharacterCatalogItem;
  qnas: QnaEntry[];
  trivia: TriviaEntry[];
}

const PREVIEW_LIMIT = 4;

export function CharacterDetailClient({
  character,
  qnas,
  trivia,
}: CharacterDetailClientProps) {
  const { spoilerArc, allowedIfRoutes, mounted } = usePreferences();
  const [isManuallyRevealed, setIsManuallyRevealed] = useState(false);

  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});

  const arcMeta = getArcMetadata(character.arc);
  const isSpoiled = mounted && isArcSpoiler(character.arc, spoilerArc, allowedIfRoutes);
  const isShielded = isSpoiled && !isManuallyRevealed;

  const previewTrivia = trivia.slice(0, PREVIEW_LIMIT);
  const previewQnas = qnas.slice(0, PREVIEW_LIMIT);

  const toggleItemReveal = (key: string) => {
    setRevealedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation & Back Link */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)]"
        >
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/characters" className="hover:text-[var(--accent)] transition-colors">
            Characters
          </Link>
          <span>/</span>
          <span className="text-[var(--text-main)] font-semibold truncate max-w-[200px] sm:max-w-none">
            {character.name}
          </span>
        </nav>

        <Link
          href="/characters"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline shrink-0"
        >
          <span>← All Characters</span>
        </Link>
      </div>

      {/* Spoiler Warning Banner if character's debut arc is beyond user's cutoff */}
      {isShielded ? (
        <div className="p-6 sm:p-8 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-[var(--text-main)]">
              Spoiler Protection Shield
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {character.name} appears in <strong>{arcMeta.name}</strong>, which is beyond your
              configured spoiler cutoff (Arc {spoilerArc}).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManuallyRevealed(true)}
            className="px-4 py-2 rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Reveal Character Details Anyway
          </button>
        </div>
      ) : null}

      {/* Main Character Profile Card */}
      <section
        className={`p-5 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-6 transition-all ${
          isShielded ? "filter blur-sm pointer-events-none select-none opacity-40" : ""
        }`}
      >
        {/* Header: Name, Japanese Name, Debut Arc Badge, Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
                Debut: {arcMeta.name}
              </span>
              {character.link && (
                <a
                  href={character.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                >
                  <span>Wiki Profile</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
                {character.name}
              </h1>
              {character.japaneseName && (
                <p className="text-sm sm:text-base font-medium text-[var(--text-muted)] font-mono">
                  {character.japaneseName}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
              <strong>{qnas.length}</strong> Q&amp;A{qnas.length !== 1 ? "s" : ""}
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
              <strong>{trivia.length}</strong> Trivia Statement{trivia.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Profile Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {character.gender && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
              <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Gender
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                {character.gender}
              </p>
            </div>
          )}

          {character.race && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
              <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Race
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                {character.race}
              </p>
            </div>
          )}

          {character.birthday && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
              <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Birthday
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                {character.birthday}
              </p>
            </div>
          )}

          {character.age && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
              <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Age
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                {character.age}
              </p>
            </div>
          )}

          {/* Affiliations with Badge Chips */}
          {character.affiliation && character.affiliation.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 col-span-2 sm:col-span-4">
              <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Affiliation
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {character.affiliation.map((aff) => (
                  <span
                    key={aff}
                    className="inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] font-medium"
                  >
                    {aff}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Aliases with Per-Item Arc Spoiler Protection */}
          {character.aliases && character.aliases.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 col-span-2 sm:col-span-4">
              <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Known Aliases
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {character.aliases.map((alias) => {
                  const aliasArcMeta = getArcMetadata(alias.arc);
                  const isAliasSpoiled =
                    mounted && isArcSpoiler(alias.arc, spoilerArc, allowedIfRoutes);
                  const itemKey = `alias-${alias.name}`;
                  const isRevealed = revealedItems[itemKey];

                  if (isAliasSpoiled && !isRevealed) {
                    return (
                      <button
                        key={alias.name}
                        type="button"
                        onClick={() => toggleItemReveal(itemKey)}
                        title={`Contains spoiler from ${aliasArcMeta.name}. Click to reveal.`}
                        className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <span>⚠️ Spoiler ({aliasArcMeta.name.split(":")[0]})</span>
                        <span className="text-[10px] font-semibold underline">Reveal</span>
                      </button>
                    );
                  }

                  return (
                    <span
                      key={alias.name}
                      className="inline-flex items-center text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] font-medium"
                    >
                      {alias.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bio / Description */}
        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Overview &amp; Background
            </p>
            {character.link && (
              <a
                href={character.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                <span>Re:Zero Wiki</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {character.description}
          </p>
        </div>

        {/* Divine Protections (Mutually exclusive with Authorities) */}
        {character.divineProtections && character.divineProtections.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Divine Protections ({character.divineProtections.length})
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {character.divineProtections.map((dp) => {
                const dpArcMeta = getArcMetadata(dp.arc);
                const isItemSpoiled =
                  mounted && isArcSpoiler(dp.arc, spoilerArc, allowedIfRoutes);
                const itemKey = `dp-${dp.name}`;
                const isRevealed = revealedItems[itemKey];

                if (isItemSpoiled && !isRevealed) {
                  return (
                    <button
                      key={dp.name}
                      type="button"
                      onClick={() => toggleItemReveal(itemKey)}
                      title={`Contains spoiler from ${dpArcMeta.name}. Click to reveal.`}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <span>⚠️ Spoiler ({dpArcMeta.name.split(":")[0]})</span>
                      <span className="text-[10px] font-semibold underline">Reveal</span>
                    </button>
                  );
                }

                return (
                  <span
                    key={dp.name}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] font-medium"
                  >
                    {dp.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Authorities (Mutually exclusive with Divine Protections) */}
        {character.authorities && character.authorities.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Authorities ({character.authorities.length})
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {character.authorities.map((auth) => {
                const authArcMeta = getArcMetadata(auth.arc);
                const isItemSpoiled =
                  mounted && isArcSpoiler(auth.arc, spoilerArc, allowedIfRoutes);
                const itemKey = `auth-${auth.name}`;
                const isRevealed = revealedItems[itemKey];

                if (isItemSpoiled && !isRevealed) {
                  return (
                    <button
                      key={auth.name}
                      type="button"
                      onClick={() => toggleItemReveal(itemKey)}
                      title={`Contains spoiler from ${authArcMeta.name}. Click to reveal.`}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <span>⚠️ Spoiler ({authArcMeta.name.split(":")[0]})</span>
                      <span className="text-[10px] font-semibold underline">Reveal</span>
                    </button>
                  );
                }

                return (
                  <span
                    key={auth.name}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-[var(--accent-bg)] border border-[var(--accent-border)] text-[var(--accent-text)] font-medium"
                  >
                    {auth.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Related Trivia Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
              <span>Character Trivia</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                {trivia.length}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Verified author tweets, comments, and supplementary trivia statements regarding {character.name}.
            </p>
          </div>

          {trivia.length > 0 && (
            <Link
              href={`/browse?character=${encodeURIComponent(character.name)}&type=trivia`}
              className="text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Browse All ({trivia.length}) in Archive</span>
              <span>→</span>
            </Link>
          )}
        </div>

        {trivia.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-2">
            <p className="text-sm text-[var(--text-muted)]">
              No standalone trivia entries currently indexed for {character.name}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {previewTrivia.map((entry) => (
                <TriviaCard key={entry.id} entry={entry} />
              ))}
            </div>

            {trivia.length > PREVIEW_LIMIT && (
              <div className="pt-2 text-center">
                <Link
                  href={`/browse?character=${encodeURIComponent(character.name)}&type=trivia`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <span>Show More Trivia ({trivia.length - PREVIEW_LIMIT} more)</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Related Q&A Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
              <span>Author Q&amp;As</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                {qnas.length}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Q&amp;A sessions, anniversary threads, and author answers featuring {character.name}.
            </p>
          </div>

          {qnas.length > 0 && (
            <Link
              href={`/browse?character=${encodeURIComponent(character.name)}&type=qna`}
              className="text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Browse All ({qnas.length}) in Archive</span>
              <span>→</span>
            </Link>
          )}
        </div>

        {qnas.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-2">
            <p className="text-sm text-[var(--text-muted)]">
              No Q&amp;A entries currently tagged with {character.name}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {previewQnas.map((entry) => (
                <QnaCard key={entry.id} entry={entry} />
              ))}
            </div>

            {qnas.length > PREVIEW_LIMIT && (
              <div className="pt-2 text-center">
                <Link
                  href={`/browse?character=${encodeURIComponent(character.name)}&type=qna`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <span>Show More Q&amp;As ({qnas.length - PREVIEW_LIMIT} more)</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
