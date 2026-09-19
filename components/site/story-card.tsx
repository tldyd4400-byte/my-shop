import Image from "next/image";
import Link from "next/link";

import type { Story } from "@/lib/content/types";

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="story-card">
      <Image
        src={story.image}
        alt={story.imageAlt}
        width={640}
        height={360}
      />
      <p>
        {story.category} · {story.readingTime}
      </p>
      <h2>
        <Link href={`/stories/${story.slug}`}>{story.title}</Link>
      </h2>
      <p>{story.description}</p>
    </article>
  );
}
