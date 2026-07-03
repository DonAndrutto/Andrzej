import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
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

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/**
 * Filesystem backend: one markdown file per post in content/posts/, with the
 * post's fields as YAML frontmatter — the same shape as a Firestore document.
 *
 * This is the zero-configuration backend: readable everywhere (files are
 * bundled at build time), writable in local development where the admin
 * dashboard commits changes straight to the working tree — a git-based CMS.
 * On serverless hosts the filesystem is read-only, so `writable` is false
 * and the admin UI directs the owner to configure Firestore.
 */
export class FsPostRepository implements PostRepository {
  readonly backend = "fs" as const;

  get writable(): boolean {
    // Vercel/AWS Lambda expose a read-only bundle; local dev/self-hosting don't.
    return !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
  }

  private cache: Post[] | null = null;

  private async loadAll(): Promise<Post[]> {
    // Cache per server process in production; in development re-read every
    // time so posts edited by hand appear without a restart.
    if (this.cache && process.env.NODE_ENV === "production") return this.cache;

    let files: string[] = [];
    try {
      files = await fs.readdir(POSTS_DIR);
    } catch {
      return [];
    }

    const posts = await Promise.all(
      files
        .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
        .map(async (file) => {
          const raw = await fs.readFile(path.join(POSTS_DIR, file), "utf8");
          const { data, content } = matter(raw);
          const slug = file.replace(/\.mdx?$/, "");
          return normalizePost(slug, data, content.trim());
        }),
    );

    this.cache = sortPosts(posts);
    return this.cache;
  }

  private bust(): void {
    this.cache = null;
  }

  async listPosts(query: PostQuery = {}): Promise<Paginated<Post>> {
    return applyQuery(await this.loadAll(), query);
  }

  async getPost(slug: string): Promise<Post | null> {
    const posts = await this.loadAll();
    return posts.find((p) => p.slug === slug) ?? null;
  }

  async getSlugs(status: PostStatus | "all"): Promise<string[]> {
    const posts = await this.loadAll();
    return posts
      .filter((p) => status === "all" || p.status === status)
      .map((p) => p.slug);
  }

  async listCategories(): Promise<Taxonomy[]> {
    return taxonomiesOf(await this.loadAll(), "category");
  }

  async listTags(): Promise<Taxonomy[]> {
    return taxonomiesOf(await this.loadAll(), "tags");
  }

  async createPost(input: PostInput): Promise<Post> {
    if (await this.getPost(input.slug)) {
      throw new HttpError(409, `A post with slug "${input.slug}" already exists.`);
    }
    const now = new Date().toISOString();
    return this.write(input, { createdAt: now, updatedAt: now });
  }

  async updatePost(slug: string, input: PostInput): Promise<Post> {
    const existing = await this.getPost(slug);
    if (!existing) throw new Error(`Post "${slug}" not found.`);
    if (input.slug !== slug && (await this.getPost(input.slug))) {
      throw new HttpError(409, `A post with slug "${input.slug}" already exists.`);
    }

    const post = await this.write(input, {
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      previousPublishedAt: existing.publishedAt,
    });

    if (input.slug !== slug) {
      await fs.unlink(this.fileFor(slug));
      this.bust();
    }
    return post;
  }

  async deletePost(slug: string): Promise<void> {
    await fs.unlink(this.fileFor(slug));
    this.bust();
  }

  private fileFor(slug: string): string {
    // Slugs are validated upstream, but never allow path traversal.
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid slug "${slug}".`);
    return path.join(POSTS_DIR, `${slug}.md`);
  }

  private async write(
    input: PostInput,
    meta: {
      createdAt: string;
      updatedAt: string;
      previousPublishedAt?: string | null;
    },
  ): Promise<Post> {
    if (!this.writable) {
      throw new Error(
        "The filesystem content backend is read-only in this deployment. Configure Firestore to edit content in production.",
      );
    }

    const publishedAt =
      input.publishedAt !== undefined
        ? input.publishedAt
        : input.status === "published"
          ? (meta.previousPublishedAt ?? meta.updatedAt)
          : (meta.previousPublishedAt ?? null);

    const frontmatter: Record<string, unknown> = {
      title: input.title,
      excerpt: input.excerpt,
      status: input.status,
      category: input.category,
      tags: input.tags,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      ...(publishedAt ? { publishedAt } : {}),
      ...(input.featuredImage ? { featuredImage: input.featuredImage } : {}),
    };

    await fs.mkdir(POSTS_DIR, { recursive: true });
    const serialized = matter.stringify(`${input.content.trim()}\n`, frontmatter);
    await fs.writeFile(this.fileFor(input.slug), serialized, "utf8");
    this.bust();

    const post = await this.getPost(input.slug);
    if (!post) throw new Error(`Failed to persist post "${input.slug}".`);
    return post;
  }
}
