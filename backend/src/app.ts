import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { requestLogger } from './middleware/request-logger.js';
import { apiRouter } from './routes/index.js';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);
