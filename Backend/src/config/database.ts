import mongoose from 'mongoose';
import { env } from './env.js';

let connectPromise: Promise<boolean> | undefined;

export async function connectDatabase(): Promise<boolean> {
  if (!env.mongodbUri) return false;
  if (mongoose.connection.readyState === 1) return true;

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 })
      .then(() => true)
      .catch((error: unknown) => {
        connectPromise = undefined;
        throw error;
      });
  }

  return connectPromise ?? Promise.resolve(false);
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
