import { Pool } from "pg";
import { env } from "./env";

export const db = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
})
