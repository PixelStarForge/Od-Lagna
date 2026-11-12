"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePreferences, ThemeMode } from "../lib/preferences";
import { SpoilerControls } from "./SpoilerControls";
import { useIsApp } from "../lib/is-app";
import type { Update, DownloadEvent } from "@tauri-apps/plugin-updater";

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, theme, setTheme } = usePreferences();
  const modalRef = useRef<HTMLDivElement>(null);
  const inApp = useIsApp();
  const [appVersion, setAppVersion] = useState<string>("0.1.7");
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  useEffect(() => {
    if (inApp) {
      import("@tauri-apps/api/app")
        .then((m) => m.getVersion())
        .then((v) => setAppVersion(v))
        .catch(() => {});
    }
  }, [inApp]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setCheckStatus("Checking GitHub Releases...");
    setAvailableUpdate(null);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setAvailableUpdate(update);
        setCheckStatus(`Update v${update.version} is available!`);
      } else {
        setCheckStatus("You are on the latest version.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCheckStatus(message || "Could not reach update server (offline).");
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallFromModal = async () => {
    if (!availableUpdate) return;
    setIsUpdating(true);
    setCheckStatus("Downloading update...");
    setUpdateProgress(0);

    try {
      let total = 0;
      let downloaded = 0;
      await availableUpdate.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started") {
          total = event.data?.contentLength || 0;
        } else if (event.event === "Progress") {
          downloaded += event.data?.chunkLength || 0;
          const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
          setUpdateProgress(pct);
          setCheckStatus(`Downloading: ${pct}%`);
        } else if (event.event === "Finished") {
          setUpdateProgress(100);
          setCheckStatus("Installing and relaunching...");
        }
      });

      setTimeout(async () => {
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }, 600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCheckStatus(`Update failed: ${message}`);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 transition-opacity overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          setIsSettingsOpen(false);
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-7 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 sm:zoom-in-95 min-w-0 overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 id="settings-heading" className="text-lg font-bold text-[var(--text-main)]">
              Preferences & Settings
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Customize spoiler gating and display appearance. Changes apply instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close settings dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Section 1: Spoiler Protection */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
              Spoiler Protection
            </h3>
          </div>
          <SpoilerControls idPrefix="settings" />
        </section>

        {/* Section 2: Appearance & Theme */}
        <section className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
              Appearance
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center capitalize cursor-pointer transition-colors ${
                  theme === mode
                    ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {mode === "system" ? "System Auto" : mode}
              </button>
            ))}
          </div>
        </section>

        {/* Section 3: In-App Updates (Desktop / Mobile App only) */}
        {inApp && (
          <section className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Application Updates
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                v{appVersion} Offline App
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-[var(--text-main)]">
                    {availableUpdate ? `Update v${availableUpdate.version} Ready` : "GitHub Releases Auto-Updater"}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {checkStatus || "Automatic background update checks enabled on launch"}
                  </p>
                </div>
                {!availableUpdate ? (
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={isChecking}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border-subtle)] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isChecking ? "Checking..." : "Check for Updates"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallFromModal}
                    disabled={isUpdating}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>{isUpdating ? "Updating..." : "Update Now"}</span>
                  </button>
                )}
              </div>
              {updateProgress !== null && isUpdating && (
                <div className="w-full bg-[var(--bg-surface)] rounded-full h-1.5 overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="bg-[var(--accent-solid)] h-full transition-all duration-300"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer actions */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 cursor-pointer transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
