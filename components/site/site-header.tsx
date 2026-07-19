"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";

const links = [
  ["\uba54\ub274", "/menu"],
  ["\ub9e4\uc7a5", "/store"],
  ["\uc624\uc2dc\ub294 \uae38", "/location"],
  ["FAQ", "/faq"],
  ["\ud6c4\uae30", "/reviews"],
  ["\uc774\uc57c\uae30", "/stories"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/">
          {STORE.name}
        </Link>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <AnalyticsLink
            className="button button-primary button-small"
            href={STORE.bookingUrl}
            target="_blank"
            rel="noreferrer"
            eventName="naver_reservation_click"
            placement="header"
          >
            네이버 예약
          </AnalyticsLink>
        </nav>
        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "\uba54\ub274 \ub2eb\uae30" : "\uba54\ub274 \uc5f4\uae30"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <nav id="mobile-navigation" className="mobile-nav" hidden={!open}>
        {links.map(([label, href]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
