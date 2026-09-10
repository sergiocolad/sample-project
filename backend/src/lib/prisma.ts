import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

// A single shared client, reused across the process — Prisma's docs and the
// serverless-vs-long-running-server tradeoff don't apply here (this runs as
// a long-lived Node process; see docs/05-operations/DEPLOYMENT.md).
export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
