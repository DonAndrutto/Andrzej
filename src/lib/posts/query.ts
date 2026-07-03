import { markdownToPlainText } from "./plain-text";
import { readingTimeMinutes } from "./reading-time";
import { slugify } from "./slug";
import type {
  Paginated,
  Post,
  PostQuery,
  PostStatus,
  Taxonomy,
} from "./types";

/**
 * Pure, backend-agnostic query logic shared by every PostRepository
 * implementation. Both the filesystem and Firestore backends load candidate
 * documents and delegate filtering, search, ordering and pagination here, so
 * the two backends are behaviourally identical by construction.
 */

const DEFAULT_PER_PAGE = 9;

/** Coerce raw stored data (frontmatter / Firestore document) into a Post. */
export function normalizePost(
  slug: string,
  data: Record<string, unknown>,
  content: string,
): Post {
  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
  const status: PostStatus = data.status === "published" ? "published" : "draft";
  const tags = Array.isArray(data.tags)
    ? data.tags.map((t) => String(t)).filter(Boolean)
    : [];

  const rawImage = data.featuredImage as Record<string, unknown> | null | undefined;
  const featuredImage =
    rawImage && typeof rawImage === "object" && typeof rawImage.url === "string"
      ? {
          url: rawImage.url,
          alt: str(rawImage.alt, str(data.title)),
          width: typeof rawImage.width === "number" ? rawImage.width : undefined,
          height:
            typeof rawImage.height === "number" ? rawImage.height : undefined,
          blurDataURL:
            typeof rawImage.blurDataURL === "string"
              ? rawImage.blurDataURL
              : undefined,
        }
      : null;

  const createdAt = toIso(data.createdAt) ?? new Date(0).toISOString();

  return {
    slug,
    title: str(data.title, slug),
    excerpt: str(data.excerpt),
    content,
    status,
    category: str(data.category, "Notes"),
    tags,
    featuredImage,
    createdAt,
    updatedAt: toIso(data.updatedAt) ?? createdAt,
    publishedAt: toIso(data.publishedAt),
    readingTimeMinutes: readingTimeMinutes(content),
  };
}

/** Accepts ISO strings, Date objects and Firestore Timestamps. */
export function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

/** Newest first: published posts by publish date, drafts by last edit. */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) =>
    sortKey(b).localeCompare(sortKey(a)),
  );
}

function sortKey(post: Post): string {
  return post.status === "published"
    ? (post.publishedAt ?? post.updatedAt)
    : post.updatedAt;
}

export function applyQuery(posts: Post[], query: PostQuery): Paginated<Post> {
  const status = query.status ?? "published";
  let filtered = posts.filter(
    (p) => status === "all" || p.status === status,
  );

  if (query.category) {
    const wanted = query.category.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        slugify(p.category) === wanted || p.category.toLowerCase() === wanted,
    );
  }

  if (query.tag) {
    const wanted = query.tag.toLowerCase();
    filtered = filtered.filter((p) =>
      p.tags.some(
        (t) => slugify(t) === wanted || t.toLowerCase() === wanted,
      ),
    );
  }

  if (query.search?.trim()) {
    const terms = query.search.trim().toLowerCase().split(/\s+/);
    filtered = filtered.filter((p) => {
      const haystack = [
        p.title,
        p.excerpt,
        p.category,
        p.tags.join(" "),
        markdownToPlainText(p.content),
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  filtered = sortPosts(filtered);

  const perPage = Math.max(1, query.perPage ?? DEFAULT_PER_PAGE);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page ?? 1), totalPages);

  return {
    items: filtered.slice((page - 1) * perPage, page * perPage),
    total,
    page,
    perPage,
    totalPages,
  };
}

/** Distinct categories or tags across published posts, with counts. */
export function taxonomiesOf(
  posts: Post[],
  field: "category" | "tags",
): Taxonomy[] {
  const map = new Map<string, Taxonomy>();
  for (const post of posts) {
    if (post.status !== "published") continue;
    const values = field === "category" ? [post.category] : post.tags;
    for (const name of values) {
      if (!name) continue;
      const slug = slugify(name);
      const existing = map.get(slug);
      if (existing) existing.count += 1;
      else map.set(slug, { name, slug, count: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}
