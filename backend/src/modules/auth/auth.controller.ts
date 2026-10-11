import { Request, Response } from "express";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService, Session } from "./auth.service";

const isMobile = (req: Request) => req.header("x-client") === "mobile";
const ua = (req: Request) => req.header("user-agent");

const cookieBase = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function setAuthCookies(res: Response, s: Session) {
  res.cookie("access_token", s.accessToken, {
    ...cookieBase, path: "/", maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", s.refreshToken, {
    ...cookieBase, path: "/api/v1/auth", maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { ...cookieBase, path: "/" });
  res.clearCookie("refresh_token", { ...cookieBase, path: "/api/v1/auth" });
}

// Web gets cookies; mobile (x-client: mobile) gets tokens in the body
function respond(req: Request, res: Response, s: Session, status = 200, extra = {}) {
  if (isMobile(req)) {
    return res.status(status).json({
      user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, ...extra,
    });
  }
  setAuthCookies(res, s);
  return res.status(status).json({ user: s.user, ...extra });
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const session = await authService.register(req.body, ua(req));
    respond(req, res, session, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const session = await authService.login(req.body, ua(req));
    respond(req, res, session);
  }),

  google: asyncHandler(async (req, res) => {
    const { isNewUser, ...session } = await authService.google(req.body.idToken, ua(req));
    respond(req, res, session, isNewUser ? 201 : 200, { isNewUser });
  }),

  refresh: asyncHandler(async (req, res) => {
    const raw = isMobile(req) ? req.body.refreshToken : req.cookies?.refresh_token;
    const session = await authService.refresh(raw, ua(req));
    respond(req, res, session);
  }),

  logout: asyncHandler(async (req, res) => {
    const raw = isMobile(req) ? req.body.refreshToken : req.cookies?.refresh_token;
    await authService.logout(raw);
    clearAuthCookies(res);
    res.status(204).end();
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ user: await authService.me(req.user!.id) });
  }),
};
