/**
 * URL-safe slugs. Diacritics are folded (ā → a, ö → o) so Sanskrit and
 * Tibetan transliterations produce readable URLs; anything left that is not
 * ASCII-alphanumeric becomes a hyphen.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Slug for a new post; falls back to a timestamp for non-Latin titles. */
export function slugForTitle(title: string): string {
  return slugify(title) || `post-${Date.now()}`;
}
