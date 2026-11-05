import { Schema, model, models, type Document, type Model } from "mongoose";

export interface NftAttribute {
  trait_type: string;
  value: string;
}

export interface NftCacheRecord extends Document {
  mint: string;
  name: string;
  symbol: string | null;
  uri: string | null;
  image: string | null;
  description: string | null;
  collectionMint: string | null;
  collectionVerified: boolean;
  attributes: NftAttribute[];
  fetchedAt: Date;
}

const attributeSchema = new Schema<NftAttribute>(
  {
    trait_type: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const nftCacheSchema = new Schema<NftCacheRecord>(
  {
    mint: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    symbol: { type: String, default: null },
    uri: { type: String, default: null },
    image: { type: String, default: null },
    description: { type: String, default: null },
    collectionMint: { type: String, default: null },
    collectionVerified: { type: Boolean, required: true, default: false },
    attributes: {
      type: [attributeSchema],
      default: [],
    },
    fetchedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export const NftCacheModel =
  (models.NftCache as Model<NftCacheRecord> | undefined) ??
  model<NftCacheRecord>("NftCache", nftCacheSchema);
