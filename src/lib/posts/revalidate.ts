import { revalidatePath } from "next/cache";
import type { Post } from "./types";

/**
 * Invalidate every statically generated surface a content mutation can
 * affect. Called by the admin mutation routes so publishes appear instantly
 * despite the public site being fully static/ISR.
 */
export function revalidatePostSurfaces(...posts: (Post | null)[]): void {
  revalidatePath("/blog");
  revalidatePath("/blog/page/[page]", "page");
  revalidatePath("/blog/category/[category]", "page");
  revalidatePath("/blog/tag/[tag]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  for (const post of posts) {
    if (post) revalidatePath(`/blog/${post.slug}`);
  }
}
