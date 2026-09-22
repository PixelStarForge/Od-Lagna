import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSideStories, getStoryDetail, getAllQnas } from "../../../lib/content-loader";
import { StoryDetailClient } from "../../../components/StoryDetailClient";

export async function generateStaticParams() {
  const stories = getSideStories();
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
    return { title: "Side Story Not Found — Od-Lagna" };
  }
  return {
    title: `${story.name} — Side Story — Od-Lagna`,
    description: story.description
      ? `${story.description} — Browse Q&A and supplements for ${story.name}.`
      : `Browse Q&A archive and supplements for canonical side story ${story.name} from Re:Zero.`,
  };
}

export default async function SideStoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStoryDetail(slug);
  if (!story) {
    notFound();
  }

  const allQnas = getAllQnas();
  const qnaCount = allQnas.filter((q) => q.arc === slug).length;

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-16 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading side story details...
        </div>
      }
    >
      <StoryDetailClient
        story={story}
        qnaCount={qnaCount}
        divergenceArcName={null}
        baseRoute="/side-stories"
      />
    </Suspense>
  );
}
