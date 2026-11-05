import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import { HttpError } from '../utils/http-error.js';

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(
    new HttpError(
      404,
      'The requested API endpoint does not exist.'
    )
  );
}
