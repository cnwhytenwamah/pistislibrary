import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories } from "@/services/library";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Christian books by category: prayer, theology, devotionals, Bible study and more.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <Container className="pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-2 text-ink-soft">Find books by topic.</p>
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid />
      </Suspense>
    </Container>
  );
}

async function CategoryGrid() {
  await connection();
  const categories = await getCategories();

  if (categories.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title="No categories yet">Categories appear here once books are added.</EmptyState>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/categories/${c.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition hover:border-copper hover:shadow-glow"
          >
            <span className="text-lg font-semibold group-hover:text-copper-soft">{c.name}</span>
            {c.description && <span className="mt-1 line-clamp-2 text-sm text-ink-soft">{c.description}</span>}
            <span className="mt-4 text-xs text-ink-soft">
              {c.bookCount ?? 0} {c.bookCount === 1 ? "book" : "books"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryGridSkeleton() {
  return (
    <div role="status" aria-label="Loading categories" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}
