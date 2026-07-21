import "server-only";
import { z } from "zod";

const envSchema = z.object({
  KLARIMBA_API_URL: z
    .string()
    .url()
    .default("http://localhost:8080/api/v1"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse({
  KLARIMBA_API_URL: process.env.KLARIMBA_API_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});
