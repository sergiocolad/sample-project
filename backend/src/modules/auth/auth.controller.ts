import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import * as authService from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

const REFRESH_COOKIE = "refreshToken";

// httpOnly + Secure + SameSite=Strict per docs/04-engineering/SECURITY.md#token-storage.
// `secure: false` only in non-production so local HTTP dev keeps working.
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

export async function registerHandler(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.register(input);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.login(input);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ user, accessToken });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError("UNAUTHORIZED", "No refresh token provided");
  }

  const { accessToken, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken });
}

export async function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json(user);
}
