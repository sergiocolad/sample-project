import "dotenv/config";
import { z } from "zod";

// Single place environment variables are read and validated. Everything
// else in the codebase imports `env` from here — never `process.env`
// directly (see docs/04-engineering/CODING_STANDARDS.md).

const isProd = process.env.NODE_ENV === "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(1)
    .refine((v) => !isProd || v !== "dev_only_access_secret_change_me", {
      message: "JWT_ACCESS_SECRET must be changed from the example placeholder in production",
    }),
  JWT_REFRESH_SECRET: z
    .string()
    .min(1)
    .refine((v) => !isProd || v !== "dev_only_refresh_secret_change_me", {
      message: "JWT_REFRESH_SECRET must be changed from the example placeholder in production",
    }),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  OPEN_LIBRARY_BASE_URL: z.string().url().default("https://openlibrary.org"),
  OPEN_LIBRARY_TIMEOUT_MS: z.coerce.number().default(5000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
