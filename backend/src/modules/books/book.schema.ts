import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { BOOK_KEY_RE, COVER_KEY_RE } from "../../utils/storageKeys";

export const formatEnum = z.enum(["PDF", "EPUB"]);

const fileName = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[^\\/\0]+$/, "File name cannot contain slashes");

const fileRef = z.object({
  format: formatEnum,
  storageKey: z.string().regex(BOOK_KEY_RE, "Invalid book file key"),
  fileName: fileName.optional(),
  isReadable: z.boolean().optional(),
  isDownloadable: z.boolean().optional(),
});

// NOTE: no .default() here on purpose, so `.partial()` for PATCH never
// resets fields. Defaults come from the Sequelize model.
const bookFields = {
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().trim().max(300).nullish(),
  description: z.string().trim().min(1).max(10000),
  authorId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).min(1).max(10),
  language: z.string().trim().min(2).max(10),
  publicationYear: z.number().int().min(1).max(new Date().getFullYear() + 1).nullish(),
  isbn: z.string().trim().max(20).nullish(),
  publisher: z.string().trim().max(200).nullish(),
  pageCount: z.number().int().min(1).max(20000).nullish(),
  keywords: z.array(z.string().trim().min(1).max(50)).max(20),
  coverKey: z.string().regex(COVER_KEY_RE, "Invalid cover key").nullish(),
  rightsNote: z.string().trim().max(1000).nullish(),
};

export const createBookSchema = z
  .object({
    ...bookFields,
    language: bookFields.language.optional(),
    keywords: bookFields.keywords.optional(),
    files: z.array(fileRef).max(2).optional(),
  })
  .refine(
    (b) => new Set((b.files ?? []).map((f) => f.format)).size === (b.files ?? []).length,
    { message: "Each format can only be attached once", path: ["files"] }
  );

export const updateBookSchema = z.object(bookFields).partial();

/** Add a file for a format, or replace the existing one. */
export const putFileSchema = fileRef;

/** Change a file's name or availability without re-uploading it. */
export const updateFileSchema = z
  .object({
    fileName: fileName.optional(),
    isReadable: z.boolean().optional(),
    isDownloadable: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field" });

const sortEnum = z.enum(["relevance", "newest", "oldest", "downloads", "popular", "title"]);

export const listBooksQuery = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(120).optional(), // category slug
  author: z.string().trim().max(120).optional(), // author slug
  language: z.string().trim().max(10).optional(),
  year: z.coerce.number().int().optional(),
  format: formatEnum.optional(),
  sort: sortEnum.optional(),
  // Administrators only: list drafts / archived books too ("ALL" = every status)
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type ListBooksQuery = z.infer<typeof listBooksQuery>;
