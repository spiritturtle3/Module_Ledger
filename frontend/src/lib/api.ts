import { API_BASE_URL } from "@/lib/config";
import type { ModelMetadata, UploadResponse } from "@/types/api";

export { buildModelMetadata } from "@/lib/model-metadata";

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as (T & { message?: string }) | null;

  if (!response.ok) {
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  if (!body) throw new Error("The backend returned an invalid response.");
  return body;
}

async function requestBackend(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    // Browsers report CORS, offline servers and DNS failures as a generic TypeError.
    throw new Error(
      `Cannot reach the ModuLedger API at ${API_BASE_URL}. Check the backend /api/health, NEXT_PUBLIC_API_BASE_URL and the backend FRONTEND_ORIGINS (CORS) setting. ${error instanceof Error ? error.message : "Network error."}`,
    );
  }
}

export async function uploadFile(file: File): Promise<UploadResponse["data"]> {
  const body = new FormData();
  body.append("file", file);
  const response = await requestBackend(`${API_BASE_URL}/ipfs/upload-file`, {
    method: "POST",
    body,
  });
  return (await readResponse<UploadResponse>(response)).data;
}

export async function uploadMetadata(metadata: ModelMetadata): Promise<UploadResponse["data"]> {
  const response = await requestBackend(`${API_BASE_URL}/ipfs/upload-metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  return (await readResponse<UploadResponse>(response)).data;
}
