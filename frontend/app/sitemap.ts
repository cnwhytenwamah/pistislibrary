import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteConfig } from "@/lib/config";
import { getAuthors, getBooks, getCategories } from "@/services/library";

const MAX_PAGES = 200; // 10,000 books / authors

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built from live data at request time (never at build time)
  await connection();
  const base = siteConfig.url;

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/books`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/authors`, changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    for (const c of await getCategories()) {
      entries.push({ url: `${base}/categories/${c.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, meta } = await getBooks({ page, limit: 50, sort: "newest" });
      for (const b of data) {
        entries.push({
          url: `${base}/books/${b.slug}`,
          lastModified: b.publishedAt ?? undefined,
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
      if (page >= meta.totalPages) break;
    }

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, meta } = await getAuthors({ page, limit: 50 });
      for (const a of data) {
        entries.push({ url: `${base}/authors/${a.slug}`, changeFrequency: "monthly", priority: 0.5 });
      }
      if (page >= meta.totalPages) break;
    }
  } catch (err) {
    // If the API is unreachable, still serve the static entries
    console.error("sitemap: could not load library data", err);
  }

  return entries;
}
