import { app } from './app.js';
import { env } from './config/env.js';
app.listen(env.port, () => console.info(`WayFinder API listening on :${env.port}`));
