"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WalletButton } from "@/components/wallet-button";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/publish", label: "Publish model" },
  { href: "/collections", label: "Collections" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="ModuLedger home">
          <span className="brand-orbit">◉</span>
          <span>
            Modu<span className="brand-accent">Ledger</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              className={pathname.startsWith(link.href) ? "nav-link active" : "nav-link"}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <WalletButton />
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
