import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "node:fs";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import type { IpfsMetadata } from "../validators/ipfs.validator.js";

interface PinataResponse {
  IpfsHash: string;
  PinSize?: number;
  Timestamp?: string;
}

export interface PinataUploadResult {
  cid: string;
  size?: number;
  timestamp?: string;
}

async function sendToPinata(formData: FormData): Promise<PinataUploadResult> {
  try {
    const response = await axios.post<PinataResponse>(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${env.pinataJwt}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: env.pinataTimeoutMs,
      },
    );

    if (!response.data?.IpfsHash) {
      throw new HttpError(502, "Pinata did not return an IPFS CID.");
    }

    return {
      cid: response.data.IpfsHash,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      console.error("Pinata upload failed:", status || error.code);

      throw new HttpError(
        502,
        status
          ? `Pinata upload failed with status ${status}. Check JWT permissions and account limits.`
          : "Could not connect to Pinata. Check network and timeout settings.",
      );
    }

    throw error;
  }
}

/**
 * Upload AI model files, ZIP archives and images.
 */
export async function uploadFileToPinata(
  filePath: string,
  originalName: string,
  mimeType: string,
): Promise<PinataUploadResult> {
  const formData = new FormData();

  formData.append("file", createReadStream(filePath), {
    filename: originalName,
    contentType: mimeType || "application/octet-stream",
  });

  return sendToPinata(formData);
}

/**
 * Upload NFT metadata JSON.
 */
export async function uploadMetadataToPinata(
  metadata: IpfsMetadata,
): Promise<PinataUploadResult> {
  const formData = new FormData();

  const jsonBuffer = Buffer.from(JSON.stringify(metadata), "utf-8");

  formData.append("file", jsonBuffer, {
    filename: "metadata.json",
    contentType: "application/json",
  });

  return sendToPinata(formData);
}
