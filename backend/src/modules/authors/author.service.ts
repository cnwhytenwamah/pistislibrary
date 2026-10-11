import { AppError } from "../../utils/AppError";
import { paginationMeta, toOffset } from "../../utils/pagination";
import { uniqueSlug } from "../../utils/slug";
import { cacheService } from "../../services/cache.service";
import { storageService } from "../../services/storage.service";
import { verifyUpload } from "../../services/uploadVerification";
import { authorRepository } from "./author.repository";
import type { CreateAuthorInput, UpdateAuthorInput, ListAuthorsQuery } from "./author.schema";

type AuthorLike = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photoKey: string | null;
};

const toJSON = async (a: AuthorLike) => ({
  id: a.id,
  name: a.name,
  slug: a.slug,
  bio: a.bio,
  photoUrl: a.photoKey ? await storageService.imageUrl(a.photoKey) : null,
});

export const authorService = {
  async list(query: ListAuthorsQuery, opts: { onlyWithBooks: boolean }) {
    const rows = await authorRepository.list({
      q: query.q || undefined,
      onlyWithBooks: opts.onlyWithBooks,
      limit: query.limit,
      offset: toOffset(query.page, query.limit),
    });
    const total = rows[0]?.total ?? 0;
    return {
      data: await Promise.all(rows.map(async (r) => ({ ...(await toJSON(r)), bookCount: r.bookCount }))),
      meta: paginationMeta(query.page, query.limit, total),
    };
  },

  async get(idOrSlug: string) {
    const author = await authorRepository.findByIdOrSlug(idOrSlug);
    if (!author) throw new AppError(404, "Author not found");
    return toJSON(author);
  },

  async create(input: CreateAuthorInput) {
    if (await authorRepository.findByName(input.name)) {
      throw new AppError(409, "An author with this name already exists");
    }
    if (input.photoKey) await verifyUpload(input.photoKey, "authorPhoto");

    const slug = await uniqueSlug(input.name, authorRepository.slugExists);
    const author = await authorRepository.create({
      name: input.name,
      slug,
      bio: input.bio ?? null,
      photoKey: input.photoKey ?? null,
    });
    return toJSON(author);
  },

  async update(id: string, input: UpdateAuthorInput) {
    const author = await authorRepository.findById(id);
    if (!author) throw new AppError(404, "Author not found");

    if (input.name && input.name.toLowerCase() !== author.name.toLowerCase()) {
      if (await authorRepository.findByName(input.name)) {
        throw new AppError(409, "An author with this name already exists");
      }
    }

    let oldPhoto: string | null = null;
    if (input.photoKey !== undefined && input.photoKey !== author.photoKey) {
      if (input.photoKey) await verifyUpload(input.photoKey, "authorPhoto");
      oldPhoto = author.photoKey;
    }

    const renamed = input.name !== undefined && input.name !== author.name;
    // Slug stays stable on rename so existing links/filters keep working
    await author.update(input);
    if (oldPhoto) await storageService.remove(oldPhoto);
    if (renamed) await authorRepository.refreshBooksSearch(author.id);
    // Cached book pages embed the author's name/slug
    await cacheService.delByPrefix("book:");
    return toJSON(author);
  },

  async remove(id: string) {
    const author = await authorRepository.findById(id);
    if (!author) throw new AppError(404, "Author not found");
    const count = await authorRepository.countBooks(id);
    if (count > 0) {
      throw new AppError(409, `Cannot delete: ${count} book(s) still use this author`);
    }
    const photo = author.photoKey;
    await author.destroy();
    await storageService.remove(photo);
  },
};
