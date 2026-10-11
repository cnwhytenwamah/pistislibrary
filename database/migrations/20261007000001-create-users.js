"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("users", {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal("gen_random_uuid()") },
      name: { type: S.STRING(100), allowNull: false },
      email: { type: S.STRING(255), allowNull: false, unique: true },
      password_hash: { type: S.STRING(255), allowNull: true },
      google_id: { type: S.STRING(64), allowNull: true, unique: true },
      avatar_url: { type: S.TEXT, allowNull: true },
      role: { type: S.ENUM("USER", "ADMIN"), allowNull: false, defaultValue: "USER" },
      is_active: { type: S.BOOLEAN, allowNull: false, defaultValue: true },
      email_verified_at: { type: S.DATE, allowNull: true },
      last_login_at: { type: S.DATE, allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("now") },
    });
  },
  async down(q) {
    await q.dropTable("users");
    await q.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
