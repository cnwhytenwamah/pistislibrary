import { z } from "zod";
import { AppError } from "./AppError";

const uuid = z.string().uuid();

export const isUuid = (value: unknown): value is string => uuid.safeParse(value).success;

/** Rejects malformed ids with a 404 instead of letting Postgres throw a 500. */
export function parseId(value: unknown): string {
  const parsed = uuid.safeParse(value);
  if (!parsed.success) throw new AppError(404, "Not found");
  return parsed.data;
}

const IDENTIFIER_RE = /^[a-zA-Z0-9-]{1,320}$/;

/** A book/author reference in a URL: either a UUID or a slug. */
export function parseIdOrSlug(value: unknown): string {
  if (typeof value !== "string" || !IDENTIFIER_RE.test(value)) throw new AppError(404, "Not found");
  return value;
}
