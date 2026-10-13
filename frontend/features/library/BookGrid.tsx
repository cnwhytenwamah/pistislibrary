import type { BookSummary } from "@/types/library";
import { BookCard } from "./BookCard";

export function BookGrid({ books, label }: { books: BookSummary[]; label?: string }) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {books.map((book, i) => (
        <li key={book.id}>
          <BookCard book={book} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
