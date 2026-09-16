import Image from "next/image";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { ProofStrip } from "@/components/site/proof-strip";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { ReservationCta } from "@/components/site/reservation-cta";
import { StoryCard } from "@/components/site/story-card";
import { StoryReadTracker } from "@/components/site/story-read-tracker";
import { getStory, STORIES } from "@/lib/content/stories";
import { FAQ_ITEMS, GALBIJJIM_FAQ_ITEMS, GROUP_FAQ_ITEMS, GROUP_BOOKING_STEPS, MENU_ITEMS, STORE } from "@/lib/content/store";
import { createPageMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/seo/schema";

type StoryPageProps = { params: Promise<{ slug: string }> };

function storyFaqItems(slug: string) {
  if (slug === "cheongju-group-dining") return GROUP_FAQ_ITEMS;
  if (slug === "cheongju-galbijjim-guide") return GALBIJJIM_FAQ_ITEMS;
  if (slug === "family-dining-guide") {
    return [FAQ_ITEMS[2], FAQ_ITEMS[5], FAQ_ITEMS[6], FAQ_ITEMS[7]];
  }

  if (slug === "self-bar-guide") {
    return [FAQ_ITEMS[4], FAQ_ITEMS[5]];
  }

  if (slug === "spicy-or-soy") {
    return [FAQ_ITEMS[4], FAQ_ITEMS[6]];
  }

  return FAQ_ITEMS.slice(4);
}

export function generateStaticParams() {
  return STORIES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = getStory(slug);

  if (!story) {
    return {};
  }

  return createPageMetadata({
    title: `${story.title} | 어믜뜰`,
    description: story.description,
    path: `/stories/${story.slug}`,
    image: story.image,
    type: "article",
  });
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = getStory(slug);

  if (!story) {
    notFound();
  }

  const related = STORIES.filter((item) => item.slug !== story.slug).slice(0, 2);
  const faqs = storyFaqItems(story.slug);
  const isGroupStory = story.slug === "cheongju-group-dining";
  const isGalbijjimStory = story.slug === "cheongju-galbijjim-guide";
  const hasDirectAnswerFaq = isGroupStory || isGalbijjimStory;

  return (
    <main className="story-detail">
      <JsonLd
        data={[
          articleSchema(story),
          ...(hasDirectAnswerFaq ? [faqSchema(faqs)] : []),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "이야기", path: "/stories" },
            { name: story.title, path: `/stories/${story.slug}` },
          ]),
        ]}
      />
      <StoryReadTracker />

      <HeroMedia
        eyebrow={`${story.category} · ${story.readingTime} 읽기`}
        title={isGroupStory ? "청주 모임·회식 장소를 찾는다면" : story.title}
        description={story.description}
        image={story.image}
        imageAlt={story.imageAlt}
      >
        <a className="button button-primary" href="#article">
          이야기 읽기
        </a>
        {isGroupStory ? (
          <AnalyticsLink className="button button-secondary" href={STORE.phoneHref} eventName="group_inquiry_click" placement="group_story_hero">전화로 일정 상담</AnalyticsLink>
        ) : null}
        {isGalbijjimStory ? (
          <AnalyticsLink className="button button-secondary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="galbijjim_story_hero">네이버에서 예약하기</AnalyticsLink>
        ) : null}
      </HeroMedia>

      {isGroupStory ? <ProofStrip items={[`한 팀 최대 ${STORE.maxGroupSize}명`, "최대 인원 통대관 협의", "날짜·시간·인원 사전 협의", "건물 뒤 무료주차"]} /> : null}

      <article id="article" className={`article-body section-pad${isGroupStory ? " group-article" : ""}`}>
        <div className="shell">
          <p className="story-dates">
            <time dateTime={story.publishedAt}>{story.publishedAt} 작성</time>
            <span aria-hidden="true"> · </span>
            <time dateTime={story.modifiedAt}>{story.modifiedAt} 수정</time>
          </p>
          {story.sections.map((section) => (
            <section
              className={section.image ? "story-section" : "story-section story-section--text"}
              key={section.heading}
            >
              {section.image ? (
                <Image
                  src={section.image}
                  alt={section.imageAlt ?? ""}
                  width={760}
                  height={500}
                  sizes="(max-width: 767px) calc(100vw - 48px), 50vw"
                />
              ) : null}
              <div>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
                {isGroupStory && section === story.sections[1] ? (
                  <ol className="group-process">
                    {GROUP_BOOKING_STEPS.map((step, index) => (
                      <li key={step.title}>
                        <p className="eyebrow">0{index + 1}</p>
                        <h3>{step.title}</h3>
                        <p>{step.body}</p>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {isGroupStory && section === story.sections[2] ? (
                  <div className="menu-grid group-menu-grid">
                    {MENU_ITEMS.map((item) => (
                      <article key={item.slug}>
                        <Image src={item.image} alt={item.imageAlt} width={640} height={420} sizes="(max-width: 767px) calc(100vw - 84px), 45vw" />
                        <h3>{item.name}</h3><strong>{item.price}</strong>
                        <p>{item.includes}</p><p>{item.description}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
                {isGroupStory && section === story.sections[3] ? (
                  <AnalyticsLink className="button button-secondary" href={STORE.directionsUrl} target="_blank" rel="noreferrer" eventName="naver_map_click" placement="group_story_parking">네이버 지도에서 보기</AnalyticsLink>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </article>

      {story.slug === "how-to-enjoy-ribs" ? <ExperienceSteps /> : null}

      <section className="story-faq section-pad surface-paper">
        <div className="shell story-faq-grid">
          <div>
            <p className="eyebrow">{isGroupStory ? "GROUP · PRIVATE HIRE" : "FAQ"}</p>
            <h2>{isGroupStory ? "모임과 회식, 이렇게 준비합니다" : "함께 확인하면 좋은 질문"}</h2>
            <p>메뉴 선택과 방문 전에 필요한 내용을 확인하세요.</p>
          </div>
          <FaqList items={faqs} openAll />
        </div>
      </section>

      {isGroupStory ? (
        <section className="group-contact section-pad">
          <div className="shell split-section">
            <div>
              <p className="eyebrow">PLAN YOUR GATHERING</p>
              <h2>날짜·시간·인원을 알려주시면 모임에 맞춰 안내해 드립니다</h2>
              <p>한 팀 최대 {STORE.maxGroupSize}명 · 최대 인원 통대관 협의</p>
            </div>
            <div className="group-dining-actions">
              <AnalyticsLink className="button button-secondary" href={STORE.phoneHref} eventName="group_inquiry_click" placement="group_story_bottom">전화로 일정 상담</AnalyticsLink>
              <AnalyticsLink className="button button-primary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="group_story_bottom">네이버에서 예약하기</AnalyticsLink>
            </div>
          </div>
        </section>
      ) : null}

      <section className="related-stories section-pad">
        <div className="shell story-listing">
          <div className="section-heading">
            <h2>다음 이야기</h2>
            <p>방문 준비와 메뉴 선택을 더 자세히 알아보세요.</p>
          </div>
          <div className="story-grid">
            {related.map((item) => (
              <StoryCard key={item.slug} story={item} />
            ))}
          </div>
        </div>
      </section>

      {!isGroupStory ? <ReservationCta placement="story_bottom" /> : null}
    </main>
  );
}
