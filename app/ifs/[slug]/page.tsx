import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getIfStories, getStoryDetail, getAllQnas, getAllArcs } from "../../../lib/content-loader";
import { StoryDetailClient } from "../../../components/StoryDetailClient";

export async function generateStaticParams() {
  const stories = getIfStories();
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
    return { title: "IF Route Not Found — Od-Lagna" };
  }
  return {
    title: `${story.name} — IF Route — Od-Lagna`,
    description: story.description
      ? `${story.description} — Browse Q&A and supplements for ${story.name}.`
      : `Browse Q&A archive and supplements for ${story.name} from Re:Zero.`,
  };
}

export default async function IfStoryDetailPage({
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
  const arcs = getAllArcs();

  let divergenceArcName: string | null = null;
  if (story.divergesFrom) {
    const arc = arcs.find((a) => a.slug === story.divergesFrom);
    divergenceArcName = arc ? `Arc ${arc.order}: ${arc.name}` : story.divergesFrom;
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-16 text-center text-sm text-[var(--text-muted)] font-mono">
          Loading IF route details...
        </div>
      }
    >
      <StoryDetailClient
        story={story}
        qnaCount={qnaCount}
        divergenceArcName={divergenceArcName}
        baseRoute="/ifs"
      />
    </Suspense>
  );
}
