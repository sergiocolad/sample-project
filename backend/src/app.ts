import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
// Patches Express to forward rejected promises from async route handlers to
// the error-handling middleware — without this, a throw inside an `async`
// controller would hang the request instead of reaching errorHandler.ts.
import "express-async-errors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import booksRoutes from "./modules/books/books.routes.js";
import shelfRoutes from "./modules/shelf/shelf.routes.js";
import statsRoutes from "./modules/stats/stats.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/books", booksRoutes);
  app.use("/api/shelf", shelfRoutes);
  app.use("/api/stats", statsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
