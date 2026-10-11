import type { Book } from "../../database/models";
import { storageService } from "../../services/storage.service";

export type SerializeLevel = "summary" | "detail" | "admin";

/** Public shapes never expose storage keys or etags. */
export async function serializeBook(book: Book, level: SerializeLevel = "summary") {
  const coverUrl = book.coverKey ? await storageService.imageUrl(book.coverKey) : null;
  const files = book.files ?? [];

  const base = {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    slug: book.slug,
    author: book.author && { id: book.author.id, name: book.author.name, slug: book.author.slug },
    categories: (book.categories ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    language: book.language,
    publicationYear: book.publicationYear,
    coverUrl,
    formats: files.map((f) => ({
      format: f.format,
      fileName: f.fileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      isReadable: f.isReadable,
      isDownloadable: f.isDownloadable,
    })),
    // Derived from the files: can this book be read / downloaded in at least one format?
    allowReading: files.some((f) => f.isReadable),
    allowDownload: files.some((f) => f.isDownloadable),
    downloadCount: book.downloadCount,
    readCount: book.readCount,
    publishedAt: book.publishedAt,
  };

  if (level === "summary") {
    const d = book.description;
    return { ...base, excerpt: d.length > 220 ? `${d.slice(0, 217)}...` : d };
  }

  const detail = {
    ...base,
    description: book.description,
    isbn: book.isbn,
    publisher: book.publisher,
    pageCount: book.pageCount,
    keywords: book.keywords,
    rightsNote: book.rightsNote,
  };

  if (level === "detail") return detail;

  return {
    ...detail,
    status: book.status,
    coverKey: book.coverKey,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}
