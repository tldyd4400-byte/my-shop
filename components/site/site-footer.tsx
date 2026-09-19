import { STORE } from "@/lib/content/store";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <strong>{STORE.name}</strong>
          <p>{STORE.fullName}</p>
        </div>
        <p>
          {STORE.address} · {STORE.phoneDisplay}
        </p>
      </div>
    </footer>
  );
}
