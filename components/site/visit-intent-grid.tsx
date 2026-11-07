import { AnalyticsLink } from "@/components/site/analytics-link";
import { VISIT_INTENT_ITEMS } from "@/lib/content/store";

export function VisitIntentGrid() {
  return (
    <section
      className="visit-intents section-pad"
      aria-labelledby="visit-intents-title"
    >
      <div className="shell">
        <div className="visit-intents-heading">
          <p className="eyebrow">CHOOSE YOUR VISIT</p>
          <h2 id="visit-intents-title">어떤 자리로 오시나요?</h2>
          <p>각 상황에 필요한 정보와 다음 행동을 바로 보여드립니다.</p>
        </div>
        <div className="visit-intent-grid">
          {VISIT_INTENT_ITEMS.map((item) => (
            <article
              className={`visit-intent-card${
                item.featured ? " visit-intent-card--featured" : ""
              }`}
              key={item.id}
            >
              <p className="visit-intent-label">
                {item.number} · {item.label}
              </p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <AnalyticsLink
                className="visit-intent-link"
                href={item.href}
                eventName="visit_intent_click"
                placement={item.placement}
              >
                {item.ctaLabel} <span aria-hidden="true">→</span>
              </AnalyticsLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
