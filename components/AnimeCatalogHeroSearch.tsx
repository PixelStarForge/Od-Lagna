"use client";

import React, { useState } from "react";
import { AnimeSearchBar } from "./AnimeSearchBar";
import { AnimeSearchModal } from "./AnimeSearchModal";
import { FlatAnimeComment } from "../lib/schema";

interface AnimeCatalogHeroSearchProps {
  allComments: FlatAnimeComment[];
}

export function AnimeCatalogHeroSearch({ allComments }: AnimeCatalogHeroSearchProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-2xl">
        <AnimeSearchBar
          placeholder="Search 4,000+ author live-tweets, characters, and lore..."
          onClick={() => setIsModalOpen(true)}
          badgeText="All Seasons"
        />
      </div>

      <AnimeSearchModal
        isOpen={isModalOpen}
        onOpen={() => setIsModalOpen(true)}
        onClose={() => setIsModalOpen(false)}
        allComments={allComments}
      />
    </>
  );
}
