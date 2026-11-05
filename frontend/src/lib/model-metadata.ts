import type { ModelMetadata } from "../types/api.js";

export interface ModelMetadataInput {
  name: string;
  description: string;
  imageUri: string;
  imageMimeType: string;
  task: string;
  framework: string;
  version: string;
  creatorWallet: string;
  licenseRef: string;
  modelFile: { cid: string; uri: string; mimeType: string };
}

export function buildModelMetadata(input: ModelMetadataInput): ModelMetadata {
  const name = input.name.trim();
  const description = input.description.trim();
  const task = input.task.trim();
  const framework = input.framework.trim();
  const version = input.version.trim();
  const licenseRef = input.licenseRef.trim();

  return {
    name,
    ...(description ? { description } : {}),
    image: input.imageUri,
    task,
    framework,
    version,
    creatorWallet: input.creatorWallet,
    licenseRef,
    modelFile: input.modelFile,
    attributes: [
      { trait_type: "Task", value: task },
      { trait_type: "Framework", value: framework },
      { trait_type: "Version", value: version },
    ],
    properties: {
      category: "model",
      files: [
        { uri: input.modelFile.uri, type: input.modelFile.mimeType },
        { uri: input.imageUri, type: input.imageMimeType },
      ],
    },
  };
}
