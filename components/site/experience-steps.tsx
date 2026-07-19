import Image from "next/image";

import { DINING_STEPS } from "@/lib/content/store";

export function ExperienceSteps() {
  return (
    <section className="experience section-pad surface-paper">
      <div className="shell">
        <h2>등갈비찜부터 연유빙수까지, 한 끼의 식사 경험</h2>
        <p>
          고르고, 담고, 함께 끓여 먹는 과정까지 즐거운 어밀뜰만의 네 단계
        </p>
        <ol className="experience-grid">
          {DINING_STEPS.map((step) => (
            <li key={step.number} className="experience-card">
              {step.mediaType === "video" ? (
                <video
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  poster="/images/eomeuittul/step-1-ribs.png"
                  aria-label={step.alt}
                >
                  <source src={step.media} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={step.media}
                  alt={step.alt}
                  width={520}
                  height={320}
                />
              )}
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
