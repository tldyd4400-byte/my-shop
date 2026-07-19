import type { DiningStep, FaqItem, MenuItem, ReviewItem, StoreInfo } from "./types";

export const STORE: StoreInfo = {
  name: "어밀뜰",
  fullName: "어밀뜰 등갈비찜 청주봉명동본점",
  url: "https://eomeutteull.com",
  phoneDisplay: "0507-1449-0004",
  phoneHref: "tel:050714490004",
  address: "충북 청주시 흥덕구 백봉로 213-1 1층",
  parking: "건물 앞 무료 지상주차장 · 점심시간 및 17시 이후에는 도로 주차 가능",
  seats: "12테이블 · 52석 · 6인 단체석 2테이블",
  placeUrl: "https://map.naver.com/p/entry/place/2021816208",
  bookingUrl:
    "https://search.naver.com/search.naver?query=%EC%96%B4%EB%AF%9C%EB%9C%B0%20%EB%93%B1%EA%B0%88%EB%B9%84%EC%B0%9C%20%EC%B2%AD%EC%A3%BC%EB%B4%89%EB%AA%85%EB%8F%99%EB%B3%B8%EC%A0%90",
  directionsUrl:
    "https://map.naver.com/p/search/%EC%B6%A9%EB%B6%81%20%EC%B2%AD%EC%A3%BC%EC%8B%9C%20%ED%9D%A5%EB%8D%95%EA%B5%AC%20%EB%B0%B1%EB%B4%89%EB%A1%9C%20213-1",
  image: "/images/eomeuittul/hero-table.jpg",
  openingPeriods: [
    { label: "평일 점심", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "15:30" },
    { label: "평일 저녁", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "16:30", closes: "22:00" },
    { label: "주말", days: ["Saturday", "Sunday"], opens: "11:00", closes: "22:00" },
  ],
};

export const MENU_ITEMS: readonly MenuItem[] = [
  { slug: "spicy", name: "매운 등갈비찜 세트", price: "19,900원", description: "매콤한 특수 소스와 재료를 함께해 샤브처럼 끓여 먹는 대표 메뉴", includes: "공깃밥 · 면사리 포함", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "붉은 특수소스와 채소를 함께 낸 어밀뜰 매운 등갈비찜" },
  { slug: "soy", name: "간장 등갈비찜 세트", price: "19,900원", description: "사골진한 간장 양념으로 부담 없이 편안하게 즐기는 메뉴", includes: "공깃밥 · 면사리 포함", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "채소와 함께 낸 어밀뜰 간장 등갈비찜" },
];

export const FAQ_ITEMS: readonly FaqItem[] = [
  { question: "월요일에도 영업하나요?", answer: "매주 월요일은 정기휴무입니다." },
  { question: "브레이크 타임이 있나요?", answer: "평일 15:30~16:30이며 주말·공휴일은 제외됩니다." },
  { question: "주차가 가능한가요?", answer: "건물 앞 무료 지상주차장을 이용하실 수 있습니다." },
  { question: "포장이나 배달이 되나요?", answer: "포장은 가능하며 배달은 운영하지 않습니다." },
  { question: "매운맛이 걱정돼요.", answer: "매운 등갈비찜과 간장 등갈비찜 중 선택할 수 있습니다." },
  { question: "네이버 예약 혜택이 있나요?", answer: "네이버 예약 페이지에서 현재 제공하는 최신 혜택을 확인해 주세요." },
  { question: "아이와 함께 가도 되나요?", answer: "유아의자를 이용하실 수 있습니다." },
  { question: "단체 이용도 가능한가요?", answer: "단체 이용도 가능하며 방문 전 전화 문의를 권장합니다." },
];

export const REVIEW_ITEMS: readonly ReviewItem[] = [
  { title: "색다른 한끼", summary: "등갈비찜과 샤브샤브를 함께 즐기는 이색적인 조합이라는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
  { title: "부드러운 등갈비", summary: "등갈비가 부드러워 가족과 함께 먹기 좋다는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
  { title: "골라 먹는 재미", summary: "채소를 자유롭게 곁들이고 면사리와 함께 먹는 방식이 재미있다는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
];

export const DINING_STEPS: readonly DiningStep[] = [
  { number: "01", title: "등갈비찜 선택", body: "매운맛과 간장맛 중 취향에 맞게 고릅니다.", media: "/images/eomeuittul/step-1-ribs.png", mediaType: "image", alt: "채소와 함께 차려진 어밀뜰 등갈비찜" },
  { number: "02", title: "재료 담기", body: "셀프바에서 채소, 버섯, 유부와 쫄면을 담습니다.", media: "/images/eomeuittul/step-2-selfbar.jpg", mediaType: "image", alt: "채소와 버섯, 유부와 쫄면이 준비된 어밀뜰 셀프바" },
  { number: "03", title: "샤브처럼 끓이기", body: "고른 재료를 등갈비찜과 함께 끓여 나눠 먹습니다.", media: "/media/eomeuittul/step-3-shabu-720p.mp4", mediaType: "video", alt: "등갈비찜에 셀프바 재료를 넣어 끓이는 모습" },
  { number: "04", title: "빙수로 마무리", body: "매콤한 맛을 수제연유빙수로 마무리합니다.", media: "/images/eomeuittul/step-4-bingsu.png", mediaType: "image", alt: "어밀뜰 수제연유빙수" },
];
