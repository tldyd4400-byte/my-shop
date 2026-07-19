import Image from "next/image";
import type { ReactNode } from "react";

type HeroMediaProps = {
  title: ReactNode;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  video?: string;
  children: ReactNode;
};

export function HeroMedia({
  title,
  eyebrow,
  description,
  image,
  imageAlt,
  video,
  children,
}: HeroMediaProps) {
  return (
    <section className="hero-media">
      <div className="hero-background">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
        />
        {video ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={image}
            aria-label={imageAlt}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : null}
      </div>
      <div className="hero-overlay" />
      <div className="shell hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="hero-actions">{children}</div>
      </div>
    </section>
  );
}
