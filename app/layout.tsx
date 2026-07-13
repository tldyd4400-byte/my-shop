import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "어믜뜰 등갈비찜 청주봉명동본점",
  description:
    "청주 봉명동에서 샤브처럼 즐기는 매운 등갈비찜 한 상. 메뉴, 예약, 주차와 오시는 길을 확인하세요.",
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
