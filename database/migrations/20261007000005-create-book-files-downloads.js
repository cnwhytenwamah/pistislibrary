"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("book_files", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      book_id: {
        type: S.UUID, allowNull: false,
        references: { model: "books", key: "id" }, onDelete: "CASCADE",
      },
      format: { type: S.ENUM("PDF", "EPUB"), allowNull: false },
      storage_key: { type: S.STRING(255), allowNull: false },
      size_bytes: { type: S.INTEGER, allowNull: false },
      etag: { type: S.STRING(100), allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });
    await q.addIndex("book_files", ["book_id", "format"], { unique: true });

    await q.createTable("downloads", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      user_id: {
        type: S.UUID, allowNull: false,
        references: { model: "users", key: "id" }, onDelete: "CASCADE",
      },
      book_id: {
        type: S.UUID, allowNull: false,
        references: { model: "books", key: "id" }, onDelete: "CASCADE",
      },
      format: { type: S.STRING(10), allowNull: false },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });
    await q.addIndex("downloads", ["user_id", "created_at"]);
    await q.addIndex("downloads", ["book_id"]);
  },
  async down(q) {
    await q.dropTable("downloads");
    await q.dropTable("book_files");
    await q.sequelize.query('DROP TYPE IF EXISTS "enum_book_files_format";');
  },
};
