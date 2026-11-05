"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "./image-upload";
import { NftPreview } from "./nft-preview";
import { TraitEditor } from "./trait-editor";
import type { NftDraft, NftDraftErrors } from "@/types/create";
import { validateNftDraft } from "@/utils/create-validation";

const initialDraft: NftDraft = { name: "", description: "", collection: "", royalty: "5", supply: "1", traits: [], image: null, imagePreview: null };

export function CreationForm() {
  const [draft, setDraft] = useState<NftDraft>(initialDraft);
  const [errors, setErrors] = useState<NftDraftErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => () => { if (draft.imagePreview) URL.revokeObjectURL(draft.imagePreview); }, [draft.imagePreview]);

  const updateDraft = <K extends keyof NftDraft>(field: K, value: NftDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitted(false);
  };

  const handleImageChange = (file: File | null, error?: string) => {
    if (draft.imagePreview) URL.revokeObjectURL(draft.imagePreview);
    updateDraft("image", file);
    setDraft((current) => ({ ...current, imagePreview: file ? URL.createObjectURL(file) : null }));
    setErrors((current) => ({ ...current, image: error }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateNftDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setSubmitted(true);
  };

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)] lg:gap-20">
      <form onSubmit={handleSubmit} noValidate className="space-y-10">
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">01 / Artwork</p>
          <h2 className="text-xl font-semibold tracking-tight">Start with your visual</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a high-quality image for your collectible. This stays in your browser for now.</p>
          <div className="mt-5"><ImageUpload file={draft.image} preview={draft.imagePreview} error={errors.image} onChange={handleImageChange} /></div>
        </div>

        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">02 / Details</p>
          <div className="space-y-5">
            <Field label="NFT name" required error={errors.name}><input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} maxLength={80} placeholder="e.g. Quiet Forms #015" className="form-input" /></Field>
            <Field label="Description" required hint={`${draft.description.length}/500`} error={errors.description}><textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} maxLength={500} rows={4} placeholder="Tell collectors what makes this piece special..." className="form-input resize-none py-3" /></Field>
            <Field label="Collection name" required error={errors.collection}><input value={draft.collection} onChange={(event) => updateDraft("collection", event.target.value)} maxLength={60} placeholder="e.g. The Quiet Forms" className="form-input" /></Field>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">03 / Attributes</p>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">Add optional traits to help collectors understand your work.</p>
          <TraitEditor traits={draft.traits} error={errors.traits} onChange={(traits) => updateDraft("traits", traits)} />
        </div>

        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">04 / Edition settings</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Royalty" required hint="0–25%" error={errors.royalty}><div className="relative"><input type="number" min="0" max="25" step="0.5" value={draft.royalty} onChange={(event) => updateDraft("royalty", event.target.value)} className="form-input pr-12" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span></div></Field>
            <Field label="Supply" required hint="Edition count" error={errors.supply}><input type="number" min="1" max="1000000" step="1" value={draft.supply} onChange={(event) => updateDraft("supply", event.target.value)} className="form-input" /></Field>
          </div>
        </div>

        <div className="border-t border-border pt-7">
          {submitted && <div role="status" className="mb-4 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground">Draft ready. No NFT was minted and no transaction was submitted.</div>}
          <button type="submit" className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5">Prepare demo draft</button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Wallet connection and minting will be added in a future integration.</p>
        </div>
      </form>
      <NftPreview draft={draft} />
    </div>
  );
}

type FieldProps = { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode };

function Field({ label, required, hint, error, children }: FieldProps) {
  return <label className="block"><span className="mb-2 flex items-center justify-between text-sm font-medium"><span>{label}{required && <span className="ml-1 text-primary">*</span>}</span>{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</span>{children}{error && <span className="mt-2 block text-xs text-destructive">{error}</span>}</label>;
}
