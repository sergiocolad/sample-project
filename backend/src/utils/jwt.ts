import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string; // user id
}

// @types/jsonwebtoken types `expiresIn` as a template-literal union (e.g.
// "15m"), stricter than the plain `string` our env schema validates at boot.
// The cast is safe: env.ts already guarantees a non-empty string here, and
// jwt.sign throws at runtime on a genuinely malformed value.
function asExpiresIn(value: string): SignOptions["expiresIn"] {
  return value as SignOptions["expiresIn"];
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: asExpiresIn(env.JWT_ACCESS_EXPIRES_IN),
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: asExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
}
