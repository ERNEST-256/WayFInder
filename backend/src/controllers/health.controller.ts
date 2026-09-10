import type { RequestHandler } from 'express';
export const healthController: RequestHandler = (_req, res) => res.json({ status: 'ok', service: 'wayfinder-api' });
