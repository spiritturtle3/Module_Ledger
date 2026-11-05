import { Container } from "@/components/ui/container";
import { CollectibleArt } from "./collectible-art";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-32 sm:pt-40">
      <div className="pointer-events-none absolute -right-36 top-8 size-[28rem] rounded-full bg-accent/70 blur-3xl" />
      <Container className="relative grid items-center gap-14 pb-24 lg:grid-cols-[1.02fr_.98fr] lg:gap-20 lg:pb-32">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" />
            The next chapter of digital ownership
          </div>
          <h1 className="max-w-xl text-[3.25rem] font-semibold leading-[0.98] tracking-[-0.065em] text-foreground sm:text-6xl lg:text-[5.25rem]">
            Own what
            <br />
            <span className="text-primary">moves you.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            ModuLedger is a considered marketplace for discovering, creating, and collecting digital assets with confidence.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#collections" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5">
              Explore marketplace
              <span className="ml-3 text-base">↗</span>
            </a>
            <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-border bg-card/50 px-6 py-3.5 text-sm font-medium transition-colors hover:bg-muted">
              Create an NFT
            </a>
          </div>
          <div className="mt-12 flex items-center gap-7 border-t border-border pt-5 text-xs text-muted-foreground">
            <span><strong className="mr-1 text-sm font-semibold text-foreground">12k+</strong> assets minted</span>
            <span><strong className="mr-1 text-sm font-semibold text-foreground">4.8k</strong> creators</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[32rem] lg:mt-4">
          <div className="absolute -left-7 top-16 hidden rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Current floor</p>
            <p className="mt-1 text-sm font-semibold">3.42 SOL <span className="ml-1 text-xs font-normal text-primary">+12.4%</span></p>
          </div>
          <div className="absolute -right-5 bottom-14 z-10 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-lg backdrop-blur sm:-right-8">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#6ea88f]" />
              <span className="text-xs font-medium">Verified collection</span>
            </div>
          </div>
          <div className="aspect-[.86] rotate-2 rounded-[2rem] border border-border bg-card p-2 shadow-2xl shadow-foreground/10 transition-transform duration-500 hover:rotate-0 sm:p-3">
            <CollectibleArt />
            <div className="flex items-end justify-between px-3 pb-2 pt-4 sm:px-4 sm:pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Featured drop</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">The Quiet Forms</h2>
              </div>
              <p className="text-right text-sm font-medium">2.40 SOL<br /><span className="text-xs font-normal text-muted-foreground">Edition 014</span></p>
            </div>
          </div>
        </div>
      </Container>
      <div className="border-y border-border bg-card/35">
        <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
          <span>Built on Solana</span><span>Creator-first</span><span>Transparent by design</span><span>Community-owned</span>
        </Container>
      </div>
    </section>
  );
}
