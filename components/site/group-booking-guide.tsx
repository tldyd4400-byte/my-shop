import { STORE } from "@/lib/content/store";

const proofs = [
  { label: "CAPACITY", title: `한 팀 최대 ${STORE.maxGroupSize}명`, detail: STORE.seats },
  { label: "PRIVATE HIRE", title: "통대관 사전 협의", detail: `${STORE.privateHire} · ${STORE.privateHireMinimum}` },
  { label: "PARKING", title: "건물 뒤 무료주차", detail: STORE.groupParking },
  { label: "MENU", title: "매운맛 · 간장맛", detail: "여러 취향을 함께 고려" },
] as const;

export function GroupBookingGuide() {
  return (
    <section className="group-booking-guide section-pad surface-paper" aria-labelledby="group-booking-guide-title">
      <div className="shell">
        <div className="group-v5-proof-grid" aria-label="단체 이용 핵심 정보">
          {proofs.map((proof) => (
            <article className="group-v5-proof" key={proof.label}>
              <p className="eyebrow">{proof.label}</p>
              <h2>{proof.title}</h2>
              <p>{proof.detail}</p>
            </article>
          ))}
        </div>

        <div className="group-v5-choice-grid">
          <article className="group-v5-choice">
            <p className="eyebrow">BOOKING CHOICE</p>
            <h2 id="group-booking-guide-title">어떤 방법으로 준비하면 될까요?</h2>
            <h3>일반 식사</h3>
            <p>네이버 예약에서 가능한 시간을 확인하고 예약합니다.</p>
            <h3>단체·통대관</h3>
            <p>전화로 날짜·시간·예상 인원을 먼저 알려주시면 좌석과 준비 사항을 안내합니다.</p>
            <p className="group-v5-note">특정 인원 기준을 새로 만들지 않고 통대관 여부는 매장과 사전에 협의합니다.</p>
          </article>

          <article className="group-v5-checklist">
            <p className="eyebrow">BEFORE YOU CALL</p>
            <h2>전화 전에 세 가지만 준비하세요</h2>
            <ol>
              {STORE.groupConsultation.map((item, index) => (
                <li key={item}><span>0{index + 1}</span>{item}</li>
              ))}
            </ol>
            <p>상담 후 메뉴 선택, 좌석 구성, 통대관 여부와 준비 사항을 확정합니다.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
