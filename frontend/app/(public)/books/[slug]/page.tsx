import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { JsonLd } from "@/components/json-ld";
import { BookCover } from "@/features/library/BookCover";
import { BookGrid } from "@/features/library/BookGrid";
import { siteConfig } from "@/lib/config";
import { formatBytes, formatDate, languageName } from "@/lib/format";
import { getBook, getBooks } from "@/services/library";
import type { BookDetail } from "@/types/library";

/**
 * Real slugs are rendered on demand. A placeholder param makes Next treat this route as
 * "known params" (which lets unknown slugs return a true 404) without calling the API at build time.
 * Slugs are lowercase letters, digits and hyphens, so this value can never be a real slug.
 */
const PLACEHOLDER = "__placeholder__";

export function generateStaticParams() {
  return [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/books/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === PLACEHOLDER) return { title: "Book not found", robots: { index: false } };
  const book = await getBook(slug);
  if (!book) return { title: "Book not found", robots: { index: false } };

  const description =
    book.description.length > 160 ? `${book.description.slice(0, 157).trimEnd()}...` : book.description;
  const title = book.author ? `${book.title} by ${book.author.name}` : book.title;

  return {
    title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      type: "book",
      title,
      description,
      url: `/books/${book.slug}`,
      isbn: book.isbn ?? undefined,
      authors: book.author ? [book.author.name] : undefined,
      images: book.coverUrl ? [{ url: book.coverUrl, alt: `Cover of ${book.title}` }] : undefined,
    },
    twitter: { card: book.coverUrl ? "summary_large_image" : "summary", title, description },
  };
}

// Resolved before the page content streams. Note: Next serves the prerendered shell first for
// dynamic routes, so a missing book renders the not-found page with a noindex tag (HTTP 200).
export default async function BookPage({ params }: PageProps<"/books/[slug]">) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const book = await getBook(slug);
  if (!book) notFound();

  return (
    <Container className="pt-8">
      <JsonLd data={bookJsonLd(book)} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/books" className="hover:text-ink">Library</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-ink">{book.title}</li>
        </ol>
      </nav>

      <article className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] lg:gap-12">
        <div className="md:sticky md:top-24 md:self-start">
          <BookCover
            title={book.title}
            coverUrl={book.coverUrl}
            priority
            className="mx-auto w-full max-w-[260px] shadow-glow md:max-w-none"
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{book.title}</h1>
          {book.subtitle && <p className="mt-2 text-lg text-ink-soft">{book.subtitle}</p>}

          {book.author && (
            <p className="mt-4 text-base">
              by{" "}
              <Link href={`/authors/${book.author.slug}`} className="text-copper-soft underline-offset-4 hover:text-copper-bright hover:underline">
                {book.author.name}
              </Link>
            </p>
          )}

          {book.categories.length > 0 && (
            <ul aria-label="Categories" className="mt-4 flex flex-wrap gap-2">
              {book.categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="inline-flex rounded-full border border-line bg-umber px-3 py-1 text-xs text-ink-soft transition hover:border-copper hover:text-ink"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="formats-heading" className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <h2 id="formats-heading" className="text-sm font-semibold">Available formats</h2>
            <ul className="mt-3 divide-y divide-line">
              {book.formats.map((f) => (
                <li key={f.format} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="flex items-center gap-3">
                    <Badge className="uppercase text-ink">{f.format}</Badge>
                    <span className="text-ink-soft">{formatBytes(f.sizeBytes)}</span>
                  </span>
                  <span className="text-xs text-ink-soft">
                    {[f.isReadable && "Read online", f.isDownloadable && "Download"].filter(Boolean).join(" · ") ||
                      "Not currently available"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">Online reading and downloads are launching soon.</p>
          </section>

          <section aria-labelledby="about-heading" className="mt-8">
            <h2 id="about-heading" className="text-lg font-semibold">About this book</h2>
            <div className="mt-3 space-y-4 leading-relaxed text-ink-soft">
              {book.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="details-heading" className="mt-8">
            <h2 id="details-heading" className="text-lg font-semibold">Details</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <Detail label="Language" value={languageName(book.language)} />
              <Detail label="Published" value={book.publicationYear} />
              <Detail label="Publisher" value={book.publisher} />
              <Detail label="Pages" value={book.pageCount} />
              <Detail label="ISBN" value={book.isbn} />
              <Detail label="Added" value={book.publishedAt ? formatDate(book.publishedAt) : null} />
              <Detail label="Rights" value={book.rightsNote} />
            </dl>
          </section>

          {book.keywords.length > 0 && (
            <ul aria-label="Keywords" className="mt-6 flex flex-wrap gap-2">
              {book.keywords.map((k) => (
                <li key={k}>
                  <Link
                    href={`/books?q=${encodeURIComponent(k)}`}
                    className="inline-flex rounded-full bg-umber px-3 py-1 text-xs text-ink-soft hover:text-ink"
                  >
                    {k}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>

      {book.author && (
        <Suspense fallback={null}>
          <MoreByAuthor book={book} />
        </Suspense>
      )}
    </Container>
  );
}

async function MoreByAuthor({ book }: { book: BookDetail }) {
  if (!book.author) return null;
  const { data } = await getBooks({ author: book.author.slug, sort: "popular", limit: 6 });
  const others = data.filter((b) => b.id !== book.id).slice(0, 5);
  if (others.length === 0) return null;

  return (
    <section aria-labelledby="more-heading" className="mt-16">
      <SectionHeading
        id="more-heading"
        title={`More by ${book.author.name}`}
        action={{ href: `/authors/${book.author.slug}`, label: "View all" }}
      />
      <BookGrid books={others} label={`More books by ${book.author.name}`} />
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </>
  );
}

function bookJsonLd(book: BookDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    url: `${siteConfig.url}/books/${book.slug}`,
    description: book.description,
    inLanguage: book.language,
    ...(book.coverUrl ? { image: book.coverUrl } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
    ...(book.publicationYear ? { datePublished: String(book.publicationYear) } : {}),
    ...(book.publisher ? { publisher: { "@type": "Organization", name: book.publisher } } : {}),
    ...(book.author
      ? {
          author: {
            "@type": "Person",
            name: book.author.name,
            url: `${siteConfig.url}/authors/${book.author.slug}`,
          },
        }
      : {}),
    genre: book.categories.map((c) => c.name),
    ...(book.keywords.length ? { keywords: book.keywords.join(", ") } : {}),
  };
}
