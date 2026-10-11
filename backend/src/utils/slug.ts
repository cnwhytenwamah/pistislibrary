export const slugify = (input: string) =>
  input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "item";

/** Returns `slug`, `slug-2`, `slug-3`... until `exists` says it's free. */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while (await exists(slug)) slug = `${root}-${n++}`;
  return slug;
}
