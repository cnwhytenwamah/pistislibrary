import crypto from "crypto";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../database/models/User";

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");

export const signAccessToken = (user: { id: string; role: Role }) =>
  jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & { role: Role };
