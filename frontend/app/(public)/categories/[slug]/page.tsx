import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { BookGridSkeleton } from "@/components/ui/skeleton";
import { BookGrid } from "@/features/library/BookGrid";
import { LibraryFilters } from "@/features/library/LibraryFilters";
import { Pagination } from "@/features/library/Pagination";
import { parseBookParams, type RawSearchParams } from "@/lib/search-params";
import { getBooks, getCategories } from "@/services/library";

/**
 * Real slugs are rendered on demand. A placeholder param makes Next treat this route as
 * "known params" (which lets unknown slugs return a true 404) without calling the API at build time.
 * Slugs are lowercase letters, digits and hyphens, so this value can never be a real slug.
 */
const PLACEHOLDER = "__placeholder__";

export function generateStaticParams() {
  return [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === PLACEHOLDER) return { title: "Category not found", robots: { index: false } };
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Category not found", robots: { index: false } };
  return {
    title: `${category.name} books`,
    description: category.description ?? `Browse Christian books in the ${category.name} category.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

// Resolved before the page content streams (see the note in books/[slug]/page.tsx on status codes).
export default async function CategoryPage({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <Container className="pt-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-soft">
        <Link href="/categories" className="hover:text-ink">Categories</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-ink">{category.name}</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-2xl text-ink-soft">{category.description}</p>}

      <Suspense fallback={<div className="mt-8"><BookGridSkeleton /></div>}>
        {searchParams.then((sp) => (
          <CategoryBooks slug={slug} name={category.name} sp={sp} />
        ))}
      </Suspense>
    </Container>
  );
}

async function CategoryBooks({ slug, name, sp }: { slug: string; name: string; sp: RawSearchParams }) {
  const query = parseBookParams({ ...sp, category: slug, q: undefined });
  const { data: books, meta } = await getBooks(query);
  const urlParams = { sort: query.sort, format: query.format };

  return (
    <>
      <div className="mt-6 max-w-xl">
        <LibraryFilters
          action={`/categories/${slug}`}
          values={{ sort: query.sort, format: query.format }}
          show={{ format: true }}
          idPrefix="c"
        />
      </div>

      <section aria-label="Books" className="mt-8">
        <p role="status" className="mb-5 text-sm text-ink-soft">
          {meta.total} {meta.total === 1 ? "book" : "books"}
        </p>
        {books.length > 0 ? (
          <>
            <BookGrid books={books} label={`${name} books`} />
            <Pagination basePath={`/categories/${slug}`} params={urlParams} page={meta.page} totalPages={meta.totalPages} />
          </>
        ) : (
          <EmptyState
            title="No books here yet"
            actions={<LinkButton href={`/categories/${slug}`}>Back to {name}</LinkButton>}
          >
            Nothing matches these filters.
          </EmptyState>
        )}
      </section>
    </>
  );
}
