import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/database";
import { Author, Book, BookFile, Category } from "../../database/models";
import type { BookStatus } from "../../database/models/Book";
import type { FileFormat } from "../../database/models/BookFile";
import { isUuid } from "../../utils/parseId";

export type BookSort = "relevance" | "newest" | "oldest" | "downloads" | "popular" | "title";

export type BookSearchFilters = {
  q?: string;
  category?: string;
  author?: string;
  language?: string;
  year?: number;
  format?: FileFormat;
  sort?: BookSort;
  statuses: BookStatus[];
  limit: number;
  offset: number;
};

const relations = [
  { model: Author, as: "author", attributes: ["id", "name", "slug"] },
  {
    model: Category,
    as: "categories",
    attributes: ["id", "name", "slug"],
    through: { attributes: [] },
  },
];

const filesInclude = {
  model: BookFile,
  as: "files",
  attributes: [
    "id", "format", "fileName", "mimeType", "storageKey", "sizeBytes",
    "isReadable", "isDownloadable", "etag",
  ],
};

export const bookRepository = {
  slugExists: async (slug: string) => (await Book.count({ where: { slug } })) > 0,

  findByIdFull: (id: string) => Book.findByPk(id, { include: [...relations, filesInclude] }),

  /** Looks a book up by UUID or slug, optionally restricted to certain statuses. */
  findByIdOrSlug: (idOrSlug: string, statuses?: BookStatus[]) =>
    Book.findOne({
      where: {
        ...(isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug }),
        ...(statuses ? { status: statuses } : {}),
      },
      include: [...relations, filesInclude],
    }),

  /**
   * Full-text + trigram search with filters. Returns ordered ids and the total
   * count; the full records are loaded separately (avoids LIMIT problems with
   * hasMany joins).
   */
  async searchIds(f: BookSearchFilters) {
    const where: string[] = ["b.status IN (:statuses)"];
    const rep: Record<string, unknown> = {
      statuses: f.statuses,
      limit: f.limit,
      offset: f.offset,
    };

    if (f.q) {
      rep.q = f.q;
      where.push("(b.search_vector @@ websearch_to_tsquery('english', :q) OR b.title % :q)");
    }
    if (f.category) {
      where.push(
        `EXISTS (SELECT 1 FROM book_categories bc JOIN categories c ON c.id = bc.category_id
                 WHERE bc.book_id = b.id AND c.slug = :category)`
      );
      rep.category = f.category;
    }
    if (f.author) { where.push("a.slug = :author"); rep.author = f.author; }
    if (f.language) { where.push("b.language = :language"); rep.language = f.language; }
    if (f.year) { where.push("b.publication_year = :year"); rep.year = f.year; }
    if (f.format) {
      where.push("EXISTS (SELECT 1 FROM book_files bf WHERE bf.book_id = b.id AND bf.format = :format)");
      rep.format = f.format;
    }

    let sort: BookSort = f.sort ?? (f.q ? "relevance" : "newest");
    if (sort === "relevance" && !f.q) sort = "newest";

    const orderBy: Record<BookSort, string> = {
      relevance:
        "(ts_rank(b.search_vector, websearch_to_tsquery('english', :q)) + similarity(b.title, :q)) DESC",
      newest: "COALESCE(b.published_at, b.created_at) DESC",
      oldest: "COALESCE(b.published_at, b.created_at) ASC",
      downloads: "b.download_count DESC",
      popular: "(b.read_count + b.download_count) DESC",
      title: "b.title ASC",
    };

    const rows = await sequelize.query<{ id: string; total: number }>(
      `SELECT b.id, (COUNT(*) OVER())::int AS total
       FROM books b
       JOIN authors a ON a.id = b.author_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderBy[sort]}, b.id
       LIMIT :limit OFFSET :offset`,
      { replacements: rep, type: QueryTypes.SELECT }
    );

    let total = rows[0]?.total ?? 0;
    if (rows.length === 0 && f.offset > 0) {
      // Requested page is past the end: the window count is gone, so count separately
      const [row] = await sequelize.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM books b
         JOIN authors a ON a.id = b.author_id
         WHERE ${where.join(" AND ")}`,
        { replacements: rep, type: QueryTypes.SELECT }
      );
      total = row?.total ?? 0;
    }

    return { ids: rows.map((r) => r.id), total };
  },

  /** Loads books with relations, preserving the order of `ids`. */
  async findByIdsOrdered(ids: string[]) {
    if (ids.length === 0) return [];
    const books = await Book.findAll({
      where: { id: ids },
      include: [...relations, filesInclude],
    });
    const byId = new Map(books.map((b) => [b.id, b]));
    return ids.map((id) => byId.get(id)).filter((b): b is Book => !!b);
  },

  incrementReads: (id: string) => Book.increment("readCount", { by: 1, where: { id } }),
  incrementDownloads: (id: string) => Book.increment("downloadCount", { by: 1, where: { id } }),
};
