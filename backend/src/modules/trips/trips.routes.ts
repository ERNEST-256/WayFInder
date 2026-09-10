import { Router } from 'express';
import { createTrip, listTrips } from '../../services/trip.service.js';

export const tripRouter = Router();
tripRouter.get('/', (_req, res) => res.json(listTrips()));
tripRouter.post('/', (req, res) => {
  const { destination, startDate, endDate } = req.body ?? {};
  if (![destination, startDate, endDate].every((value) => typeof value === 'string')) return res.status(400).json({ error: 'destination, startDate and endDate are required' });
  return res.status(201).json(createTrip({ destination, startDate, endDate }));
});
