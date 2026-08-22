import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JournalListing } from "@/components/blog/JournalListing";
import { localePath, type Locale } from "@/lib/i18n/config";
import { categoryName, getDictionary } from "@/lib/i18n/dictionary";
import { localeAlternates, localeOpenGraph } from "@/lib/i18n/metadata";
import { getPostRepository } from "@/lib/posts/repository";
import { blogJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site-config";

/**
 * Every journal listing surface, written once and rendered by both language
 * editions: the route files under `src/app` only choose a locale and hand
 * over their params.
 */

function JsonLd({ payload }: { payload: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}

/* ── Index ─────────────────────────────────────────────────────────────── */

export function journalMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    title: t.journal.name,
    description: t.journal.description,
    alternates: localeAlternates("/blog", locale),
    openGraph: {
      title: `${t.journal.name} — ${siteConfig.author}`,
      description: t.journal.description,
      type: "website",
      ...localeOpenGraph("/blog", locale),
    },
  };
}

export async function JournalIndexView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const [result, categories] = await Promise.all([
    repo.listPosts({ page: 1, perPage: siteConfig.postsPerPage }),
    repo.listCategories(),
  ]);

  return (
    <>
      <JsonLd
        payload={jsonLdScript(
          blogJsonLd(locale),
          breadcrumbJsonLd(
            [{ name: t.breadcrumb.home, path: "/" }, { name: t.journal.name }],
            locale,
          ),
        )}
      />
      <JournalListing
        locale={locale}
        path="/blog"
        title={t.journal.title}
        intro={t.journal.description}
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

/* ── Pagination pages ──────────────────────────────────────────────────── */

export async function journalPagesStaticParams() {
  const repo = await getPostRepository();
  const { totalPages } = await repo.listPosts({
    perPage: siteConfig.postsPerPage,
  });
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export function journalPageMetadata(locale: Locale, page: string): Metadata {
  const t = getDictionary(locale);
  return {
    title: `${t.journal.name} — ${t.journal.pageLabel(Number(page))}`,
    description: t.journal.description,
    alternates: localeAlternates(`/blog/page/${page}`, locale),
  };
}

export async function JournalPageView({
  locale,
  page: pageParam,
}: {
  locale: Locale;
  page: string;
}) {
  const t = getDictionary(locale);
  const page = Number.parseInt(pageParam, 10);
  if (!Number.isFinite(page) || page < 1 || String(page) !== pageParam) {
    notFound();
  }
  if (page === 1) redirect(localePath("/blog", locale));

  const repo = await getPostRepository();
  const [result, categories] = await Promise.all([
    repo.listPosts({ page, perPage: siteConfig.postsPerPage }),
    repo.listCategories(),
  ]);
  if (page > result.totalPages) notFound();

  return (
    <>
      <JsonLd
        payload={jsonLdScript(
          breadcrumbJsonLd(
            [
              { name: t.breadcrumb.home, path: "/" },
              { name: t.journal.name, path: "/blog" },
              { name: t.journal.pageOf(page, result.totalPages) },
            ],
            locale,
          ),
        )}
      />
      <JournalListing
        locale={locale}
        path={`/blog/page/${page}`}
        title={t.journal.title}
        intro={t.journal.pageOf(page, result.totalPages)}
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

/* ── Category ──────────────────────────────────────────────────────────── */

export async function categoryStaticParams() {
  const repo = await getPostRepository();
  const categories = await repo.listCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function categoryMetadata(
  locale: Locale,
  category: string,
): Promise<Metadata> {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const taxonomy = (await repo.listCategories()).find(
    (c) => c.slug === category,
  );
  if (!taxonomy) return {};
  const name = categoryName(taxonomy.name, locale);
  return {
    title: `${name} — ${t.journal.name}`,
    description: t.journal.inCategory(name),
    alternates: localeAlternates(`/blog/category/${taxonomy.slug}`, locale),
  };
}

export async function CategoryView({
  locale,
  category,
}: {
  locale: Locale;
  category: string;
}) {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const [categories, result] = await Promise.all([
    repo.listCategories(),
    repo.listPosts({ category, perPage: 100 }),
  ]);
  const taxonomy = categories.find((c) => c.slug === category);
  if (!taxonomy) notFound();
  const name = categoryName(taxonomy.name, locale);

  return (
    <>
      <JsonLd
        payload={jsonLdScript(
          breadcrumbJsonLd(
            [
              { name: t.breadcrumb.home, path: "/" },
              { name: t.journal.name, path: "/blog" },
              { name },
            ],
            locale,
          ),
        )}
      />
      <JournalListing
        locale={locale}
        path={`/blog/category/${taxonomy.slug}`}
        mark={t.journal.categoryMark}
        title={<em>{name}</em>}
        intro={t.journal.postsInCategory(result.total)}
        posts={result.items}
        categories={categories}
        activeCategory={taxonomy.slug}
        emptyMessage={t.journal.emptyCategory}
      />
    </>
  );
}

/* ── Tag ───────────────────────────────────────────────────────────────── */

export async function tagStaticParams() {
  const repo = await getPostRepository();
  const tags = await repo.listTags();
  return tags.map((t) => ({ tag: t.slug }));
}

export async function tagMetadata(
  locale: Locale,
  tag: string,
): Promise<Metadata> {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const taxonomy = (await repo.listTags()).find(
    (candidate) => candidate.slug === tag,
  );
  if (!taxonomy) return {};
  return {
    title: `${t.journal.taggedTitle(taxonomy.name)} — ${t.journal.name}`,
    description: t.journal.taggedWith(taxonomy.name),
    alternates: localeAlternates(`/blog/tag/${taxonomy.slug}`, locale),
  };
}

export async function TagView({
  locale,
  tag,
}: {
  locale: Locale;
  tag: string;
}) {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const [tags, categories, result] = await Promise.all([
    repo.listTags(),
    repo.listCategories(),
    repo.listPosts({ tag, perPage: 100 }),
  ]);
  const taxonomy = tags.find((candidate) => candidate.slug === tag);
  if (!taxonomy) notFound();

  return (
    <>
      <JsonLd
        payload={jsonLdScript(
          breadcrumbJsonLd(
            [
              { name: t.breadcrumb.home, path: "/" },
              { name: t.journal.name, path: "/blog" },
              { name: t.journal.taggedTitle(taxonomy.name) },
            ],
            locale,
          ),
        )}
      />
      <JournalListing
        locale={locale}
        path={`/blog/tag/${taxonomy.slug}`}
        mark={t.journal.tagMark}
        title={<em>{taxonomy.name}</em>}
        intro={t.journal.postsWithTag(result.total)}
        posts={result.items}
        categories={categories}
        emptyMessage={t.journal.emptyTag}
      />
    </>
  );
}

/* ── Search ────────────────────────────────────────────────────────────── */

export function searchMetadata(locale: Locale, query?: string): Metadata {
  const t = getDictionary(locale);
  return {
    title: query
      ? `${t.journal.searchTitle(query)} — ${t.journal.name}`
      : `${t.journal.searchHeading} — ${t.journal.name}`,
    alternates: localeAlternates("/blog/search", locale),
    robots: { index: false, follow: true },
  };
}

export async function SearchView({
  locale,
  query,
}: {
  locale: Locale;
  query: string;
}) {
  const t = getDictionary(locale);
  const repo = await getPostRepository();
  const [result, categories] = await Promise.all([
    query
      ? repo.listPosts({ search: query, perPage: 50 })
      : Promise.resolve(null),
    repo.listCategories(),
  ]);

  return (
    <JournalListing
      locale={locale}
      path="/blog/search"
      mark={t.journal.searchMark}
      title={<em>{t.journal.searchHeading}</em>}
      intro={
        query
          ? t.journal.resultsFor(result?.total ?? 0, query)
          : t.journal.searchPrompt
      }
      posts={result?.items ?? []}
      categories={categories}
      query={query}
      emptyMessage={query ? t.journal.searchNothing : t.journal.searchAwaiting}
    />
  );
}
