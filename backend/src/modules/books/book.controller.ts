import { Request, Response } from "express";
import { isAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseId, parseIdOrSlug } from "../../utils/parseId";
import { bookService } from "./book.service";
import type { ListBooksQuery } from "./book.schema";

const viewer = (req: Request) => ({ isAdmin: isAdmin(req) });
const param = (v: unknown) => String(v);

export const bookController = {
  // ----- public / user -----
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookService.list(res.locals.query as ListBooksQuery, viewer(req)));
  }),
  get: asyncHandler(async (req, res) => {
    res.json({ book: await bookService.get(parseIdOrSlug(req.params.idOrSlug), viewer(req)) });
  }),
  readUrl: asyncHandler(async (req, res) => {
    res.json(
      await bookService.readUrl(parseIdOrSlug(req.params.idOrSlug), param(req.params.format))
    );
  }),
  download: asyncHandler(async (req, res) => {
    res.json(
      await bookService.download(
        parseIdOrSlug(req.params.idOrSlug),
        param(req.params.format),
        req.user!.id
      )
    );
  }),

  // ----- administrators -----
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ book: await bookService.create(req.body) });
  }),
  update: asyncHandler(async (req, res) => {
    res.json({ book: await bookService.update(parseId(req.params.id), req.body) });
  }),
  remove: asyncHandler(async (req, res) => {
    await bookService.remove(parseId(req.params.id));
    res.status(204).end();
  }),
  putFile: asyncHandler(async (req, res) => {
    res.json({ book: await bookService.putFile(parseId(req.params.id), req.body) });
  }),
  updateFile: asyncHandler(async (req, res) => {
    res.json({
      book: await bookService.updateFile(parseId(req.params.id), param(req.params.format), req.body),
    });
  }),
  removeFile: asyncHandler(async (req, res) => {
    res.json({
      book: await bookService.removeFile(parseId(req.params.id), param(req.params.format)),
    });
  }),
  publish: asyncHandler(async (req, res) => {
    res.json({ book: await bookService.publish(parseId(req.params.id)) });
  }),
  unpublish: asyncHandler(async (req, res) => {
    res.json({ book: await bookService.unpublish(parseId(req.params.id)) });
  }),
  archive: asyncHandler(async (req, res) => {
    res.json({ book: await bookService.archive(parseId(req.params.id)) });
  }),
};
