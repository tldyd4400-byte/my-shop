import Image from "next/image";
import {
  ArrowRight,
  Car,
  Clock3,
  Flame,
  Leaf,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Snowflake,
  Star,
  Users,
  Utensils,
} from "lucide-react";

import { SiteHeader } from "@/components/home/site-header";
import {
  DINING_STEPS,
  FAQ_ITEMS,
  MENU_ITEMS,
  SITE,
} from "@/lib/site-content";

const stepIcons = [Flame, Leaf, Utensils, Snowflake] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="top">
        <section className="hero section-pad" aria-labelledby="hero-title">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">청주 봉명동 · 샤브형 등갈비찜 전문점</p>
              <h1 id="hero-title">
                늘 자식 쪽으로 기울던 접시,
                <br />
                그날의 식탁
              </h1>
              <p className="hero-lead">
                엄마의 마음으로 푸짐하게 차려내는
                <br />
                어믜뜰만의 등갈비찜 한 상
              </p>
              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href={SITE.naverSearch}
                  target="_blank"
                  rel="noreferrer"
                >
                  네이버 예약하기 <ArrowRight aria-hidden="true" />
                </a>
                <a className="button button-secondary" href={SITE.phoneHref}>
                  <Phone aria-hidden="true" /> 전화 문의
                </a>
              </div>
              <p className="benefit-note">
                네이버 예약 시 낙지파전 또는 추가 등갈비 1인분 서비스
              </p>
            </div>

            <figure className="image-frame hero-image">
              <Image
                src="/images/eomeuittul-ribs-spicy.png"
                alt="테스트용으로 제작된 김이 오르는 매운 등갈비찜 이미지"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 48vw"
              />
              <figcaption>테스트용 이미지 · 실제 메뉴 사진으로 교체 예정</figcaption>
            </figure>
          </div>
        </section>

        <section className="proof-band" aria-label="매장 주요 정보">
          <div className="shell proof-grid">
            <div>
              <Star aria-hidden="true" />
              <span>네이버 별점 4.91 · 리뷰 364</span>
            </div>
            <div>
              <Users aria-hidden="true" />
              <span>12테이블 · 52석 · 단체석</span>
            </div>
            <div>
              <PackageCheck aria-hidden="true" />
              <span>포장 · 예약 · 주차 가능</span>
            </div>
          </div>
        </section>

        <section id="story" className="story section-pad surface-rice">
          <div className="shell story-grid">
            <figure className="image-frame story-image">
              <Image
                src="/images/eomeuittul-interior.png"
                alt="테스트용으로 제작된 따뜻한 한식당 내부 이미지"
                fill
                sizes="(max-width: 1023px) 100vw, 42vw"
              />
              <figcaption>테스트용 공간 이미지</figcaption>
            </figure>
            <div className="story-copy">
              <p className="kicker">BRAND STORY</p>
              <h2>
                좋은 것은 늘
                <br />
                자식 앞으로 밀어주시던 마음
              </h2>
              <p>
                어믜뜰은 단순히 등갈비찜 한 끼를 내어드리는 식당이
                아닙니다. 함께 둘러앉아 취향대로 푸짐하게 즐기고,
                돌아가는 길에 ‘오늘 참 잘 먹었다’는 말이 자연스럽게
                나오는 곳을 만듭니다.
              </p>
              <p className="story-signature">엄마의 마음으로 차린 한 상</p>
            </div>
          </div>
        </section>

        <section id="guide" className="guide section-pad surface-hanji">
          <div className="shell">
            <div className="section-heading">
              <p className="kicker">HOW TO ENJOY</p>
              <h2>같은 등갈비찜도, 먹는 사람에 따라 다른 한 상</h2>
              <p>
                30여 종의 채소·버섯·떡·당면을 자유롭게 더해 나만의
                방식으로 즐깁니다.
              </p>
            </div>
            <ol className="step-grid">
              {DINING_STEPS.map((step, index) => {
                const Icon = stepIcons[index];
                return (
                  <li key={step.number} className="step-card">
                    <div className="step-topline">
                      <span>{step.number}</span>
                      <Icon aria-hidden="true" />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="menu" className="menu section-pad surface-rice">
          <div className="shell">
            <div className="section-heading centered">
              <p className="kicker">SIGNATURE MENU</p>
              <h2>부족함 없이 대접하는 한 상</h2>
              <p>등갈비와 셀프바, 곁들임까지 한 상에 넉넉히 담았습니다.</p>
            </div>
            <div className="menu-grid">
              {MENU_ITEMS.map((item) => (
                <article key={item.name} className="menu-card">
                  <div className="image-frame menu-image">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="(max-width: 767px) 100vw, 50vw"
                    />
                    <span className="image-badge">테스트용 이미지</span>
                  </div>
                  <div className="menu-card-body">
                    <div className="menu-title-row">
                      <h3>{item.name}</h3>
                      <span>{item.price}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="space" className="space section-pad">
          <div className="shell space-grid">
            <div className="space-copy">
              <p className="kicker">A PLACE TOGETHER</p>
              <h2>
                함께 둘러앉기 좋은
                <br />
                따뜻하고 넉넉한 자리
              </h2>
              <p>
                12테이블 52석과 6인 단체석 2테이블. 가족 외식부터
                회식까지 편안하게 머물 수 있습니다.
              </p>
              <ul className="feature-list">
                <li>
                  <Users aria-hidden="true" /> 6인 단체석 2테이블
                </li>
                <li>
                  <Car aria-hidden="true" /> 건물 뒤편 무료 주차
                </li>
              </ul>
            </div>
            <figure className="image-frame group-image">
              <Image
                src="/images/eomeuittul-group-seating.png"
                alt="테스트용으로 제작된 가족과 단체 식사를 위한 좌석 이미지"
                fill
                sizes="(max-width: 1023px) 100vw, 55vw"
              />
              <figcaption>테스트용 단체석 이미지</figcaption>
            </figure>
          </div>
        </section>

        <section id="faq" className="faq section-pad surface-rice">
          <div className="shell faq-shell">
            <div className="section-heading">
              <p className="kicker">BEFORE YOU VISIT</p>
              <h2>자주 묻는 질문</h2>
            </div>
            <div className="faq-list">
              {FAQ_ITEMS.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="visit" className="visit section-pad">
          <div className="shell visit-grid">
            <div className="visit-copy">
              <p className="kicker kicker-light">VISIT US</p>
              <h2>어믜뜰에서 만나요</h2>
              <div className="visit-detail">
                <MapPin aria-hidden="true" />
                <div>
                  <strong>주소</strong>
                  <p>{SITE.address}</p>
                </div>
              </div>
              <div className="visit-detail">
                <Clock3 aria-hidden="true" />
                <div>
                  <strong>영업시간</strong>
                  <p>
                    매일 11:00 - 22:00
                    <br />
                    브레이크타임 15:30 - 16:30
                    <br />
                    주말·공휴일 브레이크타임 없음
                    <br />
                    매주 월요일 정기휴무
                  </p>
                </div>
              </div>
              <a className="phone-number" href={SITE.phoneHref}>
                <Phone aria-hidden="true" /> {SITE.phoneDisplay}
              </a>
              <div className="visit-actions">
                <a
                  className="button button-primary"
                  href={SITE.naverSearch}
                  target="_blank"
                  rel="noreferrer"
                >
                  네이버 예약
                </a>
                <a
                  className="button button-light"
                  href={SITE.naverDirections}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation aria-hidden="true" /> 네이버 길찾기
                </a>
              </div>
            </div>
            <aside className="location-card" aria-label="주차와 교통 안내">
              <span className="location-mark" aria-hidden="true">
                <MapPin />
              </span>
              <h3>백봉어린이공원 건너편</h3>
              <p>건물 뒤편 지상주차장을 무료로 이용할 수 있습니다.</p>
              <div className="location-divider" />
              <p>
                백봉아파트 정류장 하차 후
                <br />
                도보 약 1분
              </p>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div>
            <strong>{SITE.fullName}</strong>
            <p>늘 자식 쪽으로 기울던 접시, 그날의 식탁</p>
          </div>
          <p>테스트용 홈페이지 · 실제 운영 전 정보와 사진을 확인해 주세요.</p>
        </div>
      </footer>

      <nav className="mobile-actions" aria-label="빠른 작업">
        <a href={SITE.phoneHref}>
          <Phone aria-hidden="true" /> 전화
        </a>
        <a
          href={SITE.naverDirections}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation aria-hidden="true" /> 길찾기
        </a>
        <a
          className="mobile-action-primary"
          href={SITE.naverSearch}
          target="_blank"
          rel="noreferrer"
        >
          네이버 예약
        </a>
      </nav>
    </>
  );
}
