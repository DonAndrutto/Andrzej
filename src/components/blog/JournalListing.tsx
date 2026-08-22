import type { ReactNode } from "react";
import { JournalToolbar } from "@/components/blog/JournalToolbar";
import { Pagination } from "@/components/blog/Pagination";
import { PostCard } from "@/components/blog/PostCard";
import { CornerNav } from "@/components/site/CornerNav";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Post, Taxonomy } from "@/lib/posts/types";

/**
 * Shared shell for every journal listing surface (index, pagination pages,
 * category, tag and search results) so they stay visually identical — in
 * both languages.
 */
export function JournalListing({
  locale,
  path,
  mark,
  title,
  intro,
  posts,
  categories,
  activeCategory,
  query,
  pagination,
  emptyMessage,
}: {
  locale: Locale;
  /** This page's site-relative path in its unprefixed English form. */
  path: string;
  mark?: string;
  title: ReactNode;
  intro?: ReactNode;
  posts: Post[];
  categories: Taxonomy[];
  activeCategory?: string;
  query?: string;
  pagination?: { basePath: string; page: number; totalPages: number };
  emptyMessage?: string;
}) {
  const t = getDictionary(locale);
  return (
    <>
      <CornerNav current="journal" locale={locale} path={path} />

      <header className="journal-header">
        <p className="dharma-mark">{mark ?? t.site.mark}</p>
        <h1 className="journal-title">{title}</h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        {intro && <p className="journal-intro">{intro}</p>}
      </header>

      <JournalToolbar
        locale={locale}
        categories={categories}
        activeCategory={activeCategory}
        query={query}
      />

      {posts.length > 0 ? (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyMessage ?? t.journal.empty}</p>
      )}

      {pagination && <Pagination locale={locale} {...pagination} />}
    </>
  );
}
