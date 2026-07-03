import type { Metadata } from "next";
import { JournalListing } from "@/components/blog/JournalListing";
import { getPostRepository } from "@/lib/posts/repository";
import { siteConfig } from "@/lib/site-config";

/** Search results are query-dependent and rendered on demand. */
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string | string[] }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : q;
  return {
    title: query
      ? `Search: ${query} — ${siteConfig.blogTitle}`
      : `Search — ${siteConfig.blogTitle}`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const repo = await getPostRepository();
  const [result, categories] = await Promise.all([
    query
      ? repo.listPosts({ search: query, perPage: 50 })
      : Promise.resolve(null),
    repo.listCategories(),
  ]);

  return (
    <JournalListing
      mark={`${siteConfig.blogTitle} · Search`}
      title={<em>Search</em>}
      intro={
        query
          ? `${result?.total ?? 0} ${result?.total === 1 ? "result" : "results"} for “${query}”`
          : "Type a word or phrase to search the journal."
      }
      posts={result?.items ?? []}
      categories={categories}
      query={query}
      emptyMessage={
        query ? "Nothing found — try a different phrase." : "Awaiting your search."
      }
    />
  );
}
