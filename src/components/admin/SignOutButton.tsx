"use client";

export function SignOutButton() {
  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.assign("/admin/login");
  }
  return (
    <button className="btn" type="button" onClick={() => void signOut()}>
      Sign out
    </button>
  );
}
