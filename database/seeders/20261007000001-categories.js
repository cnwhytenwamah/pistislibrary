"use strict";
const { randomUUID } = require("crypto");

const categories = [
  ["Prayer", "prayer"],
  ["Theology", "theology"],
  ["Devotionals", "devotionals"],
  ["Bible Study", "bible-study"],
  ["Christian Living", "christian-living"],
  ["Biography", "biography"],
  ["Church History", "church-history"],
  ["Leadership", "leadership"],
  ["Marriage & Family", "marriage-and-family"],
  ["Evangelism & Missions", "evangelism-and-missions"],
];

// Run once on an empty categories table.
module.exports = {
  async up(q) {
    const now = new Date();
    await q.bulkInsert(
      "categories",
      categories.map(([name, slug]) => ({ id: randomUUID(), name, slug, created_at: now, updated_at: now }))
    );
  },
  async down(q) {
    await q.bulkDelete("categories", { slug: categories.map((c) => c[1]) });
  },
};
