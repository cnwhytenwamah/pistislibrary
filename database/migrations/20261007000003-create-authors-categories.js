"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("authors", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      name: { type: S.STRING(150), allowNull: false, unique: true },
      slug: { type: S.STRING(160), allowNull: false, unique: true },
      bio: { type: S.TEXT, allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });
    await q.createTable("categories", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      name: { type: S.STRING(80), allowNull: false, unique: true },
      slug: { type: S.STRING(90), allowNull: false, unique: true },
      description: { type: S.TEXT, allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });
  },
  async down(q) {
    await q.dropTable("categories");
    await q.dropTable("authors");
  },
};
