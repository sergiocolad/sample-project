import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

// Framework-agnostic: no Express types in here, per
// docs/04-engineering/CODING_STANDARDS.md#backend-backend.

function toPublicUser(user: { id: string; email: string; name: string; createdAt: Date }) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError("CONFLICT", "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
  });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same error for "no such user" and "wrong password" — see SPEC-001 AC4
  // (docs/03-specs/SPEC-001-user-authentication.md) to prevent account
  // enumeration.
  const genericError = () => new ApiError("UNAUTHORIZED", "Invalid email or password");

  if (!user) throw genericError();

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw genericError();

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function refresh(refreshToken: string) {
  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw new ApiError("UNAUTHORIZED", "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("UNAUTHORIZED", "Invalid or expired refresh token");

  return {
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("UNAUTHORIZED", "User no longer exists");
  return toPublicUser(user);
}
