"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { NAV_ITEMS, SITE } from "@/lib/site-content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="#top" aria-label={`${SITE.name} 홈`}>
          <span className="brand-mark" aria-hidden="true">
            母
          </span>
          <span>{SITE.name}</span>
        </a>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
          <a
            className="button button-primary button-small"
            href={SITE.naverSearch}
            target="_blank"
            rel="noreferrer"
          >
            네이버 예약
          </a>
        </nav>

        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="모바일 메뉴"
        hidden={!open}
      >
        {NAV_ITEMS.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <a
          href={SITE.naverSearch}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpen(false)}
        >
          네이버 예약
        </a>
      </nav>
    </header>
  );
}
