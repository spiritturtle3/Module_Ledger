import type { ErrorRequestHandler } from 'express';

import { MulterError } from 'multer';

import { HttpError } from '../utils/http-error.js';

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof MulterError) {
    const statusCode =
      error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

    res.status(statusCode).json({
      success: false,
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Uploaded file exceeds the maximum allowed size.'
          : error.message,
    });

    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON request body.',
    });

    return;
  }

  console.error('Internal backend error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
};
