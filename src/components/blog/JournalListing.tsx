import type { ReactNode } from "react";
import { JournalToolbar } from "@/components/blog/JournalToolbar";
import { Pagination } from "@/components/blog/Pagination";
import { PostCard } from "@/components/blog/PostCard";
import type { Post, Taxonomy } from "@/lib/posts/types";

/**
 * Shared shell for every journal listing surface (index, pagination pages,
 * category, tag and search results) so they stay visually identical.
 */
export function JournalListing({
  mark = "Tibetan Buddhist Translations",
  title,
  intro,
  posts,
  categories,
  activeCategory,
  query,
  pagination,
  emptyMessage = "Nothing here yet — new notes are on their way.",
}: {
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
  return (
    <>
      <header className="journal-header">
        <p className="dharma-mark">{mark}</p>
        <h1 className="journal-title">{title}</h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        {intro && <p className="journal-intro">{intro}</p>}
      </header>

      <JournalToolbar
        categories={categories}
        activeCategory={activeCategory}
        query={query}
      />

      {posts.length > 0 ? (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyMessage}</p>
      )}

      {pagination && <Pagination {...pagination} />}
    </>
  );
}
