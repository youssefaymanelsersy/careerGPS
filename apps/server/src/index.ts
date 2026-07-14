import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/routers";
import { auth } from "./shared/auth/auth";
import { env } from "@careergps/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import cvRoute from "./modules/cv/routes/restful_route";
import userRoute from "./modules/user/routes/restful_route";
import multer from "multer";
import type { Request, Response, NextFunction } from "express";


import "@/modules/notifications/workers/reminder.worker";
import "@/modules/notifications/workers/missed_session.worker";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(
  "/trpc",
  express.json({ limit: "15mb" }),
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use(express.json());

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use("/cv", cvRoute);
app.use("/user", userRoute);
app.use(
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    next();
  }
);


app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
