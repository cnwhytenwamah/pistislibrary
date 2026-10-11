"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("refresh_tokens", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      user_id: {
        type: S.UUID, allowNull: false,
        references: { model: "users", key: "id" }, onDelete: "CASCADE",
      },
      token_hash: { type: S.STRING(64), allowNull: false, unique: true },
      expires_at: { type: S.DATE, allowNull: false },
      revoked_at: { type: S.DATE, allowNull: true },
      user_agent: { type: S.STRING(255), allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });
    await q.addIndex("refresh_tokens", ["user_id"]);
  },
  async down(q) {
    await q.dropTable("refresh_tokens");
  },
};
