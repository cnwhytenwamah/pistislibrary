import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { BookGridSkeleton } from "@/components/ui/skeleton";
import { JsonLd } from "@/components/json-ld";
import { AuthorAvatar } from "@/features/library/AuthorAvatar";
import { BookGrid } from "@/features/library/BookGrid";
import { LibraryFilters } from "@/features/library/LibraryFilters";
import { Pagination } from "@/features/library/Pagination";
import { siteConfig } from "@/lib/config";
import { parseBookParams, type RawSearchParams } from "@/lib/search-params";
import { getAuthor, getBooks } from "@/services/library";

/**
 * Real slugs are rendered on demand. A placeholder param makes Next treat this route as
 * "known params" (which lets unknown slugs return a true 404) without calling the API at build time.
 * Slugs are lowercase letters, digits and hyphens, so this value can never be a real slug.
 */
const PLACEHOLDER = "__placeholder__";

export function generateStaticParams() {
  return [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/authors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === PLACEHOLDER) return { title: "Author not found", robots: { index: false } };
  const author = await getAuthor(slug);
  if (!author) return { title: "Author not found", robots: { index: false } };
  const description = author.bio
    ? author.bio.length > 160 ? `${author.bio.slice(0, 157).trimEnd()}...` : author.bio
    : `Books by ${author.name} in the PistisLibrary collection.`;
  return {
    title: `${author.name}: books`,
    description,
    alternates: { canonical: `/authors/${author.slug}` },
    openGraph: { type: "profile", title: author.name, description },
  };
}

// Resolved before the page content streams (see the note in books/[slug]/page.tsx on status codes).
export default async function AuthorPage({ params, searchParams }: PageProps<"/authors/[slug]">) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const author = await getAuthor(slug);
  if (!author) notFound();

  return (
    <Container className="pt-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.name,
          url: `${siteConfig.url}/authors/${author.slug}`,
          ...(author.bio ? { description: author.bio } : {}),
          ...(author.photoUrl ? { image: author.photoUrl } : {}),
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-soft">
        <Link href="/authors" className="hover:text-ink">Authors</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-ink">{author.name}</span>
      </nav>

      <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <AuthorAvatar name={author.name} photoUrl={author.photoUrl} size={96} />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{author.name}</h1>
          {author.bio && <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">{author.bio}</p>}
        </div>
      </header>

      <Suspense fallback={<div className="mt-8"><BookGridSkeleton /></div>}>
        {searchParams.then((sp) => (
          <AuthorBooks slug={author.slug} name={author.name} sp={sp} />
        ))}
      </Suspense>
    </Container>
  );
}

async function AuthorBooks({ slug, name, sp }: { slug: string; name: string; sp: RawSearchParams }) {
  const query = parseBookParams({ ...sp, author: slug, q: undefined });
  const { data: books, meta } = await getBooks(query);
  const urlParams = { sort: query.sort, format: query.format };

  return (
    <>
      <div className="mt-8 max-w-xl">
        <LibraryFilters
          action={`/authors/${slug}`}
          values={{ sort: query.sort, format: query.format }}
          show={{ format: true }}
          idPrefix="a"
        />
      </div>

      <section aria-label="Books" className="mt-8">
        <p role="status" className="mb-5 text-sm text-ink-soft">
          {meta.total} {meta.total === 1 ? "book" : "books"} by {name}
        </p>
        {books.length > 0 ? (
          <>
            <BookGrid books={books} label={`Books by ${name}`} />
            <Pagination basePath={`/authors/${slug}`} params={urlParams} page={meta.page} totalPages={meta.totalPages} />
          </>
        ) : (
          <EmptyState title="No books to show">Nothing matches these filters.</EmptyState>
        )}
      </section>
    </>
  );
}
