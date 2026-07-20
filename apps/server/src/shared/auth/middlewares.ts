import express from "express";
import { auth } from "@/shared/auth/auth";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    (req as any).session = session;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export async function requireVerifiedAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
    if (!session.user.emailVerified) return res.status(403).json({ error: "Email verification required" });

    (req as any).session = session;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
