import type { RequestHandler } from 'express';
export const requestLogger: RequestHandler = (req, _res, next) => { console.info(`${req.method} ${req.path}`); next(); };
