import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { getAdminSession } from "@/lib/auth/session";

/**
 * Every page inside this route group is admin-only: the session cookie is
 * verified server-side (Firebase Admin SDK or the dev fallback) before any
 * content renders. /admin/login lives outside the group.
 */
export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <Link className="admin-brand" href="/admin">
          A.&thinsp;R. <em>Rybszleger</em> — Admin
        </Link>
        <nav className="admin-nav" aria-label="Admin">
          <Link href="/admin/posts">Posts</Link>
          <Link href="/admin/posts/new">New post</Link>
          <Link href="/blog" target="_blank">
            View site ↗
          </Link>
          <span className="admin-session">{session.email}</span>
          <SignOutButton />
        </nav>
      </div>
      <main className="admin-main">{children}</main>
    </div>
  );
}
