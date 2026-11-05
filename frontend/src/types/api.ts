export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    cid: string;
    ipfsUri: string;
    gatewayUrl: string;
    size?: number;
    timestamp?: string;
  };
}

export interface ModelMetadata {
  name: string;
  description?: string;
  image: string;
  task: string;
  framework: string;
  version: string;
  creatorWallet: string;
  licenseRef: string;
  modelFile: { cid: string; uri: string; mimeType: string };
  attributes: Array<{ trait_type: string; value: string }>;
  properties: {
    category: "model";
    files: Array<{ uri: string; type: string }>;
  };
}
