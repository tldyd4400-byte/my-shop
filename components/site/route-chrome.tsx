"use client";

import { usePathname } from "next/navigation";

import { MobileActionBar } from "@/components/site/mobile-action-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

type RouteChromeProps = Readonly<{
  children: React.ReactNode;
}>;

export function RouteChrome({ children }: RouteChromeProps) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return children;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <MobileActionBar />
    </>
  );
}
