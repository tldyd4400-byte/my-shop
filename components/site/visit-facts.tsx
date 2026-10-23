import { STORE } from "@/lib/content/store";

export function VisitFacts() {
  const [weekdayLunch, weekdayDinner, weekend] = STORE.openingPeriods;

  return (
    <section className="visit-facts section-pad" aria-labelledby="visit-facts-title">
      <div className="shell visit-facts-grid">
        <div>
          <p className="eyebrow">HOURS &amp; ACCESS</p>
          <h2 id="visit-facts-title">방문 전에 이것만 확인하세요</h2>
          <dl>
            <div><dt>화~금</dt><dd>{`${weekdayLunch.opens}~${weekdayDinner.closes} · ${weekdayLunch.closes}~${weekdayDinner.opens} 브레이크타임`}</dd></div>
            <div><dt>토·일·공휴일</dt><dd>{`${weekend.opens}~${weekend.closes} · 브레이크타임 없음`}</dd></div>
            <div><dt>라스트오더</dt><dd>{STORE.lastOrder}</dd></div>
            <div><dt>휴무</dt><dd>{STORE.regularClosure} · {STORE.holidayClosure}</dd></div>
            <div><dt>주차</dt><dd>{STORE.parking}</dd></div>
          </dl>
        </div>
        <div>
          <h3>가족과 휠체어 이용자도 편안하게</h3>
          <ul>
            {[...STORE.familyFacilities, ...STORE.accessibility].map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
