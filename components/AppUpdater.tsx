"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Update, DownloadEvent } from "@tauri-apps/plugin-updater";
import { isApp } from "../lib/is-app";

interface UpdateState {
  version: string;
  body?: string;
  status: "available" | "downloading" | "installing" | "done" | "error";
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  errorMessage?: string;
}

export function AppUpdater() {
  const [updateInfo, setUpdateInfo] = useState<UpdateState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const updateRef = useRef<Update | null>(null);

  useEffect(() => {
    if (!isApp()) return;

    let mounted = true;

    async function checkUpdates() {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (!mounted) return;

        if (update) {
          updateRef.current = update;
          setUpdateInfo({
            version: update.version,
            body: update.body,
            status: "available",
            progressPercent: 0,
            downloadedBytes: 0,
            totalBytes: 0,
          });
          // Smooth entrance trigger matching the site's modal animations
          requestAnimationFrame(() => setVisible(true));
        }
      } catch (err) {
        // Silently catch network or endpoint errors on launch (e.g. offline)
        console.warn("Update check skipped (offline or server unreachable):", err);
      }
    }

    // Delay check 2.5s after launch to let initial view render smoothly
    const timer = setTimeout(checkUpdates, 2500);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleUpdate = async () => {
    if (!updateRef.current) return;
    const update = updateRef.current;

    try {
      setUpdateInfo((prev) =>
        prev ? { ...prev, status: "downloading", progressPercent: 0 } : null
      );

      let total = 0;
      let downloaded = 0;

      await update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started") {
          total = event.data?.contentLength || 0;
          setUpdateInfo((prev) =>
            prev ? { ...prev, totalBytes: total, downloadedBytes: 0 } : null
          );
        } else if (event.event === "Progress") {
          downloaded += event.data?.chunkLength || 0;
          const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
          setUpdateInfo((prev) =>
            prev
              ? {
                  ...prev,
                  progressPercent: pct,
                  downloadedBytes: downloaded,
                  totalBytes: total,
                }
              : null
          );
        } else if (event.event === "Finished") {
          setUpdateInfo((prev) =>
            prev ? { ...prev, status: "installing", progressPercent: 100 } : null
          );
        }
      });

      setUpdateInfo((prev) => (prev ? { ...prev, status: "done" } : null));

      // Allow 800ms for user to see the success state before restart
      setTimeout(async () => {
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }, 800);
    } catch (err: unknown) {
      console.error("Update installation failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      setUpdateInfo((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              errorMessage: message || "Failed to download and install update.",
            }
          : null
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes <= 0) return "";
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!updateInfo || dismissed) return null;

  return (
    <aside
      aria-label="Application update announcement"
      className={`fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/98 backdrop-blur-md shadow-xl p-4 sm:p-5 transition-all duration-300 ease-out transform ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {updateInfo.status === "available" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span>Update Available</span>
            </div>
          )}
          {updateInfo.status === "downloading" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>Downloading</span>
            </div>
          )}
          {updateInfo.status === "installing" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[var(--unverified-border)] bg-[var(--unverified-bg)] text-[var(--unverified-text)]">
              <span>Applying</span>
            </div>
          )}
          {updateInfo.status === "done" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[var(--verified-border)] bg-[var(--verified-bg)] text-[var(--verified-text)]">
              <span>Ready</span>
            </div>
          )}
          {updateInfo.status === "error" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              <span>Error</span>
            </div>
          )}
        </div>

        {updateInfo.status === "available" && (
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => setDismissed(true), 250);
            }}
            aria-label="Dismiss update notification"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-colors cursor-pointer -mr-1 -mt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-[var(--text-main)] mt-2">
        {updateInfo.status === "available" && `Od-Lagna v${updateInfo.version}`}
        {updateInfo.status === "downloading" && `Downloading v${updateInfo.version}`}
        {updateInfo.status === "installing" && "Installing Update"}
        {updateInfo.status === "done" && "Update Installed"}
        {updateInfo.status === "error" && "Update Failed"}
      </h3>

      {/* Release Notes Body */}
      {updateInfo.body && updateInfo.status === "available" && (
        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {updateInfo.body}
        </p>
      )}

      {/* Animated Progress Bar */}
      {updateInfo.status === "downloading" && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono text-[var(--text-muted)]">
            <span>
              {updateInfo.totalBytes > 0
                ? `${formatSize(updateInfo.downloadedBytes)} / ${formatSize(updateInfo.totalBytes)}`
                : "Downloading..."}
            </span>
            <span className="font-semibold text-[var(--text-main)]">
              {updateInfo.progressPercent > 0 ? `${updateInfo.progressPercent}%` : ""}
            </span>
          </div>

          <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="h-full bg-[var(--accent-solid)] rounded-full transition-all duration-300 ease-out shadow-xs"
              style={{
                width: updateInfo.progressPercent > 0 ? `${updateInfo.progressPercent}%` : "25%",
              }}
            />
          </div>
        </div>
      )}

      {/* Installing Status Feedback */}
      {updateInfo.status === "installing" && (
        <div className="mt-2.5 p-2 rounded-lg border border-[var(--unverified-border)] bg-[var(--unverified-bg)] text-xs text-[var(--unverified-text)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--unverified-text)] animate-ping" />
          <span>Verifying signature &amp; replacing binaries...</span>
        </div>
      )}

      {/* Done Feedback */}
      {updateInfo.status === "done" && (
        <div className="mt-2.5 p-2 rounded-lg border border-[var(--verified-border)] bg-[var(--verified-bg)] text-xs text-[var(--verified-text)] font-medium flex items-center gap-2">
          <span>✓</span>
          <span>Relaunching Od-Lagna...</span>
        </div>
      )}

      {/* Error Feedback */}
      {updateInfo.status === "error" && (
        <div className="mt-2.5 p-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-xs text-[var(--accent-text)]">
          {updateInfo.errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
        {updateInfo.status === "available" && (
          <>
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                setTimeout(() => setDismissed(true), 250);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Update Now</span>
            </button>
          </>
        )}
        {updateInfo.status === "error" && (
          <button
            type="button"
            onClick={handleUpdate}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white shadow-xs transition-colors cursor-pointer"
          >
            Retry Update
          </button>
        )}
      </div>
    </aside>
  );
}
