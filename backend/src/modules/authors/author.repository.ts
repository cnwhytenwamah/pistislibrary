import { fn, col, where, QueryTypes, CreationAttributes } from "sequelize";
import { sequelize } from "../../config/database";
import { Author, Book } from "../../database/models";
import { isUuid } from "../../utils/parseId";

export type AuthorRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photoKey: string | null;
  bookCount: number;
  total: number;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export const authorRepository = {
  findById: (id: string) => Author.findByPk(id),

  findByIdOrSlug: (idOrSlug: string) =>
    Author.findOne({ where: isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug } }),

  slugExists: async (slug: string) => (await Author.count({ where: { slug } })) > 0,

  /** Case-insensitive name lookup (the DB unique index is case-sensitive). */
  findByName: (name: string) =>
    Author.findOne({ where: where(fn("lower", col("name")), name.toLowerCase()) }),

  countBooks: (authorId: string) => Book.count({ where: { authorId } }),

  create: (data: CreationAttributes<Author>) => Author.create(data),

  /** Re-saves the author's books so the search_vector trigger picks up a rename. */
  refreshBooksSearch: (authorId: string) =>
    sequelize.query("UPDATE books SET updated_at = now() WHERE author_id = :authorId", {
      replacements: { authorId },
    }),

  async list(params: { q?: string; onlyWithBooks: boolean; limit: number; offset: number }) {
    const whereSql = params.q ? "WHERE a.name ILIKE :pattern" : "";
    const havingSql = params.onlyWithBooks
      ? "HAVING COUNT(b.id) FILTER (WHERE b.status = 'PUBLISHED') > 0"
      : "";
    const replacements = {
      pattern: params.q ? `%${escapeLike(params.q)}%` : null,
      limit: params.limit,
      offset: params.offset,
    };

    const rows = await sequelize.query<AuthorRow>(
      `SELECT a.id, a.name, a.slug, a.bio, a.photo_key AS "photoKey",
              (COUNT(b.id) FILTER (WHERE b.status = 'PUBLISHED'))::int AS "bookCount",
              (COUNT(*) OVER())::int AS total
       FROM authors a
       LEFT JOIN books b ON b.author_id = a.id
       ${whereSql}
       GROUP BY a.id
       ${havingSql}
       ORDER BY a.name
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    let total = rows[0]?.total ?? 0;
    if (rows.length === 0 && params.offset > 0) {
      // Page past the end: count separately so callers still get the real total
      const [row] = await sequelize.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM (
           SELECT a.id
           FROM authors a
           LEFT JOIN books b ON b.author_id = a.id
           ${whereSql}
           GROUP BY a.id
           ${havingSql}
         ) t`,
        { replacements, type: QueryTypes.SELECT }
      );
      total = row?.total ?? 0;
    }
    return { rows, total };
  },
};
