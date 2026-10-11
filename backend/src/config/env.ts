import "dotenv/config";
import { z } from "zod";

// Treat empty strings (e.g. `S3_PUBLIC_URL=`) as "not set"
const optionalUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().url().optional()
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  CLIENT_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  GOOGLE_CLIENT_IDS: z.string().min(1),

  S3_ENDPOINT: optionalUrl,
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  S3_PUBLIC_URL: optionalUrl,

  MAX_BOOK_FILE_MB: z.coerce.number().default(100),
  MAX_COVER_MB: z.coerce.number().default(5),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(900),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  GOOGLE_CLIENT_IDS: parsed.data.GOOGLE_CLIENT_IDS.split(",").map((s) => s.trim()),
};
