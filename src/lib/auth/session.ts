import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/**
 * Admin session management.
 *
 * Production path (Firebase configured):
 *   The browser signs in with Firebase Authentication, sends the ID token to
 *   POST /api/auth/session, and the server mints a long-lived Firebase
 *   *session cookie* (httpOnly, Secure). Every admin page and mutation
 *   verifies that cookie with the Admin SDK and checks the email against the
 *   ADMIN_ALLOWED_EMAILS allowlist — possessing a Firebase account is not the
 *   same as being an administrator.
 *
 * Development fallback (no Firebase):
 *   With ADMIN_DEV_PASSWORD set, the login form accepts that password and the
 *   server issues an HMAC-signed cookie. Disabled in production builds unless
 *   explicitly forced, so it can never become an accidental backdoor.
 */

/** `__session` is the only cookie Firebase Hosting forwards; use it everywhere. */
export const SESSION_COOKIE = "__session";
export const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface AdminSession {
  email: string;
  name?: string;
  via: "firebase" | "dev-password";
}

// ── Allowlist ────────────────────────────────────────────────────────────────

export function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Fail closed: with no allowlist configured, nobody is an admin. */
export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return allowedAdminEmails().includes(email.toLowerCase());
}

// ── Development fallback ─────────────────────────────────────────────────────

export function isDevPasswordAuthEnabled(): boolean {
  if (!process.env.ADMIN_DEV_PASSWORD) return false;
  if (isFirebaseAdminConfigured()) return false; // real auth wins
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ADMIN_DEV_PASSWORD_ALLOW_PRODUCTION === "true"
  );
}

function devTokenKey(): Buffer {
  return createHmac("sha256", "arybszleger-dev-session")
    .update(process.env.ADMIN_DEV_PASSWORD ?? "")
    .digest();
}

export function mintDevToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `dev.${expiresAt}`;
  const signature = createHmac("sha256", devTokenKey())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyDevToken(token: string): AdminSession | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "dev") return null;
  const [prefix, expiresAt, signature] = parts;
  const expected = createHmac("sha256", devTokenKey())
    .update(`${prefix}.${expiresAt}`)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expiresAt) < Date.now()) return null;
  return { email: "dev-admin@localhost", name: "Site owner (dev)", via: "dev-password" };
}

export function verifyDevPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_DEV_PASSWORD ?? "";
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return expected.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

// ── Verification ─────────────────────────────────────────────────────────────

/**
 * The current admin session, or null. Reads cookies, so any page calling it
 * renders dynamically — that is confined to /admin and mutation routes;
 * public pages never call this.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  if (token.startsWith("dev.")) {
    return isDevPasswordAuthEnabled() ? verifyDevToken(token) : null;
  }

  if (!isFirebaseAdminConfigured()) return null;
  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifySessionCookie(token, true);
    if (!isEmailAllowed(decoded.email)) return null;
    return {
      email: decoded.email ?? "",
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      via: "firebase",
    };
  } catch {
    return null;
  }
}

/** Guard for mutation routes: session or a 401-shaped error. */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const error = new Error("Not authenticated.") as Error & { status: number };
    error.status = 401;
    throw error;
  }
  return session;
}
