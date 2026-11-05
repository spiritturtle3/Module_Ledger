"use client";

import type { NftTrait } from "@/types/create";

type TraitEditorProps = {
  traits: NftTrait[];
  error?: string;
  onChange: (traits: NftTrait[]) => void;
};

export function TraitEditor({ traits, error, onChange }: TraitEditorProps) {
  const updateTrait = (id: string, field: keyof NftTrait, value: string) => {
    onChange(traits.map((trait) => trait.id === id ? { ...trait, [field]: value } : trait));
  };

  return (
    <div>
      <div className="space-y-3">
        {traits.map((trait) => (
          <div key={trait.id} className="flex gap-2">
            <input value={trait.traitType} onChange={(event) => updateTrait(trait.id, "traitType", event.target.value)} placeholder="Trait type" maxLength={40} className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20" />
            <input value={trait.value} onChange={(event) => updateTrait(trait.id, "value", event.target.value)} placeholder="Value" maxLength={60} className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20" />
            <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-lg text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => onChange(traits.filter((currentTrait) => currentTrait.id !== trait.id))} aria-label="Remove trait">×</button>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <button type="button" className="mt-3 text-xs font-medium text-primary hover:underline" onClick={() => onChange([...traits, { id: crypto.randomUUID(), traitType: "", value: "" }])}>+ Add trait</button>
    </div>
  );
}
