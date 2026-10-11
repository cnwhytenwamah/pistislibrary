import { fn, col, where, QueryTypes, CreationAttributes } from "sequelize";
import { sequelize } from "../../config/database";
import { BookCategory, Category } from "../../database/models";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bookCount: number;
};

export const categoryRepository = {
  findById: (id: string) => Category.findByPk(id),

  slugExists: async (slug: string) => (await Category.count({ where: { slug } })) > 0,

  findByName: (name: string) =>
    Category.findOne({ where: where(fn("lower", col("name")), name.toLowerCase()) }),

  countBooks: (categoryId: string) => BookCategory.count({ where: { categoryId } }),

  create: (data: CreationAttributes<Category>) => Category.create(data),

  /** Re-saves the category's books so the search_vector trigger picks up a rename. */
  refreshBooksSearch: (categoryId: string) =>
    sequelize.query(
      `UPDATE books SET updated_at = now()
       WHERE id IN (SELECT book_id FROM book_categories WHERE category_id = :categoryId)`,
      { replacements: { categoryId } }
    ),

  /** All categories with their published-book counts (categories are few, so no paging). */
  list(onlyWithBooks: boolean) {
    const havingSql = onlyWithBooks
      ? "HAVING COUNT(b.id) FILTER (WHERE b.status = 'PUBLISHED') > 0"
      : "";
    return sequelize.query<CategoryRow>(
      `SELECT c.id, c.name, c.slug, c.description,
              (COUNT(b.id) FILTER (WHERE b.status = 'PUBLISHED'))::int AS "bookCount"
       FROM categories c
       LEFT JOIN book_categories bc ON bc.category_id = c.id
       LEFT JOIN books b ON b.id = bc.book_id
       GROUP BY c.id
       ${havingSql}
       ORDER BY c.name`,
      { type: QueryTypes.SELECT }
    );
  },
};
