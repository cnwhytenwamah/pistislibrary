import { AppError } from "../../utils/AppError";
import { uniqueSlug } from "../../utils/slug";
import { cacheService } from "../../services/cache.service";
import { categoryRepository } from "./category.repository";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schema";

const toJSON = (c: { id: string; name: string; slug: string; description: string | null }) => ({
  id: c.id, name: c.name, slug: c.slug, description: c.description,
});

const CATEGORIES_CACHE_KEY = "categories:all";
const CATEGORIES_TTL_SECONDS = 300;

export const categoryService = {
  async list(opts: { onlyWithBooks: boolean }) {
    const load = async () => {
      const rows = await categoryRepository.list(opts.onlyWithBooks);
      return { data: rows.map((r) => ({ ...toJSON(r), bookCount: r.bookCount })) };
    };
    // Only the public view (categories that have published books) is cached
    return opts.onlyWithBooks
      ? cacheService.wrap(CATEGORIES_CACHE_KEY, CATEGORIES_TTL_SECONDS, load)
      : load();
  },

  async create(input: CreateCategoryInput) {
    if (await categoryRepository.findByName(input.name)) {
      throw new AppError(409, "A category with this name already exists");
    }
    const slug = await uniqueSlug(input.name, categoryRepository.slugExists);
    const category = await categoryRepository.create({
      name: input.name, slug, description: input.description ?? null,
    });
    await cacheService.del(CATEGORIES_CACHE_KEY);
    return toJSON(category);
  },

  async update(id: string, input: UpdateCategoryInput) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError(404, "Category not found");

    if (input.name && input.name.toLowerCase() !== category.name.toLowerCase()) {
      if (await categoryRepository.findByName(input.name)) {
        throw new AppError(409, "A category with this name already exists");
      }
    }
    const renamed = input.name !== undefined && input.name !== category.name;
    await category.update(input);
    if (renamed) await categoryRepository.refreshBooksSearch(category.id);
    // Cached book pages embed category names
    await cacheService.del(CATEGORIES_CACHE_KEY);
    await cacheService.delByPrefix("book:");
    return toJSON(category);
  },

  async remove(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError(404, "Category not found");
    const count = await categoryRepository.countBooks(id);
    if (count > 0) {
      throw new AppError(409, `Cannot delete: ${count} book(s) still use this category`);
    }
    await category.destroy();
    await cacheService.del(CATEGORIES_CACHE_KEY);
  },
};
