import type { NftDraft, NftDraftErrors } from "@/types/create";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ACCEPTED_IMAGE_LABEL = "PNG, JPG, WEBP, or GIF";

export function validateImage(file: File | null): string | undefined {
  if (!file) return "Add an image to continue.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `Use ${ACCEPTED_IMAGE_LABEL}.`;
  if (file.size > MAX_IMAGE_SIZE) return "Images must be smaller than 10 MB.";
  return undefined;
}

export function validateNftDraft(draft: NftDraft): NftDraftErrors {
  const errors: NftDraftErrors = {};
  const name = draft.name.trim();
  const description = draft.description.trim();
  const collection = draft.collection.trim();
  const royalty = Number(draft.royalty);
  const supply = Number(draft.supply);

  if (!name) errors.name = "Give your NFT a name.";
  else if (name.length > 80) errors.name = "Keep the name under 80 characters.";
  if (!description) errors.description = "Add a short description.";
  else if (description.length > 500) errors.description = "Keep the description under 500 characters.";
  if (!collection) errors.collection = "Add a collection name.";
  else if (collection.length > 60) errors.collection = "Keep the collection name under 60 characters.";
  if (!draft.royalty) errors.royalty = "Add a royalty percentage.";
  else if (!Number.isFinite(royalty) || royalty < 0 || royalty > 25) errors.royalty = "Use a royalty between 0 and 25%.";
  if (!draft.supply) errors.supply = "Add an edition count.";
  else if (!Number.isInteger(supply) || supply < 1 || supply > 1000000) errors.supply = "Use a whole number between 1 and 1,000,000.";

  const imageError = validateImage(draft.image);
  if (imageError) errors.image = imageError;

  const hasIncompleteTrait = draft.traits.some((trait) => (trait.traitType.trim() && !trait.value.trim()) || (!trait.traitType.trim() && trait.value.trim()));
  if (hasIncompleteTrait) errors.traits = "Complete or remove each trait row.";
  return errors;
}
