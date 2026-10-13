import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BookSummary } from "@/types/library";
import { BookCover } from "./BookCover";

export function BookCard({ book, priority = false }: { book: BookSummary; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl p-2 transition duration-200 hover:bg-surface has-[:focus-visible]:bg-surface">
      <BookCover
        title={book.title}
        coverUrl={book.coverUrl}
        priority={priority}
        className="transition duration-200 group-hover:border-copper group-hover:shadow-glow"
      />
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {/* Stretched link: the whole card is clickable, with a single link for assistive tech */}
          <Link href={`/books/${book.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {book.title}
          </Link>
        </h3>
        {book.author && <p className="mt-1 truncate text-xs text-ink-soft">{book.author.name}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {book.categories.slice(0, 1).map((c) => (
            <Badge key={c.id}>{c.name}</Badge>
          ))}
          {book.formats.map((f) => (
            <Badge key={f.format} className="uppercase">
              {f.format}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
