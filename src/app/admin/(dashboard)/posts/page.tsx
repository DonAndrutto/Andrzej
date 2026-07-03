import type { Metadata } from "next";
import Link from "next/link";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { formatDate } from "@/lib/format";
import { getPostRepository } from "@/lib/posts/repository";
import type { PostStatus } from "@/lib/posts/types";

export const metadata: Metadata = { title: "Posts" };

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter: PostStatus | "all" =
    params.status === "published" || params.status === "draft"
      ? params.status
      : "all";
  const query = params.q?.trim() ?? "";

  const repo = await getPostRepository();
  const result = await repo.listPosts({
    status: statusFilter,
    search: query || undefined,
    perPage: 200,
  });

  const filterHref = (status: string) =>
    `/admin/posts?${new URLSearchParams({
      ...(status !== "all" ? { status } : {}),
      ...(query ? { q: query } : {}),
    }).toString()}`;

  return (
    <>
      <div className="admin-heading">
        <h1>Posts</h1>
        <Link className="btn btn-primary" href="/admin/posts/new">
          New post
        </Link>
      </div>

      <div className="admin-filters">
        {(
          [
            ["all", "All"],
            ["published", "Published"],
            ["draft", "Drafts"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={filterHref(value)}
            className={`chip${statusFilter === value ? " chip-active" : ""}`}
          >
            {label}
          </Link>
        ))}
        <form className="search-form" action="/admin/posts" role="search">
          {statusFilter !== "all" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            type="search"
            name="q"
            placeholder="Search posts…"
            defaultValue={query}
            aria-label="Search posts"
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <p className="empty-state">
          {query ? "No posts match this search." : "No posts yet."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((post) => (
                <tr key={post.slug}>
                  <td className="post-title-cell">
                    <Link href={`/admin/posts/${post.slug}`}>{post.title}</Link>
                  </td>
                  <td>
                    <span className={`status-pill status-${post.status}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="cell-meta">{post.category}</td>
                  <td className="cell-meta">{formatDate(post.updatedAt)}</td>
                  <td>
                    <span className="row-actions">
                      <Link href={`/admin/posts/${post.slug}`}>Edit</Link>
                      <Link
                        href={
                          post.status === "published"
                            ? `/blog/${post.slug}`
                            : `/admin/preview/${post.slug}`
                        }
                        target="_blank"
                      >
                        View
                      </Link>
                      <PostRowActions
                        slug={post.slug}
                        status={post.status}
                        title={post.title}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
