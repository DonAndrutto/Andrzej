import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalListing } from "@/components/blog/JournalListing";
import { getPostRepository } from "@/lib/posts/repository";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const repo = await getPostRepository();
  const categories = await repo.listCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const repo = await getPostRepository();
  const taxonomy = (await repo.listCategories()).find(
    (c) => c.slug === category,
  );
  if (!taxonomy) return {};
  return {
    title: `${taxonomy.name} — ${siteConfig.blogTitle}`,
    description: `Journal posts in the ${taxonomy.name} category.`,
    alternates: { canonical: `/blog/category/${taxonomy.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const repo = await getPostRepository();
  const [categories, result] = await Promise.all([
    repo.listCategories(),
    repo.listPosts({ category, perPage: 100 }),
  ]);
  const taxonomy = categories.find((c) => c.slug === category);
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
              { name: taxonomy.name },
            ]),
          ),
        }}
      />
      <JournalListing
        mark={`${siteConfig.blogTitle} · Category`}
        title={<em>{taxonomy.name}</em>}
        intro={`${result.total} ${result.total === 1 ? "post" : "posts"} in this category.`}
        posts={result.items}
        categories={categories}
        activeCategory={taxonomy.slug}
        emptyMessage="No posts in this category yet."
      />
    </>
  );
}
