import { Router } from "express";
import { adminOnly, optionalAuthenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { authorController } from "./author.controller";
import { createAuthorSchema, updateAuthorSchema, listAuthorsQuery } from "./author.schema";

const router = Router();

// Public
router.get("/", optionalAuthenticate, validate(listAuthorsQuery, "query"), authorController.list);
router.get("/:idOrSlug", authorController.get);

// Administrators only
router.post("/", ...adminOnly, validate(createAuthorSchema), authorController.create);
router.patch("/:id", ...adminOnly, validate(updateAuthorSchema), authorController.update);
router.delete("/:id", ...adminOnly, authorController.remove);

export default router;
