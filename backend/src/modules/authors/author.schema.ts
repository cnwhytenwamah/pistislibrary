import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { AUTHOR_PHOTO_KEY_RE } from "../../utils/storageKeys";

export const createAuthorSchema = z.object({
  name: z.string().trim().min(2).max(150),
  bio: z.string().trim().max(5000).nullish(),
  photoKey: z.string().regex(AUTHOR_PHOTO_KEY_RE, "Invalid photo key").nullish(),
});

export const updateAuthorSchema = createAuthorSchema.partial();

export const listAuthorsQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
});

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
export type ListAuthorsQuery = z.infer<typeof listAuthorsQuery>;
