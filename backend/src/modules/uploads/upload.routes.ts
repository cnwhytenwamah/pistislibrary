import { Router } from "express";
import { adminOnly } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadController } from "./upload.controller";
import { presignSchema } from "./upload.schema";

const router = Router();

// Administrators only: only admins upload books, covers and author photos
router.post("/presign", ...adminOnly, validate(presignSchema), uploadController.presign);

export default router;
