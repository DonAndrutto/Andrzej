import type { Metadata } from "next";
import Link from "next/link";
import { resolveAuthMode } from "@/lib/auth/mode";
import { formatDate } from "@/lib/format";
import { getPostRepository } from "@/lib/posts/repository";
import { resolveImageBackend } from "@/lib/storage/image-storage";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const repo = await getPostRepository();
  const [all, categories, tags] = await Promise.all([
    repo.listPosts({ status: "all", perPage: 9999 }),
    repo.listCategories(),
    repo.listTags(),
  ]);
  const published = all.items.filter((p) => p.status === "published");
  const drafts = all.items.filter((p) => p.status === "draft");
  const recent = all.items.slice(0, 5);
  const { mode } = resolveAuthMode();

  return (
    <>
      <div className="admin-heading">
        <h1>Dashboard</h1>
        <Link className="btn btn-primary" href="/admin/posts/new">
          Write a post
        </Link>
      </div>

      {!repo.writable && (
        <div className="admin-notice notice-error" role="alert">
          <strong>Content is read-only in this deployment.</strong> The
          filesystem backend cannot be written on serverless hosting. Configure
          Firestore (see <code>.env.example</code>) to enable publishing from
          this dashboard — or edit locally, where changes are saved to{" "}
          <code>content/posts/</code> and committed with git.
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{published.length}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{drafts.length}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{categories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tags.length}</div>
          <div className="stat-label">Tags</div>
        </div>
      </div>

      <div className="admin-panel">
        <p className="panel-label">Recent activity</p>
        {recent.length === 0 ? (
          <p className="field-hint" style={{ fontStyle: "italic" }}>
            No posts yet — start with your first one.
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
                </tr>
              </thead>
              <tbody>
                {recent.map((post) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <p className="panel-label">System</p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              <tr>
                <td className="cell-meta">Content backend</td>
                <td>
                  {repo.backend === "firestore"
                    ? "Firestore"
                    : "Filesystem (content/posts/*.md)"}
                  {repo.writable ? " — writable" : " — read-only"}
                </td>
              </tr>
              <tr>
                <td className="cell-meta">Image storage</td>
                <td>
                  {resolveImageBackend() === "firebase"
                    ? "Firebase Storage"
                    : "Local (public/uploads/)"}
                </td>
              </tr>
              <tr>
                <td className="cell-meta">Authentication</td>
                <td>
                  {mode === "firebase"
                    ? "Firebase Authentication"
                    : "Development password (configure Firebase before deploying)"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
