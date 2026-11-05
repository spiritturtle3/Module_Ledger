"use client";

import { useState } from "react";

const links = [
  { label: "Home", href: "/#home" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "About", href: "/#how-it-works" },
  { label: "Create", href: "/create" },
];

function LogoMark() {
  return (
    <span className="relative flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <span className="absolute size-3.5 rounded-full border-2 border-current" />
      <span className="absolute h-2.5 w-px -translate-y-1 bg-current" />
      <span className="absolute h-px w-2.5 translate-y-1 bg-current" />
    </span>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
        <a href="#home" className="flex items-center gap-2.5" aria-label="ModuLedger home">
          <LogoMark />
          <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">ModuLedger</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="hidden items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 md:flex"
        >
          Connect wallet
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border border-border md:hidden"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="flex w-4 flex-col gap-1.5" aria-hidden="true">
            <span className={`h-px w-full bg-foreground transition-transform ${isOpen ? "translate-y-1 rotate-45" : ""}`} />
            <span className={`h-px w-full bg-foreground transition-opacity ${isOpen ? "opacity-0" : ""}`} />
            <span className={`h-px w-full bg-foreground transition-transform ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>
      </nav>

      {isOpen && (
        <div className="mx-6 rounded-2xl border border-border bg-card p-3 shadow-xl md:hidden">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button type="button" className="mt-2 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background">
            Connect wallet
          </button>
        </div>
      )}
    </header>
  );
}
