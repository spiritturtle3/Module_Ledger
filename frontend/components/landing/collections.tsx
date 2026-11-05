import { Container } from "@/components/ui/container";
import { CollectibleArt } from "./collectible-art";

const collections = [
  { title: "Soft Horizons", creator: "Mira Chen", price: "1.80 SOL", variant: "sunset" as const, label: "Digital studies in light" },
  { title: "Orbitals / 01", creator: "Studio Kinetic", price: "3.42 SOL", variant: "orbit" as const, label: "Generative systems" },
  { title: "Quiet Totems", creator: "Niko Eames", price: "0.95 SOL", variant: "totem" as const, label: "Objects for another time" },
];

export function Collections() {
  return (
    <section id="collections" className="border-y border-border bg-card/40 py-24 sm:py-32">
      <Container>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">Made to be found</p>
            <h2 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Featured collections</h2>
          </div>
          <a href="#collections" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">View all collections <span className="ml-1 text-primary">↗</span></a>
        </div>
        <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">A small selection from the ModuLedger community. Demonstration content for preview purposes.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {collections.map((collection) => (
            <article key={collection.title} className="group overflow-hidden rounded-2xl border border-border bg-background p-2 transition-shadow hover:shadow-xl hover:shadow-foreground/5">
              <div className="aspect-[1.18] overflow-hidden rounded-xl">
                <CollectibleArt variant={collection.variant} />
              </div>
              <div className="p-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold tracking-tight">{collection.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{collection.label}</p>
                  </div>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-accent-foreground">Verified</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">By <span className="text-foreground">{collection.creator}</span></span>
                  <span className="font-medium">{collection.price}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
