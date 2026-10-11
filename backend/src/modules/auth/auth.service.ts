import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";
import { User } from "../../database/models";
import { AppError } from "../../utils/AppError";
import { generateRefreshToken, hashToken, signAccessToken } from "../../utils/tokens";
import { userRepository } from "../users/user.repository";
import { refreshTokenRepository } from "./refreshToken.repository";

const googleClient = new OAuth2Client();
const DAY_MS = 86_400_000;

export type Session = {
  user: ReturnType<User["toSafeJSON"]>;
  accessToken: string;
  refreshToken: string;
};

async function createSession(user: User, userAgent?: string): Promise<Session> {
  if (!user.isActive) throw new AppError(403, "This account has been disabled");

  const refreshToken = generateRefreshToken();
  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    userAgent: userAgent?.slice(0, 255) ?? null,
  });
  await user.update({ lastLoginAt: new Date() });

  return { user: user.toSafeJSON(), accessToken: signAccessToken(user), refreshToken };
}

export const authService = {
  async register(input: { name: string; email: string; password: string }, userAgent?: string) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(
        409,
        existing.googleId && !existing.passwordHash
          ? "This email is registered with Google. Please sign in with Google."
          : "Email is already in use"
      );
    }
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
    });
    return createSession(user, userAgent);
  },

  async login(input: { email: string; password: string }, userAgent?: string) {
    const user = await userRepository.findByEmail(input.email);
    // Same error for unknown email, Google-only account, or wrong password
    if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password");
    }
    return createSession(user, userAgent);
  },

  async google(idToken: string, userAgent?: string) {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_IDS,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError(401, "Invalid Google token");
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new AppError(401, "Google account email is not verified");
    }

    const email = payload.email.toLowerCase();
    const name = payload.name?.trim() || email.split("@")[0];
    let isNewUser = false;

    let user = await userRepository.findByGoogleId(payload.sub);

    if (!user) {
      const byEmail = await userRepository.findByEmail(email);
      if (byEmail) {
        // Link Google to the existing account
        const wasUnverified = !byEmail.emailVerifiedAt;
        await byEmail.update({
          googleId: payload.sub,
          avatarUrl: byEmail.avatarUrl ?? payload.picture ?? null,
          emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          // Pre-registration protection: drop any password set by whoever
          // created the account before the email owner proved ownership
          ...(wasUnverified ? { passwordHash: null } : {}),
        });
        if (wasUnverified) await refreshTokenRepository.revokeAllForUser(byEmail.id);
        user = byEmail;
      } else {
        user = await userRepository.create({
          name,
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture ?? null,
          emailVerifiedAt: new Date(),
        });
        isNewUser = true;
      }
    }

    const session = await createSession(user, userAgent);
    return { ...session, isNewUser };
  },

  async refresh(rawToken: string | undefined, userAgent?: string) {
    if (!rawToken) throw new AppError(401, "Refresh token required");

    const stored = await refreshTokenRepository.findByHash(hashToken(rawToken));
    if (!stored) throw new AppError(401, "Invalid refresh token");

    // A revoked token being reused means it may have been stolen: kill the whole family
    if (stored.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new AppError(401, "Refresh token reuse detected. Please sign in again.");
    }
    if (stored.expiresAt < new Date()) throw new AppError(401, "Refresh token expired");

    const user = await userRepository.findById(stored.userId);
    if (!user) throw new AppError(401, "Invalid refresh token");

    await refreshTokenRepository.revoke(stored.id); // rotate
    return createSession(user, userAgent);
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const stored = await refreshTokenRepository.findByHash(hashToken(rawToken));
    if (stored) await refreshTokenRepository.revoke(stored.id);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw new AppError(401, "Account not available");
    return user.toSafeJSON();
  },
};
