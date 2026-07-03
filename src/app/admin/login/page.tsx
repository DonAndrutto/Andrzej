import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { resolveAuthMode } from "@/lib/auth/mode";
import { getAdminSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const { mode, problems } = resolveAuthMode();

  return (
    <div className="login-wrap">
      <header className="journal-header" style={{ padding: "3.5rem 0 1.8rem" }}>
        <p className="dharma-mark">Content Management</p>
        <h1 className="journal-title">
          Sign <em>in</em>
        </h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
      </header>

      {problems.length > 0 && (
        <div className="admin-notice notice-error" role="alert">
          {problems.map((problem) => (
            <p key={problem}>{problem}</p>
          ))}
        </div>
      )}

      {mode === "unconfigured" ? (
        <div className="login-panel">
          <p className="login-note">
            The admin dashboard is not enabled on this deployment. Configure
            Firebase Authentication (see <code>.env.example</code>) — or, for
            local development, set <code>ADMIN_DEV_PASSWORD</code> in{" "}
            <code>.env.local</code> and restart.
          </p>
        </div>
      ) : (
        <LoginForm mode={mode} />
      )}
    </div>
  );
}
