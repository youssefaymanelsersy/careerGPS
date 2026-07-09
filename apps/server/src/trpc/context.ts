import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { auth } from "@/shared/auth/auth";
import { fromNodeHeaders } from "better-auth/node";

export async function createContext(opts: CreateExpressContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(opts.req.headers),
  });
  return {
    session: {
      user: {
        // IMPORTANT: If your database strict-checks foreign keys, 
        // copy-paste a real UUID from your PostgreSQL "user" table here!
        id: "123e4567-e89b-12d3-a456-426614174000", 
        name: "Basmala (Dev Mode)",
        email: "dev@careergps.com"
      }
    }
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
