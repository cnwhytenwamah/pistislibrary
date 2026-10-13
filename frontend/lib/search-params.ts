import type { BookSort } from "@/types/library";
import type { BookQuery } from "@/services/library";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 20;

const SORTS: BookSort[] = ["relevance", "newest", "oldest", "downloads", "popular", "title"];
const FORMATS = ["PDF", "EPUB"] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Turns untrusted URL parameters into a validated library query. */
export function parseBookParams(sp: RawSearchParams): BookQuery & { page: number } {
  const page = Number.parseInt(first(sp.page) ?? "1", 10);
  const year = Number.parseInt(first(sp.year) ?? "", 10);
  const sort = first(sp.sort) as BookSort | undefined;
  const format = first(sp.format)?.toUpperCase() as (typeof FORMATS)[number] | undefined;

  return {
    q: first(sp.q)?.slice(0, 200),
    category: first(sp.category),
    author: first(sp.author),
    language: first(sp.language)?.toLowerCase().slice(0, 10),
    year: Number.isFinite(year) ? year : undefined,
    format: format && FORMATS.includes(format) ? format : undefined,
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
    limit: PAGE_SIZE,
  };
}
