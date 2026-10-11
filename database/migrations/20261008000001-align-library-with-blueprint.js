"use strict";

/**
 * Phase 3 alignment with the PistisLibrary blueprint:
 *  - books can have many categories (book_categories) instead of one category_id
 *  - read/download availability moves from the book to each file (book_files.is_readable / is_downloadable)
 *  - book_files gains file_name and mime_type
 *  - authors gain a photo (stored as a storage key, like cover_key)
 *  - books can be ARCHIVED
 *  - downloads reference the exact file (book_file_id) and use downloaded_at
 *  - the full-text search vector now covers every category of a book
 */
module.exports = {
  async up(q, S) {
    const sql = (text) => q.sequelize.query(text);

    // 1. book_categories (many-to-many), backfilled from books.category_id
    await q.createTable("book_categories", {
      book_id: {
        type: S.UUID, allowNull: false, primaryKey: true,
        references: { model: "books", key: "id" }, onDelete: "CASCADE",
      },
      category_id: {
        type: S.UUID, allowNull: false, primaryKey: true,
        references: { model: "categories", key: "id" }, onDelete: "RESTRICT",
      },
    });
    await q.addIndex("book_categories", ["category_id"]);
    await sql("INSERT INTO book_categories (book_id, category_id) SELECT id, category_id FROM books");

    // 2. book_files: file_name, mime_type and per-file availability (backfilled from the book)
    await q.addColumn("book_files", "file_name", { type: S.STRING(255), allowNull: true });
    await q.addColumn("book_files", "mime_type", { type: S.STRING(100), allowNull: true });
    await q.addColumn("book_files", "is_readable", { type: S.BOOLEAN, allowNull: false, defaultValue: true });
    await q.addColumn("book_files", "is_downloadable", { type: S.BOOLEAN, allowNull: false, defaultValue: true });
    await sql(`
      UPDATE book_files f
      SET file_name = b.slug || '.' || lower(f.format::text),
          mime_type = CASE f.format::text WHEN 'PDF' THEN 'application/pdf' ELSE 'application/epub+zip' END,
          is_readable = b.allow_reading,
          is_downloadable = b.allow_download
      FROM books b
      WHERE b.id = f.book_id
    `);
    await q.changeColumn("book_files", "file_name", { type: S.STRING(255), allowNull: false });
    await q.changeColumn("book_files", "mime_type", { type: S.STRING(100), allowNull: false });

    // 3. Drop the old single-category and book-level availability columns
    await sql("DROP TRIGGER IF EXISTS books_search_trigger ON books");
    await q.removeColumn("books", "category_id");
    await q.removeColumn("books", "allow_reading");
    await q.removeColumn("books", "allow_download");

    // 4. Search vector now covers all of a book's categories
    await sql(`
      CREATE OR REPLACE FUNCTION books_search_update() RETURNS trigger AS $$
      DECLARE a_name text; c_names text;
      BEGIN
        SELECT name INTO a_name FROM authors WHERE id = NEW.author_id;
        SELECT string_agg(c.name, ' ') INTO c_names
          FROM book_categories bc JOIN categories c ON c.id = bc.category_id
          WHERE bc.book_id = NEW.id;
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(a_name, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.keywords, ' '), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(c_names, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);
    await sql(`
      CREATE TRIGGER books_search_trigger
      BEFORE INSERT OR UPDATE ON books
      FOR EACH ROW EXECUTE FUNCTION books_search_update();
    `);
    // Changing a book's categories re-saves the book so the vector is rebuilt
    await sql(`
      CREATE OR REPLACE FUNCTION book_categories_touch_book() RETURNS trigger AS $$
      BEGIN
        UPDATE books SET updated_at = now() WHERE id = COALESCE(NEW.book_id, OLD.book_id);
        RETURN NULL;
      END
      $$ LANGUAGE plpgsql;
    `);
    await sql(`
      CREATE TRIGGER book_categories_touch
      AFTER INSERT OR DELETE ON book_categories
      FOR EACH ROW EXECUTE FUNCTION book_categories_touch_book();
    `);

    // 5. Authors: photo (storage key)
    await q.addColumn("authors", "photo_key", { type: S.STRING(255), allowNull: true });

    // 6. Books: ARCHIVED status
    await sql(`ALTER TYPE "enum_books_status" ADD VALUE IF NOT EXISTS 'ARCHIVED'`);

    // 7. Downloads: link to the exact file, downloaded_at
    await q.addColumn("downloads", "book_file_id", {
      type: S.UUID, allowNull: true,
      references: { model: "book_files", key: "id" }, onDelete: "SET NULL",
    });
    await sql(`
      UPDATE downloads d SET book_file_id = f.id
      FROM book_files f
      WHERE f.book_id = d.book_id AND f.format::text = d.format
    `);
    await q.addIndex("downloads", ["book_file_id"]);
    await q.renameColumn("downloads", "created_at", "downloaded_at");

    // 8. Rebuild every search vector with the new function
    await sql("UPDATE books SET title = title");
  },

  async down(q, S) {
    const sql = (text) => q.sequelize.query(text);

    await q.renameColumn("downloads", "downloaded_at", "created_at");
    await q.removeColumn("downloads", "book_file_id");
    await q.removeColumn("authors", "photo_key");

    // ARCHIVED cannot be removed from a Postgres enum; archived books become drafts
    await sql("UPDATE books SET status = 'DRAFT' WHERE status::text = 'ARCHIVED'");

    await sql("DROP TRIGGER IF EXISTS book_categories_touch ON book_categories");
    await sql("DROP FUNCTION IF EXISTS book_categories_touch_book()");
    await sql("DROP TRIGGER IF EXISTS books_search_trigger ON books");

    await q.addColumn("books", "category_id", { type: S.UUID, allowNull: true });
    await q.addColumn("books", "allow_reading", { type: S.BOOLEAN, allowNull: false, defaultValue: true });
    await q.addColumn("books", "allow_download", { type: S.BOOLEAN, allowNull: false, defaultValue: true });
    // A book keeps only its first category when going back to the single-category schema
    await sql(`
      UPDATE books b SET category_id = (
        SELECT bc.category_id FROM book_categories bc
        JOIN categories c ON c.id = bc.category_id
        WHERE bc.book_id = b.id ORDER BY c.name LIMIT 1)
    `);
    await sql(`
      UPDATE books b SET
        allow_reading = COALESCE((SELECT bool_or(f.is_readable) FROM book_files f WHERE f.book_id = b.id), true),
        allow_download = COALESCE((SELECT bool_or(f.is_downloadable) FROM book_files f WHERE f.book_id = b.id), true)
    `);
    await q.changeColumn("books", "category_id", {
      type: S.UUID, allowNull: false,
      references: { model: "categories", key: "id" }, onDelete: "RESTRICT",
    });
    await q.addIndex("books", ["category_id"]);

    for (const col of ["file_name", "mime_type", "is_readable", "is_downloadable"]) {
      await q.removeColumn("book_files", col);
    }
    await q.dropTable("book_categories");

    await sql(`
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
    await sql(`
      CREATE TRIGGER books_search_trigger
      BEFORE INSERT OR UPDATE ON books
      FOR EACH ROW EXECUTE FUNCTION books_search_update();
    `);
    await sql("UPDATE books SET title = title");
  },
};
