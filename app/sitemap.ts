import { MetadataRoute } from "next";
import { getAllIfRoutes, getAllCharacterProfiles } from "../lib/content-loader";
import { getAnimeCatalog, getAllEpisodeParams } from "../lib/anime-loader";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://od-lagna.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/characters`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/anime`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/saved`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contribute`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Anime Seasons
  const animeSeasons = getAnimeCatalog();
  const animeSeasonRoutes: MetadataRoute.Sitemap = animeSeasons.map((season) => ({
    url: `${SITE_URL}/anime/${season.id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  // Anime Episodes
  const animeEpisodes = getAllEpisodeParams();
  const animeEpisodeRoutes: MetadataRoute.Sitemap = animeEpisodes.map((ep) => ({
    url: `${SITE_URL}/anime/${ep.season}/${ep.episode}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Story & IF Routes
  const stories = getAllIfRoutes();
  const storyRoutes: MetadataRoute.Sitemap = stories.map((story) => {
    const basePath = story.type === "side-story" ? "side-stories" : "ifs";
    return {
      url: `${SITE_URL}/${basePath}/${story.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    };
  });

  // Character detail pages
  const characters = getAllCharacterProfiles();
  const characterRoutes: MetadataRoute.Sitemap = characters.map((char) => ({
    url: `${SITE_URL}/characters?id=${char.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...animeSeasonRoutes,
    ...animeEpisodeRoutes,
    ...storyRoutes,
    ...characterRoutes,
  ];
}
