import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalListing } from "@/components/blog/JournalListing";
import { getPostRepository } from "@/lib/posts/repository";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const repo = await getPostRepository();
  const tags = await repo.listTags();
  return tags.map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const repo = await getPostRepository();
  const taxonomy = (await repo.listTags()).find((t) => t.slug === tag);
  if (!taxonomy) return {};
  return {
    title: `Tagged “${taxonomy.name}” — ${siteConfig.blogTitle}`,
    description: `Journal posts tagged ${taxonomy.name}.`,
    alternates: { canonical: `/blog/tag/${taxonomy.slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const repo = await getPostRepository();
  const [tags, categories, result] = await Promise.all([
    repo.listTags(),
    repo.listCategories(),
    repo.listPosts({ tag, perPage: 100 }),
  ]);
  const taxonomy = tags.find((t) => t.slug === tag);
  if (!taxonomy) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: siteConfig.blogTitle, path: "/blog" },
              { name: `Tag: ${taxonomy.name}` },
            ]),
          ),
        }}
      />
      <JournalListing
        mark={`${siteConfig.blogTitle} · Tag`}
        title={<em>{taxonomy.name}</em>}
        intro={`${result.total} ${result.total === 1 ? "post" : "posts"} with this tag.`}
        posts={result.items}
        categories={categories}
        emptyMessage="No posts with this tag yet."
      />
    </>
  );
}
