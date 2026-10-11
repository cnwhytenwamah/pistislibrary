import { env } from "../../config/env";
import { sequelize } from "../../config/database";
import { Author, Book, BookCategory, BookFile, Category, Download } from "../../database/models";
import type { BookStatus } from "../../database/models/Book";
import type { FileFormat } from "../../database/models/BookFile";
import { cacheService } from "../../services/cache.service";
import { storageService } from "../../services/storage.service";
import { verifyUpload } from "../../services/uploadVerification";
import { AppError } from "../../utils/AppError";
import { paginationMeta, toOffset } from "../../utils/pagination";
import { uniqueSlug } from "../../utils/slug";
import { bookRepository } from "./book.repository";
import { serializeBook } from "./book.serializer";
import type {
  CreateBookInput, ListBooksQuery, UpdateBookInput, UpdateFileInput,
} from "./book.schema";

const EXT: Record<FileFormat, string> = { PDF: "pdf", EPUB: "epub" };
const CONTENT_TYPE: Record<FileFormat, string> = {
  PDF: "application/pdf",
  EPUB: "application/epub+zip",
};

const BOOK_CACHE_TTL_SECONDS = 120;

type Viewer = { isAdmin: boolean };

// ---------- helpers ----------

async function assertAuthorAndCategories(authorId: string | undefined, categoryIds?: string[]) {
  if (authorId && !(await Author.findByPk(authorId))) throw new AppError(400, "Author not found");
  if (categoryIds) {
    const found = await Category.count({ where: { id: categoryIds } });
    if (found !== categoryIds.length) throw new AppError(400, "One or more categories were not found");
  }
}

function assertKeyMatchesFormat(format: FileFormat, key: string) {
  if (!key.endsWith(`.${EXT[format]}`)) {
    throw new AppError(400, `File key does not match format ${format}`);
  }
}

async function loadOrFail(id: string) {
  const book = await bookRepository.findByIdFull(id);
  if (!book) throw new AppError(404, "Book not found");
  return book;
}

function parseFormat(value: string): FileFormat {
  const f = value.toUpperCase();
  if (f !== "PDF" && f !== "EPUB") throw new AppError(400, "Unsupported format");
  return f;
}

/** Drops cached pages for this book and the category counts that depend on published books. */
const invalidate = (book: { id: string; slug: string }) =>
  cacheService.del(`book:${book.id}`, `book:${book.slug}`, "categories:all");

async function getPublishedFile(idOrSlug: string, formatParam: string) {
  const format = parseFormat(formatParam);
  const book = await bookRepository.findByIdOrSlug(idOrSlug, ["PUBLISHED"]);
  if (!book) throw new AppError(404, "Book not found");
  const file = book.files?.find((f) => f.format === format);
  if (!file) throw new AppError(404, "This format is not available for this book");
  return { book, file, format };
}

async function setStatus(id: string, status: BookStatus) {
  const book = await loadOrFail(id);
  if (status === "PUBLISHED" && (book.files?.length ?? 0) === 0) {
    throw new AppError(400, "Attach at least one file (PDF or EPUB) before publishing");
  }
  await book.update({
    status,
    ...(status === "PUBLISHED" ? { publishedAt: book.publishedAt ?? new Date() } : {}),
  });
  await invalidate(book);
  return serializeBook(await loadOrFail(id), "admin");
}

// ---------- service ----------

