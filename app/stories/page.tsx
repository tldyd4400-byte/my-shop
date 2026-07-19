import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { HeroMedia } from "@/components/site/hero-media";
import { ReservationCta } from "@/components/site/reservation-cta";
import { StoryCard } from "@/components/site/story-card";
import { STORIES } from "@/lib/content/stories";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";

const STORIES_PATH = "/stories";
const STORIES_TITLE = "어믜뜰 이야기 | 청주 맛집·등갈비찜 가이드";
const STORIES_DESCRIPTION =
  "등갈비찜을 즐기는 법, 셀프바, 청주 봉명동 가족 외식 정보를 확인하세요.";

export const metadata = createPageMetadata({
  title: STORIES_TITLE,
  description: STORIES_DESCRIPTION,
  path: STORIES_PATH,
});

export default function StoriesPage() {
  return (
    <main className="stories-index">
      <JsonLd
        data={[
          collectionPageSchema({
            name: STORIES_TITLE,
            description: STORIES_DESCRIPTION,
            path: STORIES_PATH,
            items: STORIES,
          }),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "이야기", path: STORIES_PATH },
          ]),
        ]}
      />

      <HeroMedia
        eyebrow="STORIES · 청주 봉명동 맛집 이야기"
        title={
          <>
            메뉴를 알면
            <br />한 상이 더 즐거워집니다
          </>
        }
        description="등갈비찜을 맛있게 즐기는 법부터 가족 외식과 방문 정보까지 어믜뜰을 더 잘 경험할 수 있는 이야기를 전합니다."
        image="/images/eomeuittul/hero-table.jpg"
        imageAlt="어믜뜰 등갈비찜 한 상"
      >
        <Link className="button button-primary" href="#story-list">
          추천 이야기 읽기
        </Link>
      </HeroMedia>

      <section id="story-list" className="stories-featured section-pad">
        <div className="shell story-listing">
          <div className="section-heading">
            <h2>처음 방문한다면 먼저 읽어보세요</h2>
            <p>메뉴 선택과 방문 결정을 돕는 대표 이야기입니다.</p>
          </div>
          <div className="story-grid">
            {STORIES.slice(0, 2).map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        </div>
      </section>

      <section className="stories-more section-pad">
        <div className="shell story-listing">
          <div className="section-heading">
            <h2>식사 경험을 더 풍성하게</h2>
            <p>재료 선택과 메뉴 취향을 자세히 안내합니다.</p>
          </div>
          <div className="story-grid">
            {STORIES.slice(2).map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        </div>
      </section>

      <ReservationCta placement="stories_bottom" />
    </main>
  );
}
