import multer from "multer";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const allowedMimeTypes: Record<string, string[]> = {
  ".zip": [
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
  ],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, tmpdir());
  },

  filename: (_req, _file, callback) => {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: env.maxFileSizeBytes,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();

    const acceptedMimeTypes = allowedMimeTypes[extension];

    if (
      !acceptedMimeTypes ||
      !acceptedMimeTypes.includes(file.mimetype.toLowerCase())
    ) {
      callback(
        new HttpError(
          415,
          "Unsupported file type. Upload a ZIP model package or PNG, JPEG, or WEBP image.",
        ),
      );

      return;
    }

    callback(null, true);
  },
});

export default upload;
