import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import authorRoutes from "./modules/authors/author.routes";
import bookRoutes from "./modules/books/book.routes";
import categoryRoutes from "./modules/categories/category.routes";
import uploadRoutes from "./modules/uploads/upload.routes";

// Note: /health is mounted in app.ts, before the rate limiter.
// Administrator-only operations live on the same resource paths and are guarded
// per route with `adminOnly` (authenticate + requireRole("ADMIN")).
const router = Router();

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/authors", authorRoutes);
router.use("/categories", categoryRoutes);
router.use("/uploads", uploadRoutes);

export default router;
