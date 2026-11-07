import { MENU_ITEMS, STORE } from "@/lib/content/store";

function priceAndMinimum(price: string, minimumOrder?: number) {
  return minimumOrder === undefined ? price : `${price} · ${minimumOrder}인 이상`;
}

export function LatestStoreFacts() {
  const spicySet = MENU_ITEMS.find((item) => item.slug === "spicy-set")!;
  const soySet = MENU_ITEMS.find((item) => item.slug === "soy-set")!;
  const setPrices =
    spicySet.price === soySet.price && spicySet.minimumOrder === soySet.minimumOrder
      ? `매운·간장 ${priceAndMinimum(spicySet.price, spicySet.minimumOrder)}`
      : [spicySet, soySet]
          .map(({ name, price, minimumOrder }) => `${name} ${priceAndMinimum(price, minimumOrder)}`)
          .join(" / ");

  const [weekdayLunch, weekdayDinner, weekend] = STORE.openingPeriods;
  const weekdayLabel = weekdayLunch.label.replace(/ 점심$/, "");
  const weekdayHours = weekdayLabel === weekdayDinner.label.replace(/ 저녁$/, "")
    ? `${weekdayLabel} ${weekdayLunch.opens}~${weekdayDinner.closes} · ${weekdayLunch.closes}~${weekdayDinner.opens} 브레이크`
    : `${weekdayLunch.label} ${weekdayLunch.opens}~${weekdayLunch.closes} · ${weekdayDinner.label} ${weekdayDinner.opens}~${weekdayDinner.closes}`;
  const facts = [
    {
      label: "영업",
      value: `${weekdayHours} · ${weekend.label} ${weekend.opens}~${weekend.closes} · ${STORE.regularClosure}`,
    },
    {
      label: "대표 세트",
      value: setPrices,
    },
    { label: "주차", value: STORE.parking },
    {
      label: "단체",
      value: `${STORE.minGroupSize}~${STORE.maxGroupSize}명 · ${STORE.privateHire}`,
    },
  ] as const;

  return (
    <section
      className="latest-store-facts"
      aria-labelledby="latest-store-facts-title"
    >
      <div className="shell latest-store-facts-inner">
        <div className="latest-store-facts-heading">
          <div>
            <p className="eyebrow">LATEST STORE FACTS</p>
            <h2 id="latest-store-facts-title">한눈에 보는 최신 매장 정보</h2>
          </div>
          <p className="latest-store-facts-source">
            {STORE.verificationSource} ·{" "}
            <time dateTime={STORE.verifiedAt}>
              {STORE.verifiedAt.replaceAll("-", ".")} 확인
            </time>
          </p>
        </div>
        <dl className="latest-store-facts-grid">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
