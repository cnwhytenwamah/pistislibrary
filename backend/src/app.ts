import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import healthRoutes from "./modules/health/health.routes";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health checks are not rate limited (load balancers and uptime monitors poll them)
app.use("/api/v1/health", healthRoutes);

app.use("/api/v1", generalLimiter, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
