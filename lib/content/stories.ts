import type { Story } from "./types";

export const STORIES: readonly Story[] = [
  {
    slug: "how-to-enjoy-ribs",
    title: "처음 보는 등갈비찜, 이렇게 즐겨요",
    description: "등갈비 선택부터 수제우유빙수까지 네 단계를 소개합니다.",
    category: "메뉴 이야기",
    readingTime: "5분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/step-1-ribs.png",
    imageAlt: "채소와 함께 차려진 어믜뜰 등갈비찜",
    sections: [
      { heading: "등갈비찜에서 시작해 한 상의 경험으로", body: "어믜뜰의 식사는 원하는 재료를 고르고 함께 끓이며 각자의 취향으로 한 상을 완성합니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어믜뜰 매운 등갈비찜" },
      { heading: "네 단계로 즐기기", body: "매운맛 또는 간장맛을 고르고 셀프바 재료를 담아 샤브처럼 끓인 뒤 수제우유빙수로 마무리합니다." },
    ],
  },
  {
    slug: "family-dining-guide",
    title: "청주 봉명동 가족 외식 가이드",
    description: "좌석, 주차, 아이 동반과 예약 정보를 가족 외식 관점에서 정리합니다.",
    category: "방문 가이드",
    readingTime: "4분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-09-13",
    image: "/images/eomeuittul/facade.jpg",
    imageAlt: "어믜뜰 청주봉명동본점 외관",
    sections: [
      { heading: "가족과 편안하게 머무는 자리", body: "12테이블과 52석, 유아의자와 단체석을 갖추고 있습니다.", image: "/images/eomeuittul/interior.jpg", imageAlt: "어믜뜰 실제 매장 내부" },
      { heading: "방문 전에 확인할 정보", body: "건물 뒤 무료 지상주차장을 이용할 수 있으며 월요일은 정기휴무입니다." },
      { heading: "가족의 취향에 맞는 갈비찜", body: "매운맛이 부담스럽거나 아이와 함께라면 달콤짭짤한 간장 등갈비찜을 선택할 수 있습니다. 매운 등갈비찜도 준비되어 있어 가족의 취향에 맞게 고를 수 있습니다.", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "가족과 함께 즐기는 어믜뜰 간장 등갈비찜" },
      { heading: "수제우유빙수로 식사 마무리", body: "등갈비찜과 셀프바 재료로 한 상을 즐긴 뒤 수제우유빙수로 마무리할 수 있습니다.", image: "/images/eomeuittul/step-4-bingsu.png", imageAlt: "어믜뜰 수제우유빙수" },
    ],
  },
  {
    slug: "self-bar-guide",
    title: "30여 종 셀프바를 즐기는 법",
    description: "채소와 버섯, 떡과 당면으로 나만의 한 상을 만드는 법을 소개합니다.",
    category: "식사 방법",
    readingTime: "4분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/step-2-selfbar.jpg",
    imageAlt: "어믜뜰 셀프바",
    sections: [
      { heading: "취향대로 담는 재료", body: "원하는 채소와 버섯, 떡과 당면을 담아 등갈비찜과 함께 끓입니다.", image: "/images/eomeuittul/step-2-selfbar.jpg", imageAlt: "채소와 버섯이 준비된 셀프바" },
      { heading: "구성은 달라질 수 있어요", body: "셀프바 재료는 매장 상황에 따라 일부 달라질 수 있습니다." },
    ],
  },
  {
    slug: "spicy-or-soy",
    title: "매운맛과 간장맛, 무엇을 고를까",
    description: "첫 방문자가 취향에 맞는 등갈비찜을 고를 수 있도록 비교합니다.",
    category: "메뉴 선택",
    readingTime: "3분",
    publishedAt: "2026-07-19",
    modifiedAt: "2026-07-19",
    image: "/images/eomeuittul/soy-ribs.jpg",
    imageAlt: "어믜뜰 간장 등갈비찜",
    sections: [
      { heading: "매콤한 한 상", body: "칼칼한 육수와 채소를 함께 즐기고 싶다면 매운 등갈비찜을 고릅니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어믜뜰 매운 등갈비찜" },
      { heading: "편안한 간장 한 상", body: "달콤짭짤한 맛을 선호하거나 아이와 함께라면 간장 등갈비찜을 선택할 수 있습니다.", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어믜뜰 간장 등갈비찜" },
    ],
  },
  {
    slug: "cheongju-group-dining",
    title: "청주 모임·회식 장소 가이드",
    description: "한 팀 최대 52명, 통대관까지 가능한 어믜뜰. 날짜·시간·인원 사전 협의부터 메뉴 선택과 무료주차까지 단체 이용 정보를 확인하세요.",
    category: "단체 방문 가이드",
    readingTime: "4분",
    publishedAt: "2026-09-13",
    modifiedAt: "2026-09-13",
    image: "/images/eomeuittul/interior.jpg",
    imageAlt: "한 팀 최대 52명이 이용할 수 있는 어믜뜰 매장 내부",
    sections: [
      { heading: "한 팀 최대 52명까지 한자리에서", body: "어믜뜰은 청주 봉명동에 위치한 등갈비찜 식당으로, 12테이블과 총 52석을 갖추고 있습니다. 한 팀 최대 52명까지 이용할 수 있어 회사 회식과 단체 모임을 준비할 수 있습니다.", image: "/images/eomeuittul/interior.jpg", imageAlt: "어믜뜰 매장 전체 좌석" },
      { heading: "통대관은 네 단계로 편하게 협의합니다", body: "최대 인원 이용 시 매장 통대관으로 협의할 수 있습니다. 정해진 최소 인원이나 최소 금액 없이 날짜·시간·인원을 매장과 사전에 협의합니다." },
      { heading: "여러 취향이 모여도 고르기 좋은 두 가지 갈비찜", body: "매운맛과 간장맛을 준비해 여러 취향이 모이는 회식 자리에서도 선택하기 좋습니다. 셀프바에서 원하는 재료를 더해 샤브처럼 함께 끓여 드세요." },
      { heading: "차량이 많은 모임도 미리 동선을 확인하세요", body: "건물 뒤 무료 지상주차장을 이용할 수 있습니다. 단체 차량 수는 예약 전에 매장과 상담해 주세요.", image: "/images/eomeuittul/naver-map-location.png", imageAlt: "청주 봉명동 어믜뜰의 실제 위치 지도" },
    ],
  },
  {
    slug: "cheongju-galbijjim-guide",
    title: "청주갈비찜 맛집을 찾는다면",
    description: "청주갈비찜을 찾는 분들을 위해 봉명동 매운 등갈비찜과 간장 등갈비찜, 셀프바와 무료주차를 한 번에 정리했습니다.",
    category: "청주갈비찜 가이드",
    readingTime: "4분",
    publishedAt: "2026-09-16",
    modifiedAt: "2026-09-16",
    image: "/images/eomeuittul/spicy-ribs.jpg",
    imageAlt: "어믜뜰 매운 등갈비찜 한 상",
    sections: [
      { heading: "청주갈비찜을 찾는 분들이 먼저 확인할 것", body: "어믜뜰은 청주 봉명동에서 등갈비찜을 중심으로 한 상을 차려내는 식당입니다. 매운 등갈비찜과 간장 등갈비찜을 준비해 첫 방문자도 취향에 맞게 고를 수 있습니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "청주 봉명동 어믜뜰 매운 등갈비찜" },
      { heading: "매운 등갈비찜과 간장 등갈비찜", body: "칼칼한 국물과 함께 즐기고 싶다면 매운 등갈비찜을, 아이와 함께하거나 부드러운 맛을 원한다면 간장 등갈비찜을 선택할 수 있습니다.", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어믜뜰 간장 등갈비찜" },
      { heading: "셀프바와 함께 완성하는 한 상", body: "채소, 버섯, 떡과 당면을 셀프바에서 골라 등갈비찜에 더해 샤브처럼 끓여 먹는 방식입니다. 익숙한 갈비찜에 새로운 식사 경험을 더합니다.", image: "/images/eomeuittul/step-2-selfbar.jpg", imageAlt: "채소와 버섯, 떡과 당면이 준비된 어믜뜰 셀프바" },
      { heading: "가족외식과 모임까지 이어지는 이유", body: "건물 뒤 무료 지상주차장을 이용할 수 있고, 한 팀 최대 52명까지 단체 이용을 상담할 수 있습니다. 청주에서 가족외식이나 회식 장소를 함께 찾는 분들도 방문 전 예약 정보를 확인해 주세요.", image: "/images/eomeuittul/interior.jpg", imageAlt: "어믜뜰 매장 내부 좌석" },
    ],
  },
];

export function getStory(slug: string): Story | undefined {
  return STORIES.find((story) => story.slug === slug);
}
