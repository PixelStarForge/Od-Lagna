"use client";

import React from "react";
import { PreferencesProvider } from "../lib/preferences";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SettingsModal } from "./SettingsModal";
import { OnboardingModal } from "./OnboardingModal";
import { SearchModal } from "./SearchModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <div className="flex flex-col min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SettingsModal />
        <OnboardingModal />
        <SearchModal />
      </div>
    </PreferencesProvider>
  );
}
