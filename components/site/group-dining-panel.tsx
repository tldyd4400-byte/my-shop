import Image from "next/image";
import Link from "next/link";

import { AnalyticsLink } from "@/components/site/analytics-link";
import { STORE } from "@/lib/content/store";

export function GroupDiningPanel({ placement }: { placement: string }) {
  return (
    <section className="group-dining section-pad">
      <div className="shell group-dining-grid">
        <Image src="/images/eomeuittul/interior.jpg" alt={`최대 ${STORE.maxGroupSize}명 단체 이용이 가능한 어믜뜰 내부 좌석`} width={640} height={440} sizes="(max-width: 767px) calc(100vw - 48px), 50vw" />
        <div>
          <p className="eyebrow">SPACE FOR TOGETHER</p>
          <h2>청주 모임과 회식,<br />최대 {STORE.maxGroupSize}명까지 한자리에서</h2>
          <p>{STORE.groupBooking}</p>
          <p>12테이블 · 총 52석 · 건물 뒤 무료 지상주차장</p>
          <div className="group-dining-actions">
            <Link className="button button-primary" href="/stories/cheongju-group-dining">단체 이용 자세히 보기</Link>
            <AnalyticsLink className="button button-secondary" href={STORE.phoneHref} eventName="group_inquiry_click" placement={placement}>전화로 일정 상담</AnalyticsLink>
          </div>
        </div>
      </div>
    </section>
  );
}
