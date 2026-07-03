import type { Metadata } from "next";
import { JournalListing } from "@/components/blog/JournalListing";
import { getPostRepository } from "@/lib/posts/repository";
import { blogJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: siteConfig.blogTitle,
  description: siteConfig.blogDescription,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${siteConfig.blogTitle} — ${siteConfig.author}`,
    description: siteConfig.blogDescription,
    url: "/blog",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  const repo = await getPostRepository();
  const [result, categories] = await Promise.all([
    repo.listPosts({ page: 1, perPage: siteConfig.postsPerPage }),
    repo.listCategories(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            blogJsonLd(),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: siteConfig.blogTitle },
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
        intro={siteConfig.blogDescription}
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
