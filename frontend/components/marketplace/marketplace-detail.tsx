import { CollectibleArt } from "@/components/landing/collectible-art";
import type { MarketplaceItem } from "./data";

type MarketplaceDetailProps = {
  item: MarketplaceItem;
  onClose: () => void;
};

export function MarketplaceDetail({ item, onClose }: MarketplaceDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="nft-detail-title">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Demonstration asset</p>
          <button type="button" className="flex size-8 items-center justify-center rounded-full border border-border text-lg text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose} aria-label="Close details">×</button>
        </div>
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.05fr_.95fr]">
          <div className="aspect-square overflow-hidden rounded-2xl">
            <CollectibleArt variant={item.variant} />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">{item.collection}</p>
            <h2 id="nft-detail-title" className="mt-3 text-3xl font-semibold tracking-[-0.045em]">{item.name}</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
            <div className="mt-8 rounded-2xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Demonstration price</p>
              <p className="mt-1 text-2xl font-semibold">{item.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">SOL</span></p>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-5 border-y border-border py-5 text-sm">
              <div><dt className="text-xs text-muted-foreground">Creator</dt><dd className="mt-1 font-medium">{item.creator}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Owner</dt><dd className="mt-1 font-medium">{item.owner}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Edition</dt><dd className="mt-1 font-medium">{item.edition}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Category</dt><dd className="mt-1 font-medium">{item.category}</dd></div>
            </dl>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Ownership, listing, and price data shown here is local demonstration content. Transactions are not available yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
