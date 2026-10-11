import { Request, Response } from "express";
import { isAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseId, parseIdOrSlug } from "../../utils/parseId";
import { authorService } from "./author.service";
import type { ListAuthorsQuery } from "./author.schema";

export const authorController = {
  // Visitors see authors with published books; administrators see every author
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(
      await authorService.list(res.locals.query as ListAuthorsQuery, { onlyWithBooks: !isAdmin(req) })
    );
  }),
  get: asyncHandler(async (req, res) => {
    res.json({ author: await authorService.get(parseIdOrSlug(req.params.idOrSlug)) });
  }),
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ author: await authorService.create(req.body) });
  }),
  update: asyncHandler(async (req, res) => {
    res.json({ author: await authorService.update(parseId(req.params.id), req.body) });
  }),
  remove: asyncHandler(async (req, res) => {
    await authorService.remove(parseId(req.params.id));
    res.status(204).end();
  }),
};
