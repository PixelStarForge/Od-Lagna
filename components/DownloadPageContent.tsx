"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useIsApp } from "../lib/is-app";

interface PlatformInfo {
  id: string;
  name: string;
  osName: string;
  arch: string;
  format: string;
  recommendedExt: string;
  description: string;
  defaultFilename: string;
  downloadUrl: string;
}

const REPO_URL = "https://github.com/PixelStarForge/Od-Lagna";
const RELEASES_URL = `${REPO_URL}/releases/latest`;

function getDetectedOs(): string {
  if (typeof navigator === "undefined") return "linux";
  const ua = (navigator.userAgent || "").toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  const clientPlatform = ((navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || "").toLowerCase();

  // Android check (Android UA contains 'linux', so check android first)
  if (/android/i.test(ua)) return "android";
  // iOS check
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // macOS check
  if (/mac/i.test(ua) || /mac/i.test(platform) || clientPlatform === "macos") return "macos";
  // Linux check (Arch, CachyOS, Ubuntu, Debian, Fedora, generic Linux/X11)
  if (/linux/i.test(ua) || /linux/i.test(platform) || /x11/i.test(ua) || clientPlatform === "linux") {
    return "linux";
  }
  // Windows check
  if (/win/i.test(ua) || /win/i.test(platform) || clientPlatform === "windows") return "windows";

  return "linux";
}

export function DownloadPageContent() {
  const inApp = useIsApp();
  const [releaseAssets, setReleaseAssets] = useState<Record<string, string>>({});

  const detectedOs = useSyncExternalStore(
    () => () => {},
    getDetectedOs,
    () => "linux"
  );

  useEffect(() => {
    // Dynamically retrieve latest uploaded asset download URLs from GitHub Releases API
    fetch("https://api.github.com/repos/PixelStarForge/Od-Lagna/releases/latest")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.assets)) return;
        const map: Record<string, string> = {};
        for (const asset of data.assets) {
          const name = String(asset.name || "").toLowerCase();
          const url = asset.browser_download_url;
          if (name.endsWith(".appimage")) map["linux"] = url;
          else if (name.endsWith(".deb")) map["linux-deb"] = url;
          else if (name.endsWith(".exe") && (name.includes("arm64") || name.includes("aarch64"))) map["windows-arm"] = url;
          else if (name.endsWith(".exe") || name.endsWith(".msi")) map["windows"] = url;
          else if (name.endsWith(".dmg")) map["macos"] = url;
          else if (name.endsWith(".apk")) map["android"] = url;
          else if (name.endsWith(".ipa")) map["ios"] = url;
        }
        setReleaseAssets(map);
      })
      .catch(() => {
        // Silently fall back to standard direct asset endpoints
      });
  }, []);

  const platforms: PlatformInfo[] = [
    {
      id: "linux",
      name: "Linux (AppImage)",
      osName: "Linux",
      arch: "x86_64 / ARM64",
      format: ".AppImage",
      recommendedExt: ".AppImage",
      description: "Universal standalone binary for Arch Linux, CachyOS, Ubuntu, Fedora, and all distributions.",
      defaultFilename: "Od-Lagna.AppImage",
      downloadUrl: `${RELEASES_URL}/download/Od-Lagna.AppImage`,
    },
    {
      id: "linux-deb",
      name: "Linux (.deb)",
      osName: "Linux Debian",
      arch: "x86_64 / ARM64",
      format: ".deb",
      recommendedExt: ".deb",
      description: "Native package installer for Debian, Ubuntu, Linux Mint, and derivatives.",
      defaultFilename: "od-lagna_amd64.deb",
      downloadUrl: `${RELEASES_URL}/download/od-lagna_amd64.deb`,
    },
    {
      id: "windows",
      name: "Windows (x86_64)",
      osName: "Windows",
      arch: "64-bit Intel / AMD",
      format: ".msi / .exe",
      recommendedExt: ".msi",
      description: "For Windows 10 & 11 (standard 64-bit PCs).",
      defaultFilename: "Od-Lagna_x64-setup.exe",
      downloadUrl: `${RELEASES_URL}/download/Od-Lagna_x64-setup.exe`,
    },
    {
      id: "windows-arm",
      name: "Windows (ARM64)",
      osName: "Windows ARM",
      arch: "64-bit ARM (Snapdragon X / Surface)",
      format: ".msi",
      recommendedExt: ".msi",
      description: "Optimized native build for Snapdragon X Elite and Surface ARM PCs.",
      defaultFilename: "Od-Lagna_arm64-setup.exe",
      downloadUrl: `${RELEASES_URL}/download/Od-Lagna_arm64-setup.exe`,
    },
    {
      id: "macos",
      name: "macOS Universal",
      osName: "macOS",
      arch: "Apple Silicon (M1–M4) & Intel",
      format: ".dmg",
      recommendedExt: ".dmg",
      description: "Single universal disk image supporting Apple Silicon & Intel Macs.",
      defaultFilename: "Od-Lagna_universal.dmg",
      downloadUrl: `${RELEASES_URL}/download/Od-Lagna_universal.dmg`,
    },
    {
      id: "android",
      name: "Android (.apk)",
      osName: "Android",
      arch: "ARM64 & x86_64",
      format: ".apk",
      recommendedExt: ".apk",
      description: "Direct APK install for Android 7.0+.",
      defaultFilename: "od-lagna.apk",
      downloadUrl: `${RELEASES_URL}/download/od-lagna.apk`,
    },
    {
      id: "ios",
      name: "iOS (.ipa)",
      osName: "iOS",
      arch: "iPhone & iPad",
      format: ".ipa",
      recommendedExt: ".ipa",
      description: "Sideloadable IPA package compatible with AltStore, Sideloadly, or TrollStore.",
      defaultFilename: "od-lagna.ipa",
      downloadUrl: `${RELEASES_URL}/download/od-lagna.ipa`,
    },
  ];

  const primary = platforms.find((p) => p.id === detectedOs) || platforms[0];
  const primaryDownloadUrl = releaseAssets[primary.id] || primary.downloadUrl;

  if (inApp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--verified-bg)] border border-[var(--verified-border)] text-[var(--verified-text)] flex items-center justify-center text-3xl font-bold font-mono">
          Ω
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
          You are using the Od-Lagna App!
        </h1>
        <p className="text-[var(--text-muted)] max-w-md mx-auto leading-relaxed text-sm">
          You are already running the offline application. Updates are automatically checked and applied directly in the app.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            Back to Archive Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* Header / Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Offline Canon Archive</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-main)]">
          Download Od-Lagna
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
          Access the complete Re:Zero canon database offline anywhere. 4,100+ verified Q&amp;As,
          world chronology, side stories, and character profiles stored directly on your device.
        </p>
      </div>

      {/* Auto-detected Primary Download Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-all shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold">
                Detected Platform
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {primary.arch}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
              {primary.name}
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xl leading-relaxed">
              {primary.description}
            </p>
          </div>

          <div className="shrink-0">
            <a
              href={primaryDownloadUrl}
              download={primary.defaultFilename}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-sm font-semibold shadow-xs transition-colors text-center cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download for {primary.osName}</span>
            </a>
          </div>
        </div>
      </div>

      {/* All Platforms Download Matrix */}
      <section className="space-y-6" aria-labelledby="all-platforms-heading">
        <div className="border-b border-[var(--border-subtle)] pb-4">
          <h2 id="all-platforms-heading" className="text-xl font-bold text-[var(--text-main)]">
            All Operating Systems &amp; Architectures
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Select your platform to download the installer directly to your device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((p) => {
            const fileUrl = releaseAssets[p.id] || p.downloadUrl;
            const isDetected = p.id === detectedOs;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                  isDetected
                    ? "border-[var(--accent-border)] bg-[var(--accent-bg)]/25"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-[var(--text-main)] flex items-center gap-2">
                      <span>{p.name}</span>
                      {isDetected && (
                        <span className="text-[10px] font-mono uppercase border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] px-1.5 py-0.2 rounded font-semibold">
                          Your OS
                        </span>
                      )}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {p.format}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
                  <span className="font-mono text-[var(--text-muted)] text-[11px]">
                    {p.arch}
                  </span>
                  <a
                    href={fileUrl}
                    download={p.defaultFilename}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--accent-solid)] hover:text-white border border-[var(--border-subtle)] font-medium transition-colors cursor-pointer text-xs"
                  >
                    Download {p.recommendedExt}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
