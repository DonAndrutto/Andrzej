import { revalidatePath } from "next/cache";
import { localePath, locales } from "@/lib/i18n/config";
import type { Post } from "./types";

/**
 * Invalidate every statically generated surface a content mutation can
 * affect across all language editions. Called by the admin mutation routes
 * so publishes appear instantly despite the public site being static/ISR.
 */
export function revalidatePostSurfaces(...posts: (Post | null)[]): void {
  for (const locale of locales) {
    revalidatePath(localePath("/blog", locale));
    revalidatePath(localePath("/blog/page/[page]", locale), "page");
    revalidatePath(localePath("/blog/category/[category]", locale), "page");
    revalidatePath(localePath("/blog/tag/[tag]", locale), "page");
    for (const post of posts) {
      if (post) revalidatePath(localePath(`/blog/${post.slug}`, locale));
    }
  }
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}
