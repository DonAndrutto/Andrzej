import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type {
  Paginated,
  Post,
  PostInput,
  PostQuery,
  PostStatus,
  Taxonomy,
} from "./types";

/**
 * Storage contract for blog content.
 *
 * Two implementations exist:
 *  - FsPostRepository        → content/posts/*.md   (works with zero config;
 *                              writable in local development, read-only on
 *                              serverless hosts)
 *  - FirestorePostRepository → Firestore collection (production CMS backend)
 *
 * The active backend is chosen once per server process by getPostRepository().
 * Nothing outside this directory may touch the filesystem or Firestore
 * directly — pages, feeds and API routes all go through this interface, which
 * is what keeps the Vercel + Firebase migration a configuration change.
 */
export interface PostRepository {
  /** Human-readable backend name, surfaced in the admin dashboard. */
  readonly backend: "fs" | "firestore";
  /** Whether create/update/delete can succeed in this deployment. */
  readonly writable: boolean;

  listPosts(query?: PostQuery): Promise<Paginated<Post>>;
  getPost(slug: string): Promise<Post | null>;
  getSlugs(status: PostStatus | "all"): Promise<string[]>;
  listCategories(): Promise<Taxonomy[]>;
  listTags(): Promise<Taxonomy[]>;

  createPost(input: PostInput): Promise<Post>;
  /** `slug` may differ from `input.slug`; the repository handles renames. */
  updatePost(slug: string, input: PostInput): Promise<Post>;
  deletePost(slug: string): Promise<void>;
}

export type ContentBackend = "fs" | "firestore";

/** Resolve which backend this deployment uses. Explicit env var wins. */
export function resolveContentBackend(): ContentBackend {
  const explicit = process.env.CONTENT_BACKEND;
  if (explicit === "fs" || explicit === "firestore") return explicit;
  return isFirebaseAdminConfigured() ? "firestore" : "fs";
}

let repositoryPromise: Promise<PostRepository> | null = null;

/**
 * The process-wide repository instance. Adapters are imported dynamically so
 * a filesystem-backed deployment never loads the Firebase Admin SDK.
 */
export function getPostRepository(): Promise<PostRepository> {
  if (!repositoryPromise) {
    repositoryPromise =
      resolveContentBackend() === "firestore"
        ? import("./firestore-repository").then(
            (m) => new m.FirestorePostRepository(),
          )
        : import("./fs-repository").then((m) => new m.FsPostRepository());
  }
  return repositoryPromise;
}
