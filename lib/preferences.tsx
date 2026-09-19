"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface PreferencesContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  spoilerArc: number;
  setSpoilerArc: (arc: number) => void;
  spoilerIf: boolean;
  setSpoilerIf: (include: boolean) => void;
  onboardingSeen: boolean;
  setOnboardingSeen: (seen: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  mounted: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

const STORAGE_KEYS = {
  theme: "od-lagna-theme",
  spoilerArc: "od-lagna-spoiler-arc",
  spoilerIf: "od-lagna-spoiler-if",
  onboardingSeen: "od-lagna-onboarding-seen",
};

const PREF_EVENT = "od-lagna-pref-change";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(PREF_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREF_EVENT, callback);
  };
}

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PREF_EVENT));
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Mounted tracker using useSyncExternalStore
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  // Theme store
  const theme = useSyncExternalStore<ThemeMode>(
    subscribe,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.theme);
        if (stored === "light" || stored === "dark" || stored === "system") {
          return stored;
        }
      } catch {}
      return "system";
    },
    () => "system"
  );

  // Spoiler arc store
  const spoilerArc = useSyncExternalStore<number>(
    subscribe,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.spoilerArc);
        if (stored) {
          const num = parseInt(stored, 10);
          if (!isNaN(num) && num >= 1 && num <= 10) return num;
        }
      } catch {}
      return 1;
    },
    () => 1
  );

  // Spoiler IF store
  const spoilerIf = useSyncExternalStore<boolean>(
    subscribe,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.spoilerIf);
        return stored === "true";
      } catch {}
      return false;
    },
    () => false
  );

  // Onboarding seen store
  const onboardingSeen = useSyncExternalStore<boolean>(
    subscribe,
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.onboardingSeen);
        return stored === "true";
      } catch {}
      return false;
    },
    () => true
  );

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;

    const applyTheme = (mode: ThemeMode) => {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
      } else if (mode === "light") {
        root.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, newTheme);
      notifyChange();
    } catch (e) {
      console.warn("Could not save theme:", e);
    }
  };

  const setSpoilerArc = (arc: number) => {
    const clamped = Math.max(1, Math.min(10, arc));
    try {
      localStorage.setItem(STORAGE_KEYS.spoilerArc, clamped.toString());
      notifyChange();
    } catch (e) {
      console.warn("Could not save spoiler arc:", e);
    }
  };

  const setSpoilerIf = (include: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.spoilerIf, include ? "true" : "false");
      notifyChange();
    } catch (e) {
      console.warn("Could not save spoiler IF:", e);
    }
  };

  const setOnboardingSeen = (seen: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.onboardingSeen, seen ? "true" : "false");
      notifyChange();
    } catch (e) {
      console.warn("Could not save onboarding state:", e);
    }
  };

  // Keyboard shortcut listener for Cmd+K and /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        spoilerArc,
        setSpoilerArc,
        spoilerIf,
        setSpoilerIf,
        onboardingSeen,
        setOnboardingSeen,
        isSettingsOpen,
        setIsSettingsOpen,
        isSearchOpen,
        setIsSearchOpen,
        mounted,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
