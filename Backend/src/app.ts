import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import apiRoutes from './routes/index.js';
import { env } from './config/env.js';

import { notFoundHandler } from './middleware/not-found.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

import { HttpError } from './utils/http-error.js';

const app = express();

app.disable('x-powered-by');

/**
 * Security headers
 */
app.use(helmet());

/**
 * CORS configuration
 */
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        env.frontendOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new HttpError(
          403,
          'Origin is not allowed by CORS.'
        )
      );
    },

    methods: ['GET', 'POST'],

    allowedHeaders: ['Content-Type'],
  })
);

/**
 * JSON request parser
 */
app.use(
  express.json({
    limit: '2mb',
  })
);

/**
 * API routes
 */
app.use('/api', apiRoutes);

/**
 * Handle invalid routes
 */
app.use(notFoundHandler);

/**
 * Central error handler
 */
app.use(errorHandler);

export default app;
