import type { MetadataRoute } from "next";
import { localePath, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getPostRepository } from "@/lib/posts/repository";
import { absoluteUrl } from "@/lib/site-config";

export const revalidate = 300;

/** One entry per page, written once and emitted for every language edition. */
interface SitemapPage {
  path: string;
  lastModified?: Date;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = await getPostRepository();
  const [posts, categories, tags] = await Promise.all([
    repo.listPosts({ status: "published", perPage: 9999 }),
    repo.listCategories(),
    repo.listTags(),
  ]);

  const newestPost = posts.items[0];
  const blogLastModified = newestPost
    ? new Date(newestPost.updatedAt)
    : new Date();

  const pages: SitemapPage[] = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    {
      path: "/blog",
      lastModified: blogLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...posts.items.map((post) => ({
      path: `/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      path: `/blog/category/${category.slug}`,
      lastModified: blogLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...tags.map((tag) => ({
      path: `/blog/tag/${tag.slug}`,
      lastModified: blogLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];

  // Every entry carries the `hreflang` map of its siblings, so the two
  // editions of a page are indexed as translations rather than duplicates.
  return pages.flatMap((page) => {
    const languages = Object.fromEntries(
      locales.map((locale) => [
        getDictionary(locale).htmlLang,
        absoluteUrl(localePath(page.path, locale)),
      ]),
    );
    return locales.map((locale) => ({
      url: absoluteUrl(localePath(page.path, locale)),
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
