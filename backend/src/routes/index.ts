import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { tripRouter } from '../modules/trips/trips.routes.js';

export const apiRouter = Router();
apiRouter.get('/health', healthController);
apiRouter.use('/trips', tripRouter);
