import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ApiHttpError, apiGet } from "@/lib/server-api";
import { toQueryString } from "@/lib/format";
import type {
  Author, BookDetail, BookSort, BookSummary, Category, Paginated,
} from "@/types/library";

export type BookQuery = {
  q?: string;
  category?: string;
  author?: string;
  language?: string;
  year?: number;
  format?: "PDF" | "EPUB";
  sort?: BookSort;
  page?: number;
  limit?: number;
};

/**
 * Data access for the public library. Cached reads use `use cache` (runtime, in-memory by default);
 * callers render them behind `await connection()` inside Suspense so builds never need the API.
 */

export async function getBooks(query: BookQuery): Promise<Paginated<BookSummary>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("books");
  return apiGet(`/books${toQueryString(query)}`);
}

/** Free-text searches are not cached (unbounded keys); the visitor's IP is forwarded for rate limiting. */
export function searchBooks(query: BookQuery, clientIp?: string): Promise<Paginated<BookSummary>> {
  return apiGet(`/books${toQueryString(query)}`, { clientIp });
}

export async function getBook(slug: string): Promise<BookDetail | null> {
  "use cache";
  cacheTag("books", `book:${slug}`);
  try {
    const { book } = await apiGet<{ book: BookDetail }>(`/books/${encodeURIComponent(slug)}`);
    cacheLife("minutes");
    return book;
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 404) {
      cacheLife("seconds"); // don't keep "not found" around for long
      return null;
    }
    throw err;
  }
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  const { data } = await apiGet<{ data: Category[] }>("/categories");
  return data;
}

export async function getAuthors(params: { q?: string; page?: number; limit?: number }): Promise<Paginated<Author>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("authors");
  return apiGet(`/authors${toQueryString(params)}`);
}

export async function getAuthor(slug: string): Promise<Author | null> {
  "use cache";
  cacheTag("authors", `author:${slug}`);
  try {
    const { author } = await apiGet<{ author: Author }>(`/authors/${encodeURIComponent(slug)}`);
    cacheLife("minutes");
    return author;
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 404) {
      cacheLife("seconds");
      return null;
    }
    throw err;
  }
}
