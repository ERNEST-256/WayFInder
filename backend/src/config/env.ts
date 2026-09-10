import 'dotenv/config';

const required = ['JWT_SECRET'] as const;
for (const key of required) if (!process.env[key] && process.env.NODE_ENV === 'production') throw new Error(`Missing ${key}`);

export const env = { port: Number(process.env.PORT ?? 4000), nodeEnv: process.env.NODE_ENV ?? 'development' };
