import { cache } from "react";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { HttpError } from "@/lib/http-error";
import type { PostRepository } from "./repository";
import { applyQuery, normalizePost, sortPosts, taxonomiesOf } from "./query";
import type {
  Paginated,
  Post,
  PostInput,
  PostQuery,
  PostStatus,
  Taxonomy,
} from "./types";

const COLLECTION = "posts";

/**
 * Firestore backend. Documents live in the `posts` collection with the slug
 * as document id and fields matching the Post shape (content stored as a
 * `content` markdown string).
 *
 * Reads load the collection once per request (deduplicated with React
 * `cache`) and reuse the shared in-memory query engine, so filtering, search
 * and pagination behave identically to the filesystem backend. Public pages
 * are statically generated / ISR, so Firestore is only consulted when a page
 * revalidates — at a personal-site scale this is a handful of reads a day.
 * If the corpus ever outgrows a single fetch, swap `loadAllPosts` for
 * cursor-based Firestore queries behind the same interface.
 */
const loadAllPosts = cache(async (): Promise<Post[]> => {
  const db = await getAdminFirestore();
  const snapshot = await db.collection(COLLECTION).get();
  const posts = snapshot.docs.map((doc) => {
    const data = doc.data();
    const { content, ...fields } = data;
    return normalizePost(
      doc.id,
      fields,
      typeof content === "string" ? content : "",
    );
  });
  return sortPosts(posts);
});

export class FirestorePostRepository implements PostRepository {
  readonly backend = "firestore" as const;
  readonly writable = true;

  async listPosts(query: PostQuery = {}): Promise<Paginated<Post>> {
    return applyQuery(await loadAllPosts(), query);
  }

  async getPost(slug: string): Promise<Post | null> {
    const db = await getAdminFirestore();
    const doc = await db.collection(COLLECTION).doc(slug).get();
    if (!doc.exists) return null;
    const { content, ...fields } = doc.data() ?? {};
    return normalizePost(
      doc.id,
      fields,
      typeof content === "string" ? content : "",
    );
  }

  async getSlugs(status: PostStatus | "all"): Promise<string[]> {
    const posts = await loadAllPosts();
    return posts
      .filter((p) => status === "all" || p.status === status)
      .map((p) => p.slug);
  }

  async listCategories(): Promise<Taxonomy[]> {
    return taxonomiesOf(await loadAllPosts(), "category");
  }

  async listTags(): Promise<Taxonomy[]> {
    return taxonomiesOf(await loadAllPosts(), "tags");
  }

  async createPost(input: PostInput): Promise<Post> {
    const db = await getAdminFirestore();
    const ref = db.collection(COLLECTION).doc(input.slug);
    if ((await ref.get()).exists) {
      throw new HttpError(409, `A post with slug "${input.slug}" already exists.`);
    }
    const now = new Date().toISOString();
    await ref.set(this.toDocument(input, { createdAt: now, updatedAt: now }));
    return this.mustGet(input.slug);
  }

  async updatePost(slug: string, input: PostInput): Promise<Post> {
    const db = await getAdminFirestore();
    const existing = await this.getPost(slug);
    if (!existing) throw new Error(`Post "${slug}" not found.`);

    const document = this.toDocument(input, {
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      previousPublishedAt: existing.publishedAt,
    });

    if (input.slug !== slug) {
      // Slug is the document id, so a rename is a transactional move.
      const targetRef = db.collection(COLLECTION).doc(input.slug);
      if ((await targetRef.get()).exists) {
        throw new HttpError(409, `A post with slug "${input.slug}" already exists.`);
      }
      const batch = db.batch();
      batch.set(targetRef, document);
      batch.delete(db.collection(COLLECTION).doc(slug));
      await batch.commit();
    } else {
      await db.collection(COLLECTION).doc(slug).set(document);
    }
    return this.mustGet(input.slug);
  }

  async deletePost(slug: string): Promise<void> {
    const db = await getAdminFirestore();
    await db.collection(COLLECTION).doc(slug).delete();
  }

  private async mustGet(slug: string): Promise<Post> {
    const post = await this.getPost(slug);
    if (!post) throw new Error(`Failed to persist post "${slug}".`);
    return post;
  }

  private toDocument(
    input: PostInput,
    meta: {
      createdAt: string;
      updatedAt: string;
      previousPublishedAt?: string | null;
    },
  ): Record<string, unknown> {
    const publishedAt =
      input.publishedAt !== undefined
        ? input.publishedAt
        : input.status === "published"
          ? (meta.previousPublishedAt ?? meta.updatedAt)
          : (meta.previousPublishedAt ?? null);

    return {
      title: input.title,
      excerpt: input.excerpt,
      content: input.content.trim(),
      status: input.status,
      category: input.category,
      tags: input.tags,
      featuredImage: input.featuredImage,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      publishedAt,
    };
  }
}
