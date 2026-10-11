import { isAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseId } from "../../utils/parseId";
import { categoryService } from "./category.service";

export const categoryController = {
  // Visitors see categories with published books; administrators see every category
  list: asyncHandler(async (req, res) => {
    res.json(await categoryService.list({ onlyWithBooks: !isAdmin(req) }));
  }),
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ category: await categoryService.create(req.body) });
  }),
  update: asyncHandler(async (req, res) => {
    res.json({ category: await categoryService.update(parseId(req.params.id), req.body) });
  }),
  remove: asyncHandler(async (req, res) => {
    await categoryService.remove(parseId(req.params.id));
    res.status(204).end();
  }),
};
