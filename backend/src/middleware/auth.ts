import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// Verifies the bearer access token and attaches req.user. Every route under
// /api except auth's public endpoints is mounted behind this — see
// backend/src/app.ts and docs/02-architecture/API_DESIGN.md#authentication.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new ApiError("UNAUTHORIZED", "Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    throw new ApiError("UNAUTHORIZED", "Invalid or expired access token");
  }
}
