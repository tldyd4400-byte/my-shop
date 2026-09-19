import type { Metadata } from "next";
import Script from "next/script";

import { RouteChrome } from "@/components/site/route-chrome";
// RouteChrome owns SiteHeader, SiteFooter, and MobileActionBar visibility.
import { STORE } from "@/lib/content/store";

import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.NAVER_SITE_VERIFICATION;

const verification: Metadata["verification"] = {
  ...(googleVerification ? { google: googleVerification } : {}),
  ...(naverVerification
    ? { other: { "naver-site-verification": naverVerification } }
    : {}),
};

export const metadata: Metadata = {
  metadataBase: new URL(STORE.url),
  title: {
    default: "청주 봉명동 맛집 어믜뜰 | 색다른 등갈비찜",
    template: "%s | 어믜뜰",
  },
  description:
    "청주 봉명동에서 등갈비찜과 30여 종 셀프바를 샤브처럼 즐기는 어믜뜰입니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: STORE.fullName,
    title: "청주 봉명동 맛집 어믜뜰 | 색다른 등갈비찜",
    description:
      "청주 봉명동에서 등갈비찜과 30여 종 셀프바를 샤브처럼 즐기는 어믜뜰입니다.",
    images: [
      {
        url: STORE.image,
        alt: "어믜뜰 매운 등갈비찜",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <RouteChrome>{children}</RouteChrome>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
