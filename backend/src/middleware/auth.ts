import type { RequestHandler } from 'express';

/** Placeholder for JWT validation. Apply to protected routes as modules are implemented. */
export const requireAuth: RequestHandler = (_req, res) => res.status(501).json({ error: 'Authentication is not configured yet' });
