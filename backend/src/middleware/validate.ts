import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError";

/**
 * Validates req.body (default) or req.query.
 * Parsed query values are placed on `res.locals.query` (req.query is read-only in Express 5).
 */
export const validate =
  (schema: ZodTypeAny, source: "body" | "query" = "body"): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(source === "body" ? req.body : req.query);
    if (!result.success) {
      return next(new AppError(400, "Validation failed", result.error.flatten().fieldErrors));
    }
    if (source === "body") req.body = result.data;
    else res.locals.query = result.data;
    next();
  };
