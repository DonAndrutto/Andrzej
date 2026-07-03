import { slugify } from "./slug";
import type { PostImage, PostInput, PostStatus } from "./types";

/**
 * Validation for post payloads arriving at the admin API. Returns a clean
 * PostInput or a list of human-readable problems.
 */
export type ValidationResult =
  | { ok: true; input: PostInput }
  | { ok: false; errors: string[] };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TITLE = 200;
const MAX_EXCERPT = 500;
const MAX_CONTENT = 200_000;
const MAX_TAGS = 12;

export function validatePostInput(body: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }
  const raw = body as Record<string, unknown>;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) errors.push("Title is required.");
  if (title.length > MAX_TITLE) errors.push(`Title must be under ${MAX_TITLE} characters.`);

  let slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  if (!slug) slug = slugify(title);
  if (!SLUG_PATTERN.test(slug)) {
    errors.push(
      "Slug may contain only lowercase letters, digits and single hyphens.",
    );
  }

  const excerpt = typeof raw.excerpt === "string" ? raw.excerpt.trim() : "";
  if (excerpt.length > MAX_EXCERPT) {
    errors.push(`Excerpt must be under ${MAX_EXCERPT} characters.`);
  }

  const content = typeof raw.content === "string" ? raw.content : "";
  if (content.length > MAX_CONTENT) {
    errors.push("Post content is too large.");
  }

  const status: PostStatus = raw.status === "published" ? "published" : "draft";

  const category =
    typeof raw.category === "string" && raw.category.trim()
      ? raw.category.trim()
      : "Notes";

  const tags = Array.isArray(raw.tags)
    ? [...new Set(raw.tags.map((t) => String(t).trim()).filter(Boolean))].slice(
        0,
        MAX_TAGS,
      )
    : [];

  let featuredImage: PostImage | null = null;
  if (raw.featuredImage && typeof raw.featuredImage === "object") {
    const img = raw.featuredImage as Record<string, unknown>;
    if (typeof img.url === "string" && isSafeImageUrl(img.url)) {
      featuredImage = {
        url: img.url,
        alt: (typeof img.alt === "string" ? img.alt.trim() : "") || title,
        // Omit rather than set to `undefined`: gray-matter's YAML serializer
        // throws on any object property whose value is `undefined`.
        ...(typeof img.width === "number" ? { width: img.width } : {}),
        ...(typeof img.height === "number" ? { height: img.height } : {}),
        ...(isBlurDataUrl(img.blurDataURL) ? { blurDataURL: img.blurDataURL } : {}),
      };
    } else {
      errors.push("Featured image URL must be site-relative or https.");
    }
  }

  let publishedAt: string | null | undefined;
  if (raw.publishedAt === null) publishedAt = null;
  else if (typeof raw.publishedAt === "string") {
    const date = new Date(raw.publishedAt);
    if (Number.isNaN(date.getTime())) errors.push("Invalid publish date.");
    else publishedAt = date.toISOString();
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    input: {
      slug,
      title,
      excerpt,
      content,
      status,
      category,
      tags,
      featuredImage,
      ...(publishedAt !== undefined ? { publishedAt } : {}),
    },
  };
}

function isSafeImageUrl(url: string): boolean {
  return url.startsWith("/") || url.startsWith("https://");
}

/** Blur placeholders are tiny inline data URIs; cap size to keep docs small. */
function isBlurDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length <= 8_192
  );
}
