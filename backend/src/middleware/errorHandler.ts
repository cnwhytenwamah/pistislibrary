import { ErrorRequestHandler, RequestHandler } from "express";
import { UniqueConstraintError } from "sequelize";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const notFound: RequestHandler = (_req, _res, next) =>
  next(new AppError(404, "Route not found"));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ message: "Resource already exists" });
  }
  if (env.NODE_ENV !== "production") console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
