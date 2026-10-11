import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema, googleSchema, refreshSchema } from "./auth.schema";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/google", authLimiter, validate(googleSchema), authController.google);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(refreshSchema), authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
