/**
 * Content domain model.
 *
 * These types are the contract between the storage backends (filesystem
 * markdown today, Firestore once configured) and everything else — pages,
 * feeds, the admin dashboard. Both backends serialise to exactly this shape,
 * which is what makes the Firestore migration a data copy rather than a
 * rewrite.
 */

export type PostStatus = "draft" | "published";

export interface PostImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  /** Tiny base64 image generated at upload time, used as a blur placeholder. */
  blurDataURL?: string;
}

export interface Post {
  /** URL identifier and storage key (file name / Firestore document id). */
  slug: string;
  title: string;
  /** Short summary used in listings, meta descriptions and feeds. */
  excerpt: string;
  /** Markdown source. Rendered to sanitised HTML at the edge of the app. */
  content: string;
  status: PostStatus;
  category: string;
  tags: string[];
  featuredImage: PostImage | null;
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
  /** Set the first time the post is published; null while never-published. */
  publishedAt: string | null;
  /** Derived at read time from `content`; never persisted. */
  readingTimeMinutes: number;
}

/** Fields an author controls; timestamps are managed by the repository. */
export interface PostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  category: string;
  tags: string[];
  featuredImage: PostImage | null;
  /** Optional explicit publish date override (ISO 8601). */
  publishedAt?: string | null;
}

export interface Taxonomy {
  /** Display name, e.g. "Study Aid". */
  name: string;
  /** URL-safe form, e.g. "study-aid". */
  slug: string;
  /** Number of published posts. */
  count: number;
}

export interface PostQuery {
  /** Defaults to "published". The admin passes "all". */
  status?: PostStatus | "all";
  /** Category slug. */
  category?: string;
  /** Tag slug. */
  tag?: string;
  /** Free-text search over title, excerpt, tags and body. */
  search?: string;
  /** 1-based page number. */
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
