import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { languageName } from "@/lib/format";
import type { BookSort, Category } from "@/types/library";

type Values = {
  q?: string;
  category?: string;
  author?: string;
  language?: string;
  year?: number;
  format?: string;
  sort?: BookSort;
};

const LANGUAGES = ["en", "es", "fr", "pt", "de", "sw", "yo", "ig", "ha", "zh", "ko"];

const SORT_LABELS: Record<BookSort, string> = {
  relevance: "Best match",
  newest: "Newest",
  oldest: "Oldest",
  downloads: "Most downloaded",
  popular: "Most popular",
  title: "Alphabetical (A–Z)",
};

const fieldClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-copper";

/**
 * Plain GET form: works without JavaScript and keeps every filter in the URL
 * (shareable, indexable-by-canonical, back-button friendly).
 */
export function LibraryFilters({
  action,
  values,
  categories = [],
  show,
  idPrefix = "f",
}: {
  action: string;
  values: Values;
  categories?: Category[];
  show: { search?: boolean; category?: boolean; language?: boolean; year?: boolean; format?: boolean };
  /** Prefix for field ids, so the form can appear twice on a page without clashes */
  idPrefix?: string;
}) {
  const sorts: BookSort[] = values.q
    ? ["relevance", "newest", "oldest", "downloads", "popular", "title"]
    : ["newest", "oldest", "downloads", "popular", "title"];
  const activeSort = values.sort && sorts.includes(values.sort) ? values.sort : sorts[0];

  return (
    <form action={action} method="get" role="search" aria-label="Filter books" className="space-y-4">
      {values.author && <input type="hidden" name="author" value={values.author} />}

      {show.search && (
        <div>
          <label htmlFor={`${idPrefix}-q`} className="mb-1.5 block text-sm font-medium">
            Search
          </label>
          <input
            id={`${idPrefix}-q`}
            name="q"
            type="search"
            defaultValue={values.q}
            placeholder="Title, author, topic…"
            className={fieldClass}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {show.category && categories.length > 0 && (
          <div>
            <label htmlFor={`${idPrefix}-category`} className="mb-1.5 block text-sm font-medium">
              Category
            </label>
            <select id={`${idPrefix}-category`} name="category" defaultValue={values.category ?? ""} className={fieldClass}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {show.format && (
          <div>
            <label htmlFor={`${idPrefix}-format`} className="mb-1.5 block text-sm font-medium">
              Format
            </label>
            <select id={`${idPrefix}-format`} name="format" defaultValue={values.format ?? ""} className={fieldClass}>
              <option value="">Any format</option>
              <option value="PDF">PDF</option>
              <option value="EPUB">EPUB</option>
            </select>
          </div>
        )}

        {show.language && (
          <div>
            <label htmlFor={`${idPrefix}-language`} className="mb-1.5 block text-sm font-medium">
              Language
            </label>
            <select id={`${idPrefix}-language`} name="language" defaultValue={values.language ?? ""} className={fieldClass}>
              <option value="">Any language</option>
              {LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {languageName(code)}
                </option>
              ))}
            </select>
          </div>
        )}

        {show.year && (
          <div>
            <label htmlFor={`${idPrefix}-year`} className="mb-1.5 block text-sm font-medium">
              Publication year
            </label>
            <input
              id={`${idPrefix}-year`}
              name="year"
              type="number"
              inputMode="numeric"
              min={1}
              max={9999}
              defaultValue={values.year}
              placeholder="e.g. 1912"
              className={fieldClass}
            />
          </div>
        )}

        <div>
          <label htmlFor={`${idPrefix}-sort`} className="mb-1.5 block text-sm font-medium">
            Sort by
          </label>
          <select id={`${idPrefix}-sort`} name="sort" defaultValue={activeSort} className={fieldClass}>
            {sorts.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className={buttonClasses("primary", "md")}>
          Apply
        </button>
        <Link href={values.author ? `${action}?author=${encodeURIComponent(values.author)}` : action} className="text-sm text-ink-soft hover:text-ink">
          Reset
        </Link>
      </div>
    </form>
  );
}
