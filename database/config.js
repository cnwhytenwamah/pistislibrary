// Used by sequelize-cli only (the app itself uses backend/src/config/database.ts).
// Environment variables are loaded by backend/.sequelizerc.
const base = { url: process.env.DATABASE_URL, dialect: "postgres" };

module.exports = { development: base, test: base, production: base };
