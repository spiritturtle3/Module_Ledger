import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface SaleRecord extends Document {
  signature: string;
  listingAddress: string;
  marketplace: string;
  buyer: string;
  maker: string;
  mint: string;
  priceLamports: string;
  feeLamports: string;
  rewardBaseUnits: string;
  slot: number;
}

const saleSchema = new Schema<SaleRecord>(
  {
    signature: { type: String, required: true, unique: true, index: true },
    listingAddress: { type: String, required: true, index: true },
    marketplace: { type: String, required: true, index: true },
    buyer: { type: String, required: true, index: true },
    maker: { type: String, required: true, index: true },
    mint: { type: String, required: true, index: true },
    priceLamports: { type: String, required: true },
    feeLamports: { type: String, required: true },
    rewardBaseUnits: { type: String, required: true },
    slot: { type: Number, required: true, index: true },
  },
  { timestamps: true },
);

export const SaleModel =
  (models.Sale as Model<SaleRecord> | undefined) ??
  model<SaleRecord>('Sale', saleSchema);
