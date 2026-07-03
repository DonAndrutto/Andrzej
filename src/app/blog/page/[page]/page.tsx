import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JournalListing } from "@/components/blog/JournalListing";
import { getPostRepository } from "@/lib/posts/repository";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

interface Props {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
  const repo = await getPostRepository();
  const { totalPages } = await repo.listPosts({
    perPage: siteConfig.postsPerPage,
  });
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `${siteConfig.blogTitle} — page ${page}`,
    description: siteConfig.blogDescription,
    alternates: { canonical: `/blog/page/${page}` },
  };
}

export default async function BlogPagePage({ params }: Props) {
  const { page: pageParam } = await params;
  const page = Number.parseInt(pageParam, 10);
  if (!Number.isFinite(page) || page < 1 || String(page) !== pageParam) {
    notFound();
  }
  if (page === 1) redirect("/blog");

  const repo = await getPostRepository();
  const [result, categories] = await Promise.all([
    repo.listPosts({ page, perPage: siteConfig.postsPerPage }),
    repo.listCategories(),
  ]);
  if (page > result.totalPages) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: siteConfig.blogTitle, path: "/blog" },
              { name: `Page ${page}` },
            ]),
          ),
        }}
      />
      <JournalListing
        title={
          <>
            The <em>Journal</em>
          </>
        }
        intro={`Page ${page} of ${result.totalPages}`}
        posts={result.items}
        categories={categories}
        pagination={{
          basePath: "/blog",
          page: result.page,
          totalPages: result.totalPages,
        }}
      />
    </>
  );
}
