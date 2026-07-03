"use client";

import { useState } from "react";
import { getFirebaseClientConfig } from "@/lib/firebase/client";

/**
 * Admin sign-in.
 *
 * Firebase mode: authenticate in the browser (email/password or Google),
 * exchange the fresh ID token for an httpOnly session cookie at
 * /api/auth/session, then drop the client-side Firebase session — the cookie
 * is the single source of truth. The Firebase SDK is imported dynamically on
 * first use so it never weighs down the page load.
 *
 * Dev-password mode: a single password field for Firebase-less local work.
 */
export function LoginForm({ mode }: { mode: "firebase" | "dev-password" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function establishSession(body: { idToken?: string; password?: string }) {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(data?.error ?? "Sign-in failed. Please try again.");
    }
    window.location.assign("/admin");
  }

  async function firebaseSignIn(kind: "password" | "google") {
    const config = getFirebaseClientConfig();
    if (!config) {
      setError("Firebase client configuration is missing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const [{ initializeApp, getApps }, authModule] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
      ]);
      const app = getApps()[0] ?? initializeApp(config);
      const auth = authModule.getAuth(app);

      const credential =
        kind === "password"
          ? await authModule.signInWithEmailAndPassword(auth, email, password)
          : await authModule.signInWithPopup(
              auth,
              new authModule.GoogleAuthProvider(),
            );

      const idToken = await credential.user.getIdToken();
      // The session cookie takes over; drop the client-side session.
      await authModule.signOut(auth).catch(() => undefined);
      await establishSession({ idToken });
    } catch (err) {
      setError(humanizeFirebaseError(err));
      setBusy(false);
    }
  }

  async function devSignIn() {
    setBusy(true);
    setError(null);
    try {
      await establishSession({ password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  if (mode === "dev-password") {
    return (
      <div className="login-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void devSignIn();
          }}
        >
          <div className="field">
            <label htmlFor="dev-password">Development password</label>
            <input
              id="dev-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div className="admin-notice notice-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="login-note">
          Firebase Authentication is not configured — this deployment is using
          the local development password.
        </p>
      </div>
    );
  }

  return (
    <div className="login-panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void firebaseSignIn("password");
        }}
      >
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <div className="admin-notice notice-error" role="alert">
            {error}
          </div>
        )}
        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
      <div className="login-divider">or</div>
      <button
        className="btn"
        type="button"
        disabled={busy}
        onClick={() => void firebaseSignIn("google")}
        style={{ width: "100%" }}
      >
        Continue with Google
      </button>
      <p className="login-note">
        Only accounts on the admin allowlist can manage content.
      </p>
    </div>
  );
}

function humanizeFirebaseError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "The sign-in window was closed before completing.";
    default:
      return err instanceof Error ? err.message : "Sign-in failed.";
  }
}
