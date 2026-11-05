import type { Request, Response, NextFunction } from "express";

import { open, unlink } from "node:fs/promises";
import { extname } from "node:path";

import { HttpError } from "../utils/http-error.js";

function isValidSignature(extension: string, header: Buffer): boolean {
  switch (extension) {
    case ".zip":
      return (
        header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) ||
        header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x05, 0x06])) ||
        header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x07, 0x08]))
      );

    case ".png":
      return header
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    case ".jpg":
    case ".jpeg":
      return (
        header.length >= 3 &&
        header[0] === 0xff &&
        header[1] === 0xd8 &&
        header[2] === 0xff
      );

    case ".webp":
      return (
        header.length >= 12 &&
        header.toString("ascii", 0, 4) === "RIFF" &&
        header.toString("ascii", 8, 12) === "WEBP"
      );

    default:
      return false;
  }
}

async function removeTemporaryFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Temporary file cleanup failed:", error);
  }
}

export async function validateFileSignature(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const file = req.file;

  if (!file) {
    next();
    return;
  }

  try {
    const fileHandle = await open(file.path, "r");

    let header: Buffer;

    try {
      const buffer = Buffer.alloc(12);

      const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, 0);

      header = buffer.subarray(0, bytesRead);
    } finally {
      await fileHandle.close();
    }

    const extension = extname(file.originalname).toLowerCase();

    if (!isValidSignature(extension, header)) {
      await removeTemporaryFile(file.path);

      next(
        new HttpError(
          415,
          "File content does not match its declared file type.",
        ),
      );

      return;
    }

    next();
  } catch (error) {
    await removeTemporaryFile(file.path);
    next(error);
  }
}
