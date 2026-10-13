import Link from "next/link";
import { toQueryString } from "@/lib/format";

type Props = {
  basePath: string;
  /** Current URL parameters other than `page`, preserved in every link */
  params: Record<string, string | number | undefined>;
  page: number;
  totalPages: number;
};

function pageWindow(page: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ basePath, params, page, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => `${basePath}${toQueryString({ ...params, page: p > 1 ? p : undefined })}`;
  const linkBase =
    "inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm transition";

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={`${linkBase} border-line text-ink-soft hover:border-copper hover:text-ink`}>
          Previous
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-soft">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`${linkBase} ${
              p === page
                ? "border-copper-bright bg-brown text-ink shadow-glow"
                : "border-line text-ink-soft hover:border-copper hover:text-ink"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className={`${linkBase} border-line text-ink-soft hover:border-copper hover:text-ink`}>
          Next
        </Link>
      )}
    </nav>
  );
}
