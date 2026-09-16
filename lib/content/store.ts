import type { DiningStep, FaqItem, MenuItem, ReviewItem, StoreInfo } from "./types";

export const STORE: StoreInfo = {
  name: "어믜뜰",
  fullName: "어믜뜰 등갈비찜 청주봉명동본점",
  url: "https://eomeutteull.com",
  phoneDisplay: "0507-1449-0004",
  phoneHref: "tel:050714490004",
  address: "충북 청주시 흥덕구 백봉로 213-1 1층",
  parking: "건물 뒤 무료 지상주차장 · 점심시간 및 17시 이후 도로 주차 가능",
  seats: "12테이블 · 52석 · 6인 단체석 2테이블",
  maxGroupSize: 52,
  groupBooking: "한 팀 최대 52명 · 통대관 가능 · 날짜·시간·인원 사전 협의",
  placeUrl: "https://map.naver.com/p/entry/place/2021816208",
  bookingUrl:
    "https://m.booking.naver.com/booking/6/bizes/1611967/items/7499930?area=bmp&theme=place",
  directionsUrl:
    "https://map.naver.com/p/search/%EC%B6%A9%EB%B6%81%20%EC%B2%AD%EC%A3%BC%EC%8B%9C%20%ED%9D%A5%EB%8D%95%EA%B5%AC%20%EB%B0%B1%EB%B4%89%EB%A1%9C%20213-1",
  image: "/images/eomeuittul/hero-table.jpg",
  openingPeriods: [
    { label: "화~금 점심", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "15:30" },
    { label: "화~금 저녁", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "16:30", closes: "22:00" },
    { label: "토~일", days: ["Saturday", "Sunday"], opens: "11:00", closes: "22:00" },
  ],
};

export const MENU_ITEMS: readonly MenuItem[] = [
  { slug: "spicy", name: "매운 등갈비찜 세트", price: "19,900원", description: "매콤한 육수에 재료를 더해 샤브처럼 끓여 먹는 대표 메뉴", includes: "임궁밥 · 메밀전 포함", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "붉은 육수와 채소를 함께 담은 어믜뜰 매운 등갈비찜" },
  { slug: "soy", name: "간장 등갈비찜 세트", price: "19,900원", description: "달콤짭짤한 간장 양념으로 남녀노소 편안하게 즐기는 메뉴", includes: "임궁밥 · 메밀전 포함", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "채소와 함께 담은 어믜뜰 간장 등갈비찜" },
];

export const FAQ_ITEMS: readonly FaqItem[] = [
  { question: "월요일에도 영업하나요?", answer: "매주 월요일은 정기휴무입니다." },
  { question: "브레이크 타임이 있나요?", answer: "평일 15:30~16:30이며 주말·공휴일은 제외됩니다." },
  { question: "주차할 수 있나요?", answer: "건물 뒤 무료 지상주차장을 이용할 수 있습니다." },
  { question: "포장이나 배달이 되나요?", answer: "포장은 가능하며 배달은 운영하지 않습니다." },
  { question: "매운맛이 걱정돼요.", answer: "매운 등갈비찜과 간장 등갈비찜 중 선택할 수 있습니다." },
  { question: "네이버 예약 혜택이 있나요?", answer: "네이버 예약 페이지에서 현재 제공되는 최신 혜택을 확인해 주세요." },
  { question: "아이와 함께 갈 수 있나요?", answer: "유아의자를 이용할 수 있습니다." },
  { question: "단체 이용이 가능한가요?", answer: "단체 이용이 가능하며 방문 전 전화 문의를 권장합니다." },
];

export const GROUP_FAQ_ITEMS: readonly FaqItem[] = [
  { question: "한 팀 몇 명까지 이용할 수 있나요?", answer: "한 팀 최대 52명까지 이용할 수 있습니다." },
  { question: "매장을 통대관할 수 있나요?", answer: "최대 인원 이용 시 통대관으로 협의할 수 있습니다." },
  { question: "최소 인원이나 최소 금액이 있나요?", answer: "정해진 최소 조건은 없으며 날짜·시간·인원을 사전에 협의합니다." },
  { question: "회식 메뉴는 어떻게 선택하나요?", answer: "매운맛과 간장맛 중 취향에 맞게 선택할 수 있습니다. 자세한 구성은 예약 전에 매장과 확인해 주세요." },
  { question: "단체 차량도 주차할 수 있나요?", answer: "건물 뒤 무료 지상주차장이 있으며 차량 수는 미리 상담해 주세요." },
];

export const GALBIJJIM_FAQ_ITEMS: readonly FaqItem[] = [
  { question: "청주갈비찜으로 어떤 메뉴를 먹을 수 있나요?", answer: "매운 등갈비찜과 간장 등갈비찜을 선택할 수 있습니다." },
  { question: "매운 음식을 못 먹어도 방문할 수 있나요?", answer: "간장 등갈비찜을 선택할 수 있어 아이와 함께하는 가족외식이나 여러 취향이 모인 자리에도 맞추기 좋습니다." },
  { question: "청주 봉명동에서 주차가 가능한가요?", answer: "건물 뒤 무료 지상주차장을 이용할 수 있습니다." },
  { question: "회식이나 단체 모임도 가능한가요?", answer: "한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다." },
];

export const GROUP_BOOKING_STEPS = [
  { title: "날짜 확인", body: "희망 날짜와 시간을 알려주세요." },
  { title: "인원 상담", body: "예상 인원과 좌석 구성을 맞춥니다." },
  { title: "메뉴 선택", body: "매운맛과 간장맛을 함께 고릅니다." },
  { title: "최종 확정", body: "통대관 여부와 준비 사항을 확정합니다." },
] as const;

export const REVIEW_ITEMS: readonly ReviewItem[] = [
  { title: "색다른 한 상", summary: "등갈비찜과 샤브샤브를 함께 즐기는 이색적인 조합이라는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
  { title: "부드러운 등갈비", summary: "등갈비가 부드러워 가족과 함께 먹기 좋았다는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
  { title: "골라 먹는 재미", summary: "채소를 자유롭게 더하고 메밀전과 함께 먹는 방식이 재미있다는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
];

export const DINING_STEPS: readonly DiningStep[] = [
  { number: "01", title: "등갈비찜 선택", body: "매운맛과 간장맛 중 취향에 맞게 고릅니다.", media: "/images/eomeuittul/step-1-ribs.png", mediaType: "image", alt: "채소와 함께 차려진 어믜뜰 등갈비찜" },
  { number: "02", title: "재료 담기", body: "셀프바에서 채소, 버섯, 떡과 당면을 담습니다.", media: "/images/eomeuittul/step-2-selfbar.jpg", mediaType: "image", alt: "채소와 버섯, 떡과 당면이 준비된 어믜뜰 셀프바" },
  { number: "03", title: "샤브처럼 끓이기", body: "고른 재료를 등갈비찜과 함께 끓여 나누어 먹습니다.", media: "/media/eomeuittul/step-3-shabu-720p.mp4", mediaType: "video", alt: "등갈비찜에 셀프바 재료를 넣어 끓이는 모습" },
  { number: "04", title: "빙수로 마무리", body: "매콤한 한 상 뒤 수제우유빙수로 마무리합니다.", media: "/images/eomeuittul/step-4-bingsu.png", mediaType: "image", alt: "어믜뜰 수제우유빙수" },
];
