import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="brand">
          <span className="brand-orbit">◉</span>
          <span>
            Modu<span className="brand-accent">Ledger</span>
          </span>
        </Link>
        <p>Model ownership, made verifiable.</p>
        <span className="footer-copy">© {new Date().getFullYear()} ModuLedger</span>
      </div>
    </footer>
  );
}
