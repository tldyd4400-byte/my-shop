import type { Metadata } from "next";

import { SITE } from "@/lib/site-content";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "어믜뜰 등갈비찜 청주봉명동본점",
    template: "%s | 어믜뜰 청주봉명동본점",
  },
  description:
    "청주 봉명동에서 채소와 버섯을 더해 샤브처럼 즐기는 매운 등갈비찜 전문점. 메뉴, 네이버 예약, 단체석, 주차와 오시는 길을 확인하세요.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: SITE.fullName,
    title: "어믜뜰 등갈비찜 청주봉명동본점",
    description:
      "청주 봉명동에서 채소와 버섯을 더해 샤브처럼 즐기는 매운 등갈비찜 한 상",
    images: [
      {
        url: SITE.image,
        width: 2000,
        height: 1333,
        alt: "어믜뜰 매운 등갈비찜",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
