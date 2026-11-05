import { API_BASE_URL } from "@/lib/config";
import type { ModelMetadata, UploadResponse } from "@/types/api";

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as (T & { message?: string }) | null;

  if (!response.ok) {
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  if (!body) throw new Error("The backend returned an invalid response.");
  return body;
}

export async function uploadFile(file: File): Promise<UploadResponse["data"]> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_BASE_URL}/ipfs/upload-file`, {
    method: "POST",
    body,
  });
  return (await readResponse<UploadResponse>(response)).data;
}

export async function uploadMetadata(metadata: ModelMetadata): Promise<UploadResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/ipfs/upload-metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  return (await readResponse<UploadResponse>(response)).data;
}
