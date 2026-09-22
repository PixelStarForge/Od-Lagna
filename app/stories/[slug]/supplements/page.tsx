import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllIfRoutes, getStoryDetail } from "../../../../lib/content-loader";
import { SupplementsClient } from "../../../../components/SupplementsClient";

export async function generateStaticParams() {
  const stories = getAllIfRoutes();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStoryDetail(slug);
  if (!story) {
    return { title: "Supplements Not Found — Od-Lagna" };
  }
  return {
    title: `Supplements — ${story.name} — Od-Lagna`,
    description: `Author comments and supplementary lore for ${story.name} from Re:Zero.`,
  };
}

export default async function SupplementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStoryDetail(slug);
  if (!story) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-16 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading supplements...
        </div>
      }
    >
      <SupplementsClient story={story} baseRoute={story.type === "side-story" ? "/side-stories" : "/ifs"} />
    </Suspense>
  );
}
