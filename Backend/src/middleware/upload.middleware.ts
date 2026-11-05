import multer from 'multer';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

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
});

export default upload;
