import type { Story } from "./types";

export const STORIES: readonly Story[] = [
  {
    slug: "how-to-enjoy-ribs",
    title: "처음 보는 등갈비찜, 이렇게 즐겨요",
    description: "등갈비 선택부터 수제연유빙수까지 네 단계를 소개합니다.",
    category: "메뉴 이야기",
    readingTime: "5분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/step-1-ribs.png",
    imageAlt: "채소와 함께 차려진 어밀뜰 등갈비찜",
    sections: [
      { heading: "등갈비찜에서 시작하는 각자의 경험으로", body: "어밀뜰의 식사는 원하는 재료를 고르고 함께 끓이며 각자의 취향으로 한 상을 완성합니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어밀뜰 매운 등갈비찜" },
      { heading: "네 단계로 즐기기", body: "매운맛 또는 간장맛을 고르고 셀프바 재료를 더해 샤브처럼 끓인 뒤 수제연유빙수로 마무리합니다." },
    ],
  },
  {
    slug: "family-dining-guide",
    title: "청주 봉명동 가족 외식 가이드",
    description: "좌석, 주차, 아이 동반과 예약 정보를 가족 외식 관점에서 정리합니다.",
    category: "방문 가이드",
    readingTime: "4분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/facade.jpg",
    imageAlt: "어밀뜰 청주봉명동본점 외관",
    sections: [
      { heading: "가족과 편안하게 머무를 자리", body: "12테이블과 52석, 유아의자와 단체석을 갖추고 있습니다.", image: "/images/eomeuittul/interior.jpg", imageAlt: "어밀뜰 실제 매장 내부" },
      { heading: "방문 전에 확인할 정보", body: "건물 앞 무료 지상주차장을 이용할 수 있으며 일요일은 정기휴무입니다." },
    ],
  },
  {
    slug: "self-bar-guide",
    title: "30초 셀프바를 즐기는 법",
    description: "채소와 버섯, 유부와 쫄면으로 나만의 한 상을 만드는 법을 소개합니다.",
    category: "식사 방법",
    readingTime: "4분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/step-2-selfbar.jpg",
    imageAlt: "어밀뜰 셀프바",
    sections: [
      { heading: "취향대로 담는 재료", body: "원하는 채소와 버섯, 유부와 쫄면을 담아 등갈비찜과 함께 끓입니다.", image: "/images/eomeuittul/step-2-selfbar.jpg", imageAlt: "채소와 버섯이 준비된 셀프바" },
      { heading: "구성은 달라질 수 있어요", body: "셀프바 재료는 매장 상황에 따라 일부 달라질 수 있습니다." },
    ],
  },
  {
    slug: "spicy-or-soy",
    title: "매운맛과 간장맛, 무엇을 고를까?",
    description: "첫 방문자의 취향에 맞는 등갈비찜을 고를 수 있도록 비교합니다.",
    category: "메뉴 선택",
    readingTime: "3분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/soy-ribs.jpg",
    imageAlt: "어밀뜰 간장 등갈비찜",
    sections: [
      { heading: "매콤한 맛을 원한다면", body: "칼칼한 특수소스와 채소를 함께 즐기고 싶다면 매운 등갈비찜을 고릅니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어밀뜰 매운 등갈비찜" },
      { heading: "편안한 간장 맛", body: "사골진한 맛을 선호하거나 아이와 함께라면 간장 등갈비찜을 선택할 수 있습니다.", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어밀뜰 간장 등갈비찜" },
    ],
  },
];

export function getStory(storySlug: string): Story | undefined {
  return STORIES.find((story) => story.slug === storySlug);
}
