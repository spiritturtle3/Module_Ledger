export type NftTrait = {
  id: string;
  traitType: string;
  value: string;
};

export type NftDraft = {
  name: string;
  description: string;
  collection: string;
  royalty: string;
  supply: string;
  traits: NftTrait[];
  image: File | null;
  imagePreview: string | null;
};

export type NftDraftErrors = Partial<
  Record<"name" | "description" | "collection" | "royalty" | "supply" | "image" | "traits", string>
>;
