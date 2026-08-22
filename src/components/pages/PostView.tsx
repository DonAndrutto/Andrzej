import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostArticle } from "@/components/blog/PostArticle";
import { PostCard } from "@/components/blog/PostCard";
import { CornerNav } from "@/components/site/CornerNav";
import { DharmaDivider } from "@/components/site/DharmaDivider";
import type { Locale } from "@/lib/i18n/config";
import { categoryName, getDictionary } from "@/lib/i18n/dictionary";
import { localeAlternates, localeOpenGraph } from "@/lib/i18n/metadata";
import { relatedPosts } from "@/lib/posts/related";
import { getPostRepository } from "@/lib/posts/repository";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/seo/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

/**
 * A published post. Post bodies are served as written — the translations
 * here are the chrome around them (category, dates, reading time, related
 * posts), so a Polish reader keeps a Polish frame around an English text
 * rather than being bounced back to the English site.
 */
export async function postStaticParams() {
  const repo = await getPostRepository();
  const slugs = await repo.getSlugs("published");
  return slugs.map((slug) => ({ slug }));
}

export async function postMetadata(
  locale: Locale,
  slug: string,
): Promise<Metadata> {
  const repo = await getPostRepository();
  const post = await repo.getPost(slug);
  if (!post || post.status !== "published") return {};

  const path = `/blog/${post.slug}`;
  const imageUrl = post.featuredImage
    ? post.featuredImage.url.startsWith("http")
      ? post.featuredImage.url
      : absoluteUrl(post.featuredImage.url)
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: localeAlternates(path, locale),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [siteConfig.author],
      section: categoryName(post.category, locale),
      tags: post.tags,
      ...localeOpenGraph(path, locale),
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                width: post.featuredImage?.width,
                height: post.featuredImage?.height,
                alt: post.featuredImage?.alt,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export async function PostView({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const post = await repo.getPost(slug);
  // Drafts are only visible through the admin preview route.
  if (!post || post.status !== "published") notFound();

  const all = await repo.listPosts({ status: "published", perPage: 9999 });
  const related = relatedPosts(post, all.items, siteConfig.relatedPostsCount);

  const breadcrumbs = [
    { name: t.breadcrumb.home, path: "/" },
    { name: t.journal.name, path: "/blog" },
    { name: post.title },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            articleJsonLd(post, locale),
            breadcrumbJsonLd(breadcrumbs, locale),
          ),
        }}
      />

      <CornerNav current="journal" locale={locale} path={`/blog/${post.slug}`} />
      <Breadcrumbs items={breadcrumbs} locale={locale} />
      <PostArticle post={post} locale={locale} />

      {related.length > 0 && (
        <section className="related-section" aria-label={t.journal.furtherReading}>
          <DharmaDivider />
          <h2 className="section-label">{t.journal.furtherReading}</h2>
          <div className="post-grid">
            {related.map((relatedPost) => (
              <PostCard
                key={relatedPost.slug}
                post={relatedPost}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
