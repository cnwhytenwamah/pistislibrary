import { Router } from "express";
import { adminOnly, optionalAuthenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { categoryController } from "./category.controller";
import { createCategorySchema, updateCategorySchema } from "./category.schema";

const router = Router();

// Public
router.get("/", optionalAuthenticate, categoryController.list);

// Administrators only
router.post("/", ...adminOnly, validate(createCategorySchema), categoryController.create);
router.patch("/:id", ...adminOnly, validate(updateCategorySchema), categoryController.update);
router.delete("/:id", ...adminOnly, categoryController.remove);

export default router;
