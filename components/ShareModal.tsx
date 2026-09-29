"use client";

import React, { useState, useEffect, useRef } from "react";
import { toBlob } from "html-to-image";
import { useShareModal } from "../lib/share";
import { QnaEntry, TriviaEntry, getEntrySources } from "../lib/schema";
import { ShareCardView } from "./ShareCardView";
import {
  formatPlainMarkdown,
  formatPlainText,
  formatSourcesOnly,
  getEntryTypeLabel,
} from "../lib/share-utils";

interface ShareModalDialogProps {
  entry: QnaEntry | TriviaEntry;
  onClose: () => void;
}

function ShareModalDialog({ entry, onClose }: ShareModalDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Keyboard accessibility (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Reset copied status after 2.5s
  const showCopied = (action: string) => {
    setCopiedAction(action);
    setTimeout(() => {
      setCopiedAction((prev) => (prev === action ? null : prev));
    }, 2500);
  };

  const typeLabel = getEntryTypeLabel(entry);
  const plainMarkdown = formatPlainMarkdown(entry);
  const plainText = formatPlainText(entry);
  const sourcesOnly = formatSourcesOnly(entry);
  const sources = getEntrySources(entry).filter((s) => s && s.value && s.value.trim().length > 0);
  const filename = `od-lagna-${typeLabel.toLowerCase()}-${entry.id}.png`;

  // Captures the unconstrained off-screen DOM card using html-to-image
  const captureCardBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setIsCapturing(true);
    try {
      const el = cardRef.current;
      const computedBg =
        typeof window !== "undefined"
          ? window.getComputedStyle(el).backgroundColor
          : "#121215";

      const blob = await toBlob(el, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: computedBg || "#121215",
        width: el.offsetWidth || 752,
        height: el.scrollHeight || el.offsetHeight,
      });
      return blob;
    } finally {
      setIsCapturing(false);
    }
  };

  // Helper to trigger browser download
  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Handle Copy Image
  const handleCopyImage = async () => {
    try {
      const blob = await captureCardBlob();
      if (!blob) return;

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof window.ClipboardItem !== "undefined"
      ) {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        showCopied("image");
      } else {
        triggerDownload(blob, filename);
        showCopied("image-download-fallback");
      }
    } catch {
      const blob = await captureCardBlob();
      if (blob) {
        triggerDownload(blob, filename);
        showCopied("image-download-fallback");
      }
    }
  };

  // Handle Download Image
  const handleDownloadImage = async () => {
    try {
      const blob = await captureCardBlob();
      if (!blob) return;
      triggerDownload(blob, filename);
      showCopied("download");
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // Handle Copy Plain Markdown
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(plainMarkdown);
      showCopied("markdown");
    } catch {
      // Fallback
    }
  };

  // Handle Copy Plain Text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      showCopied("text");
    } catch {
      // Fallback
    }
  };

  // Handle Copy Sources Only
  const handleCopySources = async () => {
    try {
      await navigator.clipboard.writeText(sourcesOnly);
      showCopied("sources");
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-heading"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      {/* Hidden off-screen capture container: Rendered with 16px edge padding and full unclipped height */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "752px",
          height: "auto",
          pointerEvents: "none",
          opacity: 0,
          zIndex: -9999,
        }}
      >
        <div
          ref={cardRef}
          style={{
            width: "752px",
            height: "auto",
            padding: "16px",
            backgroundColor: "var(--bg-main)",
            boxSizing: "border-box",
          }}
        >
          <ShareCardView entry={entry} />
        </div>
      </div>

      <div
        ref={modalRef}
        className="w-full sm:max-w-2xl md:max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 sm:zoom-in-95 min-w-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-[var(--accent-border)] text-[var(--accent)] tracking-wider">
                {typeLabel} #{entry.id}
              </span>
              <h2 id="share-heading" className="text-lg font-bold text-[var(--text-main)]">
                Share &amp; Export
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Export high-resolution card image or copy formatted Markdown.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section 1: Exact Card Preview & Image Export */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Card Image Export
            </span>
          </div>

          {/* Card Preview Window in Modal */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-3 sm:p-4 flex justify-center max-h-[340px] overflow-y-auto">
            <div className="w-full max-w-[680px]">
              <ShareCardView entry={entry} />
            </div>
          </div>

          {/* Image Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isCapturing}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
            >
              {copiedAction === "image" ? (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Image Copied!</span>
                </>
              ) : copiedAction === "image-download-fallback" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{isCapturing ? "Capturing..." : "Copy Image"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isCapturing}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50"
            >
              {copiedAction === "download" ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Saved PNG!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PNG</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopySources}
              title="Copy primary source citations and Od-Lagna archive link"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] hover:border-[var(--accent-border)] text-[var(--accent)] hover:text-[var(--accent-hover)] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              {copiedAction === "sources" ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied {sources.length > 1 ? "Sources" : "Source"}!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{sources.length > 1 ? "Copy Sources" : "Copy Source"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Plain Markdown */}
        <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Plain Markdown
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Ready to paste in Reddit comments, Discord &amp; forums
            </span>
          </div>

          {/* Markdown preview box */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] p-3 font-mono text-xs text-[var(--text-muted)] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
            {plainMarkdown}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{copiedAction === "markdown" ? "✓ Copied Markdown!" : "Copy Markdown"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <span>{copiedAction === "text" ? "✓ Copied!" : "Copy Plain Text"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShareModal() {
  const { isShareOpen, shareEntry, closeShareModal } = useShareModal();

  if (!isShareOpen || !shareEntry) return null;

  return <ShareModalDialog entry={shareEntry} onClose={closeShareModal} />;
}