export const bookService = {
  // ----- reading the library -----

  /** Visitors see published books only; administrators may filter by status. */
  async list(query: ListBooksQuery, viewer: Viewer) {
    let statuses: BookStatus[] = ["PUBLISHED"];
    if (query.status && query.status !== "PUBLISHED") {
      if (!viewer.isAdmin) throw new AppError(403, "Only administrators can list unpublished books");
      statuses = query.status === "ALL" ? ["DRAFT", "PUBLISHED", "ARCHIVED"] : [query.status];
    }

    const { ids, total } = await bookRepository.searchIds({
      q: query.q || undefined,
      category: query.category || undefined,
      author: query.author || undefined,
      language: query.language || undefined,
      year: query.year,
      format: query.format,
      sort: query.sort,
      statuses,
      limit: query.limit,
      offset: toOffset(query.page, query.limit),
    });
    const books = await bookRepository.findByIdsOrdered(ids);
    const level = viewer.isAdmin ? "admin" : "summary";
    return {
      data: await Promise.all(books.map((b) => serializeBook(b, level))),
      meta: paginationMeta(query.page, query.limit, total),
    };
  },

  /** By UUID or slug. Administrators can open drafts and archived books; visitors only published ones. */
  async get(idOrSlug: string, viewer: Viewer) {
    if (viewer.isAdmin) {
      const book = await bookRepository.findByIdOrSlug(idOrSlug);
      if (!book) throw new AppError(404, "Book not found");
      return serializeBook(book, "admin");
    }
    return cacheService.wrap(`book:${idOrSlug}`, BOOK_CACHE_TTL_SECONDS, async () => {
      const book = await bookRepository.findByIdOrSlug(idOrSlug, ["PUBLISHED"]);
      if (!book) throw new AppError(404, "Book not found");
      return serializeBook(book, "detail");
    });
  },

  // ----- read / download -----

  /** Signed inline URL for the in-browser reader. */
  async readUrl(idOrSlug: string, formatParam: string) {
    const { book, file, format } = await getPublishedFile(idOrSlug, formatParam);
    if (!file.isReadable) throw new AppError(403, "Online reading is disabled for this file");

    await bookRepository.incrementReads(book.id);
    const url = await storageService.presignDownload({
      key: file.storageKey,
      filename: file.fileName,
      disposition: "inline",
      contentType: file.mimeType,
    });
    return { url, format, expiresIn: env.SIGNED_URL_TTL_SECONDS };
  },

  /** Logs the download and returns a signed attachment URL. */
  async download(idOrSlug: string, formatParam: string, userId: string) {
    const { book, file, format } = await getPublishedFile(idOrSlug, formatParam);
    if (!file.isDownloadable) throw new AppError(403, "Downloads are disabled for this file");

    await Download.create({ userId, bookId: book.id, bookFileId: file.id, format });
    await bookRepository.incrementDownloads(book.id);
    const url = await storageService.presignDownload({
      key: file.storageKey,
      filename: file.fileName,
      disposition: "attachment",
      contentType: file.mimeType,
    });
    return { url, format, expiresIn: env.SIGNED_URL_TTL_SECONDS };
  },

  // ----- administration -----

  async create(input: CreateBookInput) {
    const { files = [], categoryIds: rawCategoryIds, ...fields } = input;
    const categoryIds = [...new Set(rawCategoryIds)];
    await assertAuthorAndCategories(input.authorId, categoryIds);

    for (const f of files) assertKeyMatchesFormat(f.format, f.storageKey);
    const heads = await Promise.all(files.map((f) => verifyUpload(f.storageKey, "book")));
    if (fields.coverKey) await verifyUpload(fields.coverKey, "cover");

    const slug = await uniqueSlug(fields.title, bookRepository.slugExists);

    const created = await sequelize.transaction(async (transaction) => {
      const book = await Book.create({ ...fields, slug }, { transaction });
      await BookCategory.bulkCreate(
        categoryIds.map((categoryId) => ({ bookId: book.id, categoryId })),
        { transaction }
      );
      if (files.length) {
        await BookFile.bulkCreate(
          files.map((f, i) => ({
            bookId: book.id,
            format: f.format,
            fileName: f.fileName ?? `${slug}.${EXT[f.format]}`,
            storageKey: f.storageKey,
            sizeBytes: heads[i].size,
            mimeType: CONTENT_TYPE[f.format],
            isReadable: f.isReadable ?? true,
            isDownloadable: f.isDownloadable ?? true,
            etag: heads[i].etag,
          })),
          { transaction }
        );
      }
      return book;
    });

    await cacheService.del("categories:all");
    return serializeBook(await loadOrFail(created.id), "admin");
  },

  async update(id: string, input: UpdateBookInput) {
    const book = await loadOrFail(id);
    const { categoryIds: rawCategoryIds, ...fields } = input;
    const categoryIds = rawCategoryIds ? [...new Set(rawCategoryIds)] : undefined;
    await assertAuthorAndCategories(fields.authorId, categoryIds);

    let oldCover: string | null = null;
    if (fields.coverKey !== undefined && fields.coverKey !== book.coverKey) {
      if (fields.coverKey) await verifyUpload(fields.coverKey, "cover");
      oldCover = book.coverKey;
    }

    await sequelize.transaction(async (transaction) => {
      await book.update(fields, { transaction });
      if (categoryIds) {
        await BookCategory.destroy({ where: { bookId: id }, transaction });
        await BookCategory.bulkCreate(
          categoryIds.map((categoryId) => ({ bookId: id, categoryId })),
          { transaction }
        );
      }
    });
    if (oldCover) await storageService.remove(oldCover);

    await invalidate(book);
    return serializeBook(await loadOrFail(id), "admin");
  },

  /** Adds a file for a format, or replaces the existing one. */
  async putFile(
    id: string,
    input: {
      format: FileFormat;
      storageKey: string;
      fileName?: string;
      isReadable?: boolean;
      isDownloadable?: boolean;
    }
  ) {
    const book = await loadOrFail(id);
    assertKeyMatchesFormat(input.format, input.storageKey);
    const head = await verifyUpload(input.storageKey, "book");

    const existing = book.files?.find((f) => f.format === input.format);
    if (existing) {
      const oldKey = existing.storageKey;
      await existing.update({
        storageKey: input.storageKey,
        sizeBytes: head.size,
        etag: head.etag,
        mimeType: CONTENT_TYPE[input.format],
        ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
        ...(input.isReadable !== undefined ? { isReadable: input.isReadable } : {}),
        ...(input.isDownloadable !== undefined ? { isDownloadable: input.isDownloadable } : {}),
      });
      if (oldKey !== input.storageKey) await storageService.remove(oldKey);
    } else {
      await BookFile.create({
        bookId: book.id,
        format: input.format,
        fileName: input.fileName ?? `${book.slug}.${EXT[input.format]}`,
        storageKey: input.storageKey,
        sizeBytes: head.size,
        mimeType: CONTENT_TYPE[input.format],
        isReadable: input.isReadable ?? true,
        isDownloadable: input.isDownloadable ?? true,
        etag: head.etag,
      });
    }
    await invalidate(book);
    return serializeBook(await loadOrFail(id), "admin");
  },

  /** Renames a file or changes whether it can be read / downloaded. */
  async updateFile(id: string, formatParam: string, input: UpdateFileInput) {
    const format = parseFormat(formatParam);
    const book = await loadOrFail(id);
    const file = book.files?.find((f) => f.format === format);
    if (!file) throw new AppError(404, "File not found");
    await file.update(input);
    await invalidate(book);
    return serializeBook(await loadOrFail(id), "admin");
  },

  async removeFile(id: string, formatParam: string) {
    const format = parseFormat(formatParam);
    const book = await loadOrFail(id);
    const file = book.files?.find((f) => f.format === format);
    if (!file) throw new AppError(404, "File not found");
    if (book.status === "PUBLISHED" && (book.files?.length ?? 0) <= 1) {
      throw new AppError(409, "Unpublish the book before removing its last file");
    }
    const key = file.storageKey;
    await file.destroy();
    await storageService.remove(key);
    await invalidate(book);
    return serializeBook(await loadOrFail(id), "admin");
  },

  publish: (id: string) => setStatus(id, "PUBLISHED"),
  unpublish: (id: string) => setStatus(id, "DRAFT"),
  archive: (id: string) => setStatus(id, "ARCHIVED"),

  async remove(id: string) {
    const book = await loadOrFail(id);
    const keys = [...(book.files ?? []).map((f) => f.storageKey), book.coverKey];
    await book.destroy(); // book_files, book_categories and downloads cascade
    await Promise.all(keys.map((k) => storageService.remove(k)));
    await invalidate(book);
  },
};
