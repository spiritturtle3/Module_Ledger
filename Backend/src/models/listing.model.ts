import { Schema, model, models, type Document, type Model } from "mongoose";

export type ListingStatus = "active" | "delisted" | "sold" | "orphaned";

export interface ListingAttribute {
  trait_type: string;
  value: string;
}

export interface ListingRecord extends Document {
  listingAddress: string;
  marketplace: string;
  maker: string;
  mint: string;
  priceLamports: string;
  vaultAddress: string;
  collectionMint: string | null;
  name: string;
  symbol: string | null;
  metadataUri: string | null;
  image: string | null;
  description: string | null;
  attributes: ListingAttribute[];
  status: ListingStatus;
  createdSignature: string;
  createdSlot: number;
  closedSignature: string | null;
  closedSlot: number | null;
}

const attributeSchema = new Schema<ListingAttribute>(
  {
    trait_type: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const listingSchema = new Schema<ListingRecord>(
  {
    listingAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    marketplace: { type: String, required: true, index: true },
    maker: { type: String, required: true, index: true },
    mint: { type: String, required: true, index: true },
    priceLamports: { type: String, required: true },
    vaultAddress: { type: String, required: true },
    collectionMint: { type: String, default: null, index: true },
    name: { type: String, required: true },
    symbol: { type: String, default: null },
    metadataUri: { type: String, default: null },
    image: { type: String, default: null },
    description: { type: String, default: null },
    attributes: {
      type: [attributeSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "delisted", "sold", "orphaned"],
      required: true,
      index: true,
    },
    createdSignature: { type: String, required: true, index: true },
    createdSlot: { type: Number, required: true, index: true },
    closedSignature: { type: String, default: null },
    closedSlot: { type: Number, default: null },
  },
  { timestamps: true },
);

listingSchema.index({ marketplace: 1, status: 1, createdSlot: -1 });

export const ListingModel =
  (models.Listing as Model<ListingRecord> | undefined) ??
  model<ListingRecord>("Listing", listingSchema);
