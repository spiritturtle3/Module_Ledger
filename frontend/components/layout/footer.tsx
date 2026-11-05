import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <a href="#home" className="text-lg font-semibold tracking-[-0.03em]">ModuLedger</a>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">A home for digital ownership, built for the people making what&apos;s next.</p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#home" className="transition-colors hover:text-foreground">Home</a>
          <a href="#collections" className="transition-colors hover:text-foreground">Marketplace</a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">About</a>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 ModuLedger. Built on Solana.</p>
      </Container>
    </footer>
  );
}
