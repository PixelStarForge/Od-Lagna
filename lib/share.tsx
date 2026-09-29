"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { QnaEntry, TriviaEntry } from "./schema";

export interface ShareContextType {
  isShareOpen: boolean;
  shareEntry: QnaEntry | TriviaEntry | null;
  openShareModal: (entry: QnaEntry | TriviaEntry) => void;
  closeShareModal: () => void;
}

const ShareContext = createContext<ShareContextType | null>(null);

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState<QnaEntry | TriviaEntry | null>(null);

  const openShareModal = useCallback((entry: QnaEntry | TriviaEntry) => {
    setShareEntry(entry);
    setIsShareOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsShareOpen(false);
    // Retain shareEntry briefly during fade-out animation
    setTimeout(() => {
      setShareEntry(null);
    }, 250);
  }, []);

  return (
    <ShareContext.Provider
      value={{
        isShareOpen,
        shareEntry,
        openShareModal,
        closeShareModal,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
}

export function useShareModal(): ShareContextType {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error("useShareModal must be used within a ShareProvider");
  }
  return context;
}
