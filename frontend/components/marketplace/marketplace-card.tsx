import { CollectibleArt } from "@/components/landing/collectible-art";
import type { MarketplaceItem } from "./data";

type MarketplaceCardProps = {
  item: MarketplaceItem;
  onSelect: (item: MarketplaceItem) => void;
};

export function MarketplaceCard({ item, onSelect }: MarketplaceCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card p-2 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5">
      <div className="aspect-[1.08] overflow-hidden rounded-xl">
        <CollectibleArt variant={item.variant} />
      </div>
      <div className="p-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold tracking-tight">{item.name}</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">{item.collection}</p>
          </div>
          <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-medium text-accent-foreground">Demo</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">By <span className="text-foreground">{item.creator}</span></p>
          <p className="text-sm font-semibold">{item.price.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">SOL</span></p>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
          onClick={() => onSelect(item)}
        >
          View details
        </button>
      </div>
    </article>
  );
}
