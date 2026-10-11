import { Request, RequestHandler } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/tokens";
import type { Role } from "../database/models/User";

function readToken(req: Request): string | undefined {
  const header = req.header("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.access_token;
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next(new AppError(401, "Authentication required"));
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub as string, role: payload.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
};

/**
 * Identifies the caller when a valid token is present but never rejects the request.
 * Used by public routes whose response differs for administrators (e.g. listing drafts).
 */
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub as string, role: payload.role };
    } catch {
      // ignore: treated as anonymous
    }
  }
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Forbidden"));
    next();
  };

/** Route guard for administrator-only endpoints. Authorization is always enforced here, never in the frontend. */
export const adminOnly: RequestHandler[] = [authenticate, requireRole("ADMIN")];

export const isAdmin = (req: Request) => req.user?.role === "ADMIN";
