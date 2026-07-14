import { env } from "@careergps/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    keepAlive: true,                // prevent Supabase from killing idle connections
    keepAliveInitialDelayMillis: 10000,
});

// Initialize drizzle
export const db = drizzle(pool, {
    schema,
});