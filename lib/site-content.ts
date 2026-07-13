export const SITE = {
  name: "어믜뜰",
  fullName: "어믜뜰 등갈비찜 청주봉명동본점",
  phoneDisplay: "0507-1449-0004",
  phoneHref: "tel:050714490004",
  address: "충북 청주시 흥덕구 백봉로 213-1 1층",
  naverSearch:
    "https://search.naver.com/search.naver?query=%EC%96%B4%EB%AF%9C%EB%9C%B0%20%EB%93%B1%EA%B0%88%EB%B9%84%EC%B0%9C%20%EC%B2%AD%EC%A3%BC%EB%B4%89%EB%AA%85%EB%8F%99%EB%B3%B8%EC%A0%90",
  naverDirections:
    "https://map.naver.com/p/search/%EC%B6%A9%EB%B6%81%20%EC%B2%AD%EC%A3%BC%EC%8B%9C%20%ED%9D%A5%EB%8D%95%EA%B5%AC%20%EB%B0%B1%EB%B4%89%EB%A1%9C%20213-1",
} as const;

export const NAV_ITEMS = [
  ["어믜뜰 이야기", "#story"],
  ["메뉴", "#menu"],
  ["맛있게 즐기는 법", "#guide"],
  ["오시는 길", "#visit"],
] as const;

export const DINING_STEPS = [
  {
    number: "01",
    title: "보글보글 끓인다",
    body: "등갈비와 매콤한 육수가 충분히 어우러질 때까지 끓입니다.",
  },
  {
    number: "02",
    title: "취향대로 고른다",
    body: "30여 종 셀프바에서 채소, 버섯, 떡과 당면을 고릅니다.",
  },
  {
    number: "03",
    title: "한 냄비에 더한다",
    body: "함께 고른 재료를 넣고 샤브처럼 익혀 나누어 먹습니다.",
  },
  {
    number: "04",
    title: "빙수로 마무리한다",
    body: "매콤한 한 상 끝에 수제 우유빙수로 입안을 달랩니다.",
  },
] as const;

export const MENU_ITEMS = [
  {
    name: "매운 등갈비찜 세트",
    price: "19,900원",
    image: "/images/eomeuittul-ribs-spicy.png",
    imageAlt: "테스트용으로 제작된 매운 등갈비찜 이미지",
    description:
      "매콤한 육수와 등갈비를 샤브처럼. 임궁밥과 메밀전이 함께 제공됩니다.",
  },
  {
    name: "간장 등갈비찜 세트",
    price: "19,900원",
    image: "/images/eomeuittul-ribs-soy.png",
    imageAlt: "테스트용으로 제작된 간장 등갈비찜 이미지",
    description:
      "달콤짭짤한 간장 양념과 부드러운 등갈비. 남녀노소 편하게 즐기는 한 상입니다.",
  },
] as const;

export const FAQ_ITEMS = [
  [
    "매운 음식을 못 먹어도 방문할 수 있나요?",
    "달콤짭짤한 간장 등갈비찜 세트를 준비하고 있습니다.",
  ],
  [
    "단체 예약이 가능한가요?",
    "52석 규모이며 네이버 예약과 전화 예약 모두 가능합니다.",
  ],
  [
    "주차는 어디에 하나요?",
    "건물 뒤편 지상주차장을 무료로 이용할 수 있습니다.",
  ],
  ["포장이나 배달이 가능한가요?", "포장은 가능하며 배달은 운영하지 않습니다."],
] as const;
