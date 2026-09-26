"use client";

import React, { useState } from "react";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  template: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "new-qna",
    title: "1. New Q&A Submission",
    description: "Submit a newly discovered author tweet, convention response, or interview statement.",
    template: `### Question
[Enter the fan, interviewer, or event question here]

### Author Answer
[Enter Tappei Nagatsuki's direct answer here]

### Statement Date & Time (Optional)
YYYY-MM-DD (e.g., 2018-04-01 or 2021-09-23T14:30:00Z)

### Story Arc or IF Route
[e.g., Arc 4, Arc 6, Pride IF, Greed IF, or General]

### Characters Involved
[e.g., Natsuki Subaru, Emilia, Beatrice, Roswaal L. Mathers]

### Topics
[e.g., Mana & Magic, Authorities, Powerscaling, Ranking]

### Primary Source Citation / Link
[Paste Twitter link, archive.org URL, or published interview scan]`,
  },
  {
    id: "correction",
    title: "2. Correction or Source Verification",
    description: "Fix a mistranslation, typo, incorrect arc assignment, or provide a primary source for an Unverified entry.",
    template: `### Entry ID
#0000 (e.g., #0006)

### Type of Update
- [ ] Primary Source Verification (Provide official tweet / citation)
- [ ] Translation / Phrasing Correction
- [ ] Character or Topic Tag Correction
- [ ] Story Arc / Spoiler Threshold Adjustment

### Existing Content
[Quote the current text or state what is currently shown]

### Proposed Correction
[Provide the corrected translation, new tags, or exact source link]

### Reference Proof
[Link to primary Japanese text, tweet archive, or raw screenshot]`,
  },
  {
    id: "general-query",
    title: "3. General Lore Query or Tag Suggestion",
    description: "Suggest a new character registry, discuss an ambiguous IF route divergence, or report an issue.",
    template: `### Subject / Category
[e.g., New Character Tag Request / Arc Divergence Discussion / Website Bug]

### Details & Context
[Describe your query, suggestion, or observation in detail]

### Relevant Q&A Entries (if any)
[e.g., #0004, #0020]`,
  },
];

export function ContributionTemplates() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {TEMPLATES.map((item) => {
        const isCopied = copiedId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 transition-all hover:border-[var(--border-strong)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(item.id, item.template)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-mono font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <span className="text-[var(--verified-text)] font-semibold">
                      ✓ Copied to Clipboard
                    </span>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy Template</span>
                    </>
                  )}
                </button>

                <a
                  href="https://github.com/PixelStarForge/Od-Lagna/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  <span>Open Issue</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs sm:text-sm font-mono text-[var(--text-muted)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {item.template}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}
