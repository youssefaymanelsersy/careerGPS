import { env } from "@careergps/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },   // required for Supabase's pooler
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    keepAlive: true,                // prevent Supabase from killing idle connections
    keepAliveInitialDelayMillis: 10000,
});

// Without this, an idle-connection reset from Supabase's pooler (ECONNRESET)
// emits an unhandled 'error' event on the pool and crashes the whole process.
pool.on("error", (err) => {
    console.error("Unexpected error on idle pg client", err);
});

// Initialize drizzle
export const db = drizzle(pool, {
    schema,
});