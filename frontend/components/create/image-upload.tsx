"use client";

import type { ChangeEvent } from "react";
import Image from "next/image";
import { ACCEPTED_IMAGE_LABEL, MAX_IMAGE_SIZE, validateImage } from "@/utils/create-validation";

type ImageUploadProps = {
  file: File | null;
  preview: string | null;
  error?: string;
  onChange: (file: File | null, error?: string) => void;
};

export function ImageUpload({ file, preview, error, onChange }: ImageUploadProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    const validationError = validateImage(nextFile);
    onChange(validationError ? null : nextFile, validationError);
    event.target.value = "";
  };

  return (
    <div>
      <div className={`relative flex min-h-72 overflow-hidden rounded-2xl border-2 border-dashed bg-background transition-colors ${error ? "border-destructive/70" : "border-border hover:border-primary/60"}`}>
        {preview ? (
          <>
            <Image src={preview} alt="NFT upload preview" fill unoptimized sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-foreground/75 px-4 py-3 text-background backdrop-blur">
              <span className="max-w-[70%] truncate text-xs">{file?.name}</span>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-lg bg-background/15 px-3 py-1.5 text-xs font-medium hover:bg-background/25" onClick={() => onChange(null)}>
                  Remove
                </button>
                <label className="cursor-pointer rounded-lg bg-background/15 px-3 py-1.5 text-xs font-medium hover:bg-background/25">
                  Replace
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleChange} />
                </label>
              </div>
            </div>
          </>
        ) : (
          <label className="flex w-full cursor-pointer flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground">↑</span>
            <span className="mt-4 text-sm font-medium">Drop an image here, or browse</span>
            <span className="mt-2 text-xs text-muted-foreground">{ACCEPTED_IMAGE_LABEL} · up to {MAX_IMAGE_SIZE / 1024 / 1024} MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleChange} />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
