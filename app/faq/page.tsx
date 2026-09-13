import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { ProofStrip } from "@/components/site/proof-strip";
import { FAQ_ITEMS, GROUP_FAQ_ITEMS, STORE } from "@/lib/content/store";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/schema";

export const metadata = createPageMetadata({
  title: "어믜뜰 FAQ | 예약·주차·단체·통대관",
  description:
    "어믜뜰의 영업시간, 주차, 메뉴, 아이 동반과 예약 안내. 최대 52명 단체 이용과 통대관 사전 협의 질문도 확인하세요.",
  path: "/faq",
  image: "/images/eomeuittul/interior.jpg",
});

export default function FaqPage() {
  const allFaqs = [...FAQ_ITEMS, ...GROUP_FAQ_ITEMS];
  return (
    <main className="store-route faq-route">
      <JsonLd
        data={[
          faqSchema(allFaqs),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />

      <HeroMedia
        eyebrow="FAQ · 방문 전 궁금한 점"
        title={
          <>
            어믜뜰 방문 전,
            <br />
            자주 묻는 질문
          </>
        }
        description="영업시간부터 주차, 메뉴 선택, 아이 동반과 예약까지 방문 전에 필요한 답을 한곳에 모았습니다."
        image="/images/eomeuittul/interior.jpg"
        imageAlt={`${STORE.name} 청주봉명동본점 매장 내부`}
      >
        <AnalyticsLink
          className="button button-primary"
          href={STORE.phoneHref}
          eventName="phone_click"
          placement="faq_hero"
        >
          매장에 전화하기
        </AnalyticsLink>
      </HeroMedia>

      <ProofStrip
        items={[
          "월요일 정기휴무",
          "포장 가능",
          "건물 뒤 무료 지상주차장",
          "일요일 영업",
        ]}
      />

      <section className="faq-section section-pad surface-paper">
        <div className="shell split-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>영업과 방문</h2>
            <p>휴무일, 브레이크 타임, 주차와 포장 안내입니다.</p>
          </div>
          <FaqList items={FAQ_ITEMS.slice(0, 4)} openAll />
        </div>
      </section>

      <section className="faq-section section-pad surface-paper">
        <div className="shell split-section">
          <div>
            <p className="eyebrow">MENU · RESERVATION</p>
            <h2>메뉴·예약·아이 동반</h2>
            <p>메뉴 선택부터 예약, 아이와 단체 방문 안내입니다.</p>
          </div>
          <FaqList items={FAQ_ITEMS.slice(4)} openAll />
        </div>
      </section>

      <section className="faq-section section-pad surface-paper">
        <div className="shell split-section">
          <div>
            <p className="eyebrow">GROUP · PRIVATE HIRE</p>
            <h2>모임과 회식, 이렇게 준비합니다</h2>
            <p>최대 인원, 통대관 협의, 메뉴와 주차 안내입니다.</p>
          </div>
          <FaqList items={GROUP_FAQ_ITEMS} openAll />
        </div>
      </section>
      <LocationPanel />
    </main>
  );
}
