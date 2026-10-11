import { Router } from "express";
import { adminOnly, authenticate, optionalAuthenticate } from "../../middleware/auth";
import { downloadLimiter, searchLimiter } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { bookController } from "./book.controller";
import {
  createBookSchema, listBooksQuery, putFileSchema, updateBookSchema, updateFileSchema,
} from "./book.schema";

const router = Router();

// ----- Public library (administrators additionally see drafts and archived books) -----
router.get(
  "/",
  searchLimiter,
  optionalAuthenticate,
  validate(listBooksQuery, "query"),
  bookController.list
);
router.get("/:idOrSlug", optionalAuthenticate, bookController.get);

// ----- Signed access to files (login required) -----
router.get("/:idOrSlug/files/:format/read-url", authenticate, bookController.readUrl);
router.post(
  "/:idOrSlug/files/:format/download",
  authenticate,
  downloadLimiter,
  bookController.download
);

// ----- Administrators only -----
router.post("/", ...adminOnly, validate(createBookSchema), bookController.create);
router.patch("/:id", ...adminOnly, validate(updateBookSchema), bookController.update);
router.delete("/:id", ...adminOnly, bookController.remove);

router.post("/:id/publish", ...adminOnly, bookController.publish);
router.post("/:id/unpublish", ...adminOnly, bookController.unpublish);
router.post("/:id/archive", ...adminOnly, bookController.archive);

router.put("/:id/files", ...adminOnly, validate(putFileSchema), bookController.putFile);
router.patch(
  "/:id/files/:format",
  ...adminOnly,
  validate(updateFileSchema),
  bookController.updateFile
);
router.delete("/:id/files/:format", ...adminOnly, bookController.removeFile);

export default router;
