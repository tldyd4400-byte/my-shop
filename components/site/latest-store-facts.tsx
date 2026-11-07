import { MENU_ITEMS, STORE } from "@/lib/content/store";

export function LatestStoreFacts() {
  const signatureSet = MENU_ITEMS.find((item) => item.slug === "spicy-set")!;
  const [weekdayLunch, weekdayDinner, weekend] = STORE.openingPeriods;
  const facts = [
    {
      label: "영업",
      value: `화~금 ${weekdayLunch.opens}~${weekdayDinner.closes} · ${weekdayLunch.closes}~${weekdayDinner.opens} 브레이크 · 토~일 ${weekend.opens}~${weekend.closes} · ${STORE.regularClosure}`,
    },
    {
      label: "대표 세트",
      value: `매운·간장 ${signatureSet.price} · ${signatureSet.minimumOrder}인 이상`,
    },
    { label: "주차", value: STORE.parking },
    {
      label: "단체",
      value: `2~${STORE.maxGroupSize}명 · ${STORE.privateHire}`,
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
