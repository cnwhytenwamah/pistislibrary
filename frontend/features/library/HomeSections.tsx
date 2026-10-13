import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBooks, getCategories } from "@/services/library";
import { BookGrid } from "./BookGrid";

// Each section reads data at request time (cached per instance), so builds never need the API.

export async function FeaturedBooks() {
  await connection();
  const { data: books } = await getBooks({ sort: "popular", limit: 8 });

  if (books.length === 0) {
    return (
      <section aria-labelledby="featured-heading" className="mt-16">
        <SectionHeading id="featured-heading" title="Featured books" />
        <EmptyState title="The library is being stocked">
          New books are added regularly. In the meantime, you can request a title you&apos;d like to see.
        </EmptyState>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-heading" className="mt-16">
      <SectionHeading
        id="featured-heading"
        title="Featured books"
        description="Most read and downloaded by our community"
        action={{ href: "/books?sort=popular", label: "See all" }}
      />
      <BookGrid books={books} label="Featured books" />
    </section>
  );
}

export async function RecentBooks() {
  await connection();
  const { data: books } = await getBooks({ sort: "newest", limit: 8 });
  if (books.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="mt-16">
      <SectionHeading
        id="recent-heading"
        title="Recently added"
        action={{ href: "/books?sort=newest", label: "See all" }}
      />
      <BookGrid books={books} label="Recently added books" />
    </section>
  );
}

export async function BrowseCategories() {
  await connection();
  const categories = await getCategories();
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="mt-16">
      <SectionHeading
        id="categories-heading"
        title="Browse by category"
        action={{ href: "/categories", label: "All categories" }}
      />
      <ul className="flex flex-wrap gap-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categories/${c.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:border-copper hover:shadow-glow"
            >
              {c.name}
              {typeof c.bookCount === "number" && <span className="text-xs text-ink-soft">{c.bookCount}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RequestCta() {
  return (
    <section
      aria-labelledby="request-heading"
      className="mt-20 rounded-3xl border border-line bg-gradient-to-br from-umber to-surface px-6 py-12 text-center shadow-glow"
    >
      <h2 id="request-heading" className="text-2xl font-semibold tracking-tight">
        Can&apos;t find a book?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Tell us what you&apos;re looking for. When a requested book is added, everyone who asked is notified.
      </p>
      <LinkButton href="/requests/new" size="lg" className="mt-6">
        Request a book
      </LinkButton>
    </section>
  );
}
