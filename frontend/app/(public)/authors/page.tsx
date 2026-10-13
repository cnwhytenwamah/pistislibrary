import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthorAvatar } from "@/features/library/AuthorAvatar";
import { Pagination } from "@/features/library/Pagination";
import { getAuthors } from "@/services/library";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Authors",
  description: "Browse the authors in the PistisLibrary collection.",
  alternates: { canonical: "/authors" },
};

const PAGE_SIZE = 24;

export default function AuthorsPage({ searchParams }: PageProps<"/authors">) {
  return (
    <Container className="pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Authors</h1>
      <form action="/authors" method="get" role="search" className="mt-6 flex max-w-md gap-2">
        <label htmlFor="author-q" className="sr-only">Search authors</label>
        <input
          id="author-q"
          name="q"
          type="search"
          placeholder="Search authors…"
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-copper"
        />
        <button type="submit" className="rounded-full bg-copper-bright px-4 py-2 text-sm font-medium text-night hover:bg-copper-soft">
          Search
        </button>
      </form>
      <Suspense fallback={<AuthorsSkeleton />}>
        {searchParams.then((sp) => (
          <AuthorList sp={sp} />
        ))}
      </Suspense>
    </Container>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

async function AuthorList({ sp }: { sp: RawSearchParams }) {
  const q = first(sp.q)?.slice(0, 100);
  const parsed = Number.parseInt(first(sp.page) ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 10_000) : 1;
  const { data: authors, meta } = await getAuthors({ q, page, limit: PAGE_SIZE });

  if (authors.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title={q ? "No authors found" : "No authors yet"}>
          {q ? "Try a different spelling." : "Authors appear here once their books are added."}
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => (
          <li key={a.id}>
            <Link
              href={`/authors/${a.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-copper hover:shadow-glow"
            >
              <AuthorAvatar name={a.name} photoUrl={a.photoUrl} />
              <span className="min-w-0">
                <span className="block truncate font-semibold group-hover:text-copper-soft">{a.name}</span>
                <span className="text-xs text-ink-soft">
                  {a.bookCount ?? 0} {a.bookCount === 1 ? "book" : "books"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination basePath="/authors" params={{ q }} page={meta.page} totalPages={meta.totalPages} />
    </>
  );
}

function AuthorsSkeleton() {
  return (
    <div role="status" aria-label="Loading authors" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
