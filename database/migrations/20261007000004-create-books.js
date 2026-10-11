"use strict";
module.exports = {
  async up(q, S) {
    await q.sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    await q.createTable("books", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      title: { type: S.STRING(300), allowNull: false },
      subtitle: { type: S.STRING(300), allowNull: true },
      slug: { type: S.STRING(320), allowNull: false, unique: true },
      description: { type: S.TEXT, allowNull: false },
      author_id: {
        type: S.UUID, allowNull: false,
        references: { model: "authors", key: "id" }, onDelete: "RESTRICT",
      },
      category_id: {
        type: S.UUID, allowNull: false,
        references: { model: "categories", key: "id" }, onDelete: "RESTRICT",
      },
      language: { type: S.STRING(10), allowNull: false, defaultValue: "en" },
      publication_year: { type: S.INTEGER, allowNull: true },
      isbn: { type: S.STRING(20), allowNull: true },
      publisher: { type: S.STRING(200), allowNull: true },
      page_count: { type: S.INTEGER, allowNull: true },
      cover_key: { type: S.STRING(255), allowNull: true },
      keywords: { type: S.ARRAY(S.STRING), allowNull: false, defaultValue: [] },
      status: { type: S.ENUM("DRAFT", "PUBLISHED"), allowNull: false, defaultValue: "DRAFT" },
      allow_reading: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
      allow_download: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
      download_count: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      read_count: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      rights_note: { type: S.TEXT, allowNull: true },
      published_at: { type: S.DATE, allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });

    await q.sequelize.query("ALTER TABLE books ADD COLUMN search_vector tsvector;");

    await q.addIndex("books", ["status", "published_at"]);
    await q.addIndex("books", ["author_id"]);
    await q.addIndex("books", ["category_id"]);
    await q.sequelize.query("CREATE INDEX books_search_idx ON books USING GIN (search_vector);");
    await q.sequelize.query("CREATE INDEX books_title_trgm_idx ON books USING GIN (title gin_trgm_ops);");

    // Weighted search vector across title, author, keywords, category, description.
    await q.sequelize.query(`
      CREATE OR REPLACE FUNCTION books_search_update() RETURNS trigger AS $$
      DECLARE a_name text; c_name text;
      BEGIN
        SELECT name INTO a_name FROM authors WHERE id = NEW.author_id;
        SELECT name INTO c_name FROM categories WHERE id = NEW.category_id;
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(a_name, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.keywords, ' '), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(c_name, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);
    await q.sequelize.query(`
      CREATE TRIGGER books_search_trigger
      BEFORE INSERT OR UPDATE ON books
      FOR EACH ROW EXECUTE FUNCTION books_search_update();
    `);
  },
  async down(q) {
    await q.sequelize.query("DROP TRIGGER IF EXISTS books_search_trigger ON books;");
    await q.sequelize.query("DROP FUNCTION IF EXISTS books_search_update();");
    await q.dropTable("books");
    await q.sequelize.query('DROP TYPE IF EXISTS "enum_books_status";');
  },
};
