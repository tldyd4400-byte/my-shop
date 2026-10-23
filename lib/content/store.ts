import type { DiningStep, FaqItem, MenuCategory, MenuItem, ReviewItem, ReviewSnapshot, StoreInfo } from "./types";

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
  privateHire: "최대 인원 이용 시 통대관 협의",
  corkage: "외부 주류 반입 가능 · 콜키지 무료",
  lastOrder: "21:00",
  regularClosure: "매주 월요일",
  holidayClosure: "설·추석 당일",
  accessibility: ["휠체어 이용 가능 출입구", "휠체어 이용 가능 좌석", "휠체어 이용 가능 화장실"],
  familyFacilities: ["유아의자", "어린이밥"],
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

export const MENU_CATEGORIES: readonly MenuCategory[] = [
  { id: "set", label: "대표 세트", description: "매운맛과 간장맛 중 선택 · 2인 이상 주문" },
  { id: "side", label: "곁들임", description: "등갈비찜과 함께 즐기는 식사와 사이드" },
  { id: "extra", label: "추가 메뉴", description: "더 푸짐하게 즐기는 등갈비와 우삼겹" },
  { id: "takeout", label: "포장 할인", description: "집과 캠핑에서도 끓여 먹는 반조리 메뉴" },
];

const menuItem = (
  item: Omit<MenuItem, "includes" | "image" | "imageAlt"> &
    Partial<Pick<MenuItem, "includes" | "image" | "imageAlt">>,
): MenuItem => ({
  includes: "",
  image: STORE.image,
  imageAlt: `${item.name} 메뉴 안내`,
  ...item,
});

export const MENU_ITEMS: readonly MenuItem[] = [
  menuItem({ slug: "spicy-set", category: "set", name: "매운등갈비찜 세트 1인", price: "19,900원", priceAmount: 19900, description: "매콤한 육수에 채소를 더해 샤브처럼 끓여 먹는 대표 메뉴", includes: "등갈비찜 · 셀프바 · 수제우유빙수", minimumOrder: 2, badge: "대표", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어믜뜰 매운등갈비찜 세트" }),
  menuItem({ slug: "soy-set", category: "set", name: "간장등갈비찜 세트 1인", price: "19,900원", priceAmount: 19900, description: "달콤짭짤하고 맵지 않아 아이와 부모님도 편하게 즐기는 메뉴", includes: "등갈비찜 · 셀프바 · 수제우유빙수", minimumOrder: 2, image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어믜뜰 간장등갈비찜 세트" }),
  menuItem({ slug: "milk-bingsu", category: "side", name: "특별한 수제우유빙수", price: "무료", priceAmount: 0, description: "식사 후 제공되는 특별한 후식", badge: "후식 서비스", image: "/images/eomeuittul/step-4-bingsu.png", imageAlt: "어믜뜰 수제우유빙수" }),
  menuItem({ slug: "imgung-rice", category: "side", name: "임궁밥", price: "4,900원", priceAmount: 4900, description: "곤드레와 궁채나물로 만든 나물밥", image: "/images/eomeuittul/imgung-rice.jpg", imageAlt: "곤드레와 궁채나물로 만든 임궁밥" }),
  menuItem({ slug: "buckwheat-pancake", category: "side", name: "메밀전", price: "4,900원", priceAmount: 4900, description: "등갈비찜과 곁들이기 좋은 고소한 메밀전", image: "/images/eomeuittul/buckwheat-pancake.jpg", imageAlt: "어믜뜰 메밀전" }),
  menuItem({ slug: "beef-pancake", category: "side", name: "육전", price: "12,000원", priceAmount: 12000, description: "부드러운 소고기에 계란옷을 입혀 구운 육전" }),
  menuItem({ slug: "green-onion-roll", category: "side", name: "바삭대파전병", price: "3,000원", priceAmount: 3000, description: "바삭하게 즐기는 대파전병" }),
  menuItem({ slug: "flat-dumpling", category: "side", name: "납작만두", price: "2,000원", priceAmount: 2000, description: "노릇하게 구운 바삭하고 쫄깃한 납작만두" }),
  menuItem({ slug: "kids-rice", category: "side", name: "어린이밥", price: "3,500원", priceAmount: 3500, description: "간장등갈비로 구성한 어린이 메뉴" }),
  menuItem({ slug: "steamed-egg", category: "side", name: "계란찜", price: "2,000원", priceAmount: 2000, description: "매운맛을 부드럽게 잡아주는 계란찜" }),
  menuItem({ slug: "extra-soy-ribs", category: "extra", name: "간장등갈비 추가", price: "15,000원", priceAmount: 15000, description: "달콤짭짤한 간장등갈비 추가" }),
  menuItem({ slug: "extra-spicy-ribs", category: "extra", name: "매운등갈비 추가", price: "15,000원", priceAmount: 15000, description: "매콤한 등갈비 추가" }),
  menuItem({ slug: "extra-beef", category: "extra", name: "우삼겹 100g 추가", price: "4,900원", priceAmount: 4900, description: "국물과 함께 즐기는 고소한 우삼겹" }),
  menuItem({ slug: "takeout-spicy-single", category: "takeout", name: "포장 반조리 매운등갈비찜 단품 1인", price: "14,000원", priceAmount: 14000, description: "집이나 캠핑에서 끓여 먹는 반조리 단품", minimumOrder: 2, badge: "포장 할인" }),
  menuItem({ slug: "takeout-soy-single", category: "takeout", name: "포장 반조리 간장등갈비찜 단품 1인", price: "14,000원", priceAmount: 14000, description: "집이나 캠핑에서 끓여 먹는 반조리 단품", minimumOrder: 2, badge: "포장 할인" }),
  menuItem({ slug: "takeout-spicy-set", category: "takeout", name: "포장 반조리 매운등갈비찜 세트 1인", price: "19,000원", priceAmount: 19000, description: "셀프바 구성까지 함께 즐기는 반조리 세트", badge: "포장 할인" }),
  menuItem({ slug: "takeout-soy-set", category: "takeout", name: "포장 반조리 간장등갈비찜 세트 1인", price: "19,000원", priceAmount: 19000, description: "셀프바 구성까지 함께 즐기는 반조리 세트", badge: "포장 할인" }),
];

export const REVIEW_SNAPSHOT: ReviewSnapshot = {
  rating: 4.94,
  participants: 362,
  checkedAt: "2026-10-23",
  sourceLabel: "네이버 스마트플레이스 관리자 화면",
  sourceUrl: STORE.placeUrl,
};

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
