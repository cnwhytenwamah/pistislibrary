import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { BookGridSkeleton } from "@/components/ui/skeleton";
import { BookGrid } from "@/features/library/BookGrid";
import { LibraryFilters } from "@/features/library/LibraryFilters";
import { Pagination } from "@/features/library/Pagination";
import { toQueryString } from "@/lib/format";
import { parseBookParams, type RawSearchParams } from "@/lib/search-params";
import { getBooks, getCategories, searchBooks } from "@/services/library";

export const metadata: Metadata = {
  title: "Library",
  description: "Browse and search Christian books by title, author, category or keyword.",
  // Filtered and paginated variants all point to the main library page
  alternates: { canonical: "/books" },
};

export default function BooksPage({ searchParams }: PageProps<"/books">) {
  return (
    <Container className="pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
      <Suspense fallback={<div className="mt-8"><BookGridSkeleton /></div>}>
        {searchParams.then((sp) => (
          <Library sp={sp} />
        ))}
      </Suspense>
    </Container>
  );
}

async function visitorIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}

async function Library({ sp }: { sp: RawSearchParams }) {
  const query = parseBookParams(sp);
  const categories = await getCategories();
  const result = query.q ? await searchBooks(query, await visitorIp()) : await getBooks(query);
  const { data: books, meta } = result;

  const urlParams = {
    q: query.q,
    category: query.category,
    author: query.author,
    language: query.language,
    year: query.year,
    format: query.format,
    sort: query.sort,
  };
  const hasFilters = Object.values(urlParams).some((v) => v !== undefined);
  const showFilters = { search: true, category: true, format: true, language: true, year: true };
  const filterValues = urlParams;

  const first = (meta.page - 1) * meta.limit + 1;
  const last = first + books.length - 1;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
      <div>
        {/* Small screens: collapsible. Large screens: sidebar. Two copies, one visible at a time. */}
        <details className="rounded-xl border border-line bg-surface p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-medium">Search and filters</summary>
          <div className="mt-4">
            <LibraryFilters action="/books" values={filterValues} categories={categories} show={showFilters} idPrefix="m" />
          </div>
        </details>
        <aside aria-label="Filters" className="sticky top-24 hidden lg:block">
          <LibraryFilters action="/books" values={filterValues} categories={categories} show={showFilters} idPrefix="d" />
        </aside>
      </div>

      <section aria-label="Results">
        <p role="status" className="mb-5 text-sm text-ink-soft">
          {meta.total === 0
            ? "No books found"
            : `Showing ${first}–${last} of ${meta.total} ${meta.total === 1 ? "book" : "books"}`}
          {query.q && (
            <>
              {" "}
              for <span className="text-ink">&ldquo;{query.q}&rdquo;</span>
            </>
          )}
        </p>

        {books.length > 0 ? (
          <>
            <BookGrid books={books} label="Books" />
            <Pagination basePath="/books" params={urlParams} page={meta.page} totalPages={meta.totalPages} />
          </>
        ) : meta.total > 0 ? (
          <EmptyState
            title="That page doesn't exist"
            actions={<LinkButton href={`/books${toQueryString(urlParams)}`}>Go to the first page</LinkButton>}
          >
            There are only {meta.totalPages} {meta.totalPages === 1 ? "page" : "pages"} of results.
          </EmptyState>
        ) : (
          <EmptyState
            title="Can't find the book you're looking for?"
            actions={
              <>
                <LinkButton href={`/requests/new${toQueryString({ title: query.q })}`}>Request this book</LinkButton>
                {hasFilters && (
                  <Link href="/books" className="inline-flex items-center px-3 text-sm text-ink-soft hover:text-ink">
                    Clear all filters
                  </Link>
                )}
              </>
            }
          >
            Try different keywords or fewer filters. If it isn&apos;t in the library yet, request it and we&apos;ll
            let you know when it&apos;s added.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
