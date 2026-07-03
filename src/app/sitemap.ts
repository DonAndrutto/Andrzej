import type { MetadataRoute } from "next";
import { getPostRepository } from "@/lib/posts/repository";
import { absoluteUrl } from "@/lib/site-config";

export const revalidate = 300;

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

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: blogLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...posts.items.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/blog/category/${category.slug}`),
      lastModified: blogLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...tags.map((tag) => ({
      url: absoluteUrl(`/blog/tag/${tag.slug}`),
      lastModified: blogLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
