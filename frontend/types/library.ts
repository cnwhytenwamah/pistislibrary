export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type Paginated<T> = { data: T[]; meta: Pagination };

export type BookFormat = {
  format: "PDF" | "EPUB";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isReadable: boolean;
  isDownloadable: boolean;
};

export type AuthorRef = { id: string; name: string; slug: string };
export type CategoryRef = { id: string; name: string; slug: string };

export type BookSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  author: AuthorRef | null;
  categories: CategoryRef[];
  language: string;
  publicationYear: number | null;
  coverUrl: string | null;
  formats: BookFormat[];
  allowReading: boolean;
  allowDownload: boolean;
  downloadCount: number;
  readCount: number;
  publishedAt: string | null;
  excerpt: string;
};

export type BookDetail = Omit<BookSummary, "excerpt"> & {
  description: string;
  isbn: string | null;
  publisher: string | null;
  pageCount: number | null;
  keywords: string[];
  rightsNote: string | null;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photoUrl: string | null;
  bookCount?: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bookCount?: number;
};

export type BookSort = "relevance" | "newest" | "oldest" | "downloads" | "popular" | "title";
