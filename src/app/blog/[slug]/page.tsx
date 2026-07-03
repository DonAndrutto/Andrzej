import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostArticle } from "@/components/blog/PostArticle";
import { PostCard } from "@/components/blog/PostCard";
import { DharmaDivider } from "@/components/site/DharmaDivider";
import { getPostRepository } from "@/lib/posts/repository";
import { relatedPosts } from "@/lib/posts/related";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/seo/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const repo = await getPostRepository();
  const slugs = await repo.getSlugs("published");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const repo = await getPostRepository();
  const post = await repo.getPost(slug);
  if (!post || post.status !== "published") return {};

  const imageUrl = post.featuredImage
    ? post.featuredImage.url.startsWith("http")
      ? post.featuredImage.url
      : absoluteUrl(post.featuredImage.url)
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      siteName: siteConfig.name,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [siteConfig.author],
      section: post.category,
      tags: post.tags,
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

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const repo = await getPostRepository();
  const post = await repo.getPost(slug);
  // Drafts are only visible through the admin preview route.
  if (!post || post.status !== "published") notFound();

  const all = await repo.listPosts({ status: "published", perPage: 9999 });
  const related = relatedPosts(post, all.items, siteConfig.relatedPostsCount);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: siteConfig.blogTitle, path: "/blog" },
    { name: post.title },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(articleJsonLd(post), breadcrumbJsonLd(breadcrumbs)),
        }}
      />

      <Breadcrumbs items={breadcrumbs} />
      <PostArticle post={post} />

      {related.length > 0 && (
        <section className="related-section" aria-label="Related posts">
          <DharmaDivider />
          <p className="section-label">Further Reading</p>
          <div className="post-grid">
            {related.map((relatedPost) => (
              <PostCard key={relatedPost.slug} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
