import { Suspense } from "react";
import { getAllTwitterShortStories } from "../../lib/content-loader";
import { TwitterShortStoriesClient } from "../../components/TwitterShortStoriesClient";

export const metadata = {
  title: "Twitter Short Stories — Od-Lagna",
  description:
    "Explore canonical short stories, birthday threads, and character viewpoints posted to Twitter/X by Re:Zero author Tappei Nagatsuki.",
};

export default function TwitterShortStoriesPage() {
  const stories = getAllTwitterShortStories();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-16 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading Twitter short stories...
        </div>
      }
    >
      <TwitterShortStoriesClient stories={stories} />
    </Suspense>
  );
}
