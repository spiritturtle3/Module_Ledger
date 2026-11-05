import { Schema, model, models, type Document, type Model } from 'mongoose';

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'healthy'
  | 'partial'
  | 'program_missing'
  | 'cursor_missing'
  | 'offline'
  | 'error';

export interface SyncStateRecord extends Document {
  key: string;
  lastSignature: string | null;
  lastSlot: number | null;
  genesisHash: string | null;
  status: SyncStatus;
  lastError: string | null;
  lastSyncedAt: Date | null;
  resetDetectedAt: Date | null;
}

const syncStateSchema = new Schema<SyncStateRecord>(
  {
    key: { type: String, required: true, unique: true },
    lastSignature: { type: String, default: null },
    lastSlot: { type: Number, default: null },
    genesisHash: { type: String, default: null },
    status: {
      type: String,
      enum: [
        'idle',
        'syncing',
        'healthy',
        'partial',
        'program_missing',
        'cursor_missing',
        'offline',
        'error',
      ],
      default: 'idle',
    },
    lastError: { type: String, default: null },
    lastSyncedAt: { type: Date, default: null },
    resetDetectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const SyncStateModel =
  (models.SyncState as Model<SyncStateRecord> | undefined) ??
  model<SyncStateRecord>('SyncState', syncStateSchema);
