import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(255);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  // bcrypt only uses the first 72 bytes, so cap there
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export const googleSchema = z.object({ idToken: z.string().min(20) });

export const refreshSchema = z.object({ refreshToken: z.string().optional() });
