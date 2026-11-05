import Image from "next/image";
import { CollectibleArt } from "@/components/landing/collectible-art";
import type { NftDraft } from "@/types/create";

type NftPreviewProps = {
  draft: NftDraft;
};

export function NftPreview({ draft }: NftPreviewProps) {
  const traits = draft.traits.filter((trait) => trait.traitType.trim() && trait.value.trim());

  return (
    <div className="sticky top-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Live preview</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Your collectible</h2>
        </div>
        <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-accent-foreground">Not minted</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl shadow-foreground/5">
        <div className="relative aspect-square overflow-hidden rounded-xl">
          {draft.imagePreview ? <Image src={draft.imagePreview} alt="" fill unoptimized sizes="(max-width: 1024px) 100vw, 500px" className="object-cover" /> : <CollectibleArt variant="hero" />}
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">{draft.collection.trim() || "Your collection"}</p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">{draft.name.trim() || "Untitled collectible"}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{draft.description.trim() || "Your description will appear here."}</p>
          {traits.length > 0 && <div className="mt-5 grid grid-cols-2 gap-2">{traits.map((trait) => <div key={trait.id} className="rounded-lg bg-accent/70 px-3 py-2"><p className="truncate text-[10px] uppercase tracking-wider text-accent-foreground/70">{trait.traitType}</p><p className="mt-1 truncate text-xs font-medium text-accent-foreground">{trait.value}</p></div>)}</div>}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs"><span className="text-muted-foreground">Edition</span><span className="font-medium">{draft.supply || "—"} {draft.supply === "1" ? "item" : "items"}</span></div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">This preview is generated locally. A future upload and minting service will connect this draft to the network.</p>
    </div>
  );
}
