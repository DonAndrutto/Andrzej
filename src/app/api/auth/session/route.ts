import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuth,
  isFirebaseAdminConfigured,
} from "@/lib/firebase/admin";
import {
  isDevPasswordAuthEnabled,
  isEmailAllowed,
  mintDevToken,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  verifyDevPassword,
} from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * POST — establish an admin session.
 *   { idToken }  Firebase flow: verify the freshly-minted ID token, check the
 *                admin allowlist, exchange it for a Firebase session cookie.
 *   { password } Development fallback (only while enabled): verify the dev
 *                password and set an HMAC-signed cookie.
 * DELETE — sign out.
 */
export async function POST(request: NextRequest) {
  let body: { idToken?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.idToken === "string") {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured on the server." },
        { status: 501 },
      );
    }
    try {
      const auth = await getAdminAuth();
      const decoded = await auth.verifyIdToken(body.idToken, true);

      if (!isEmailAllowed(decoded.email)) {
        return NextResponse.json(
          {
            error:
              "This account is not on the admin allowlist (ADMIN_ALLOWED_EMAILS).",
          },
          { status: 403 },
        );
      }
      // Only exchange tokens from a fresh interactive sign-in.
      if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
        return NextResponse.json(
          { error: "Sign-in too old — please sign in again." },
          { status: 401 },
        );
      }

      const sessionCookie = await auth.createSessionCookie(body.idToken, {
        expiresIn: SESSION_DURATION_MS,
      });
      return respondWithSession(sessionCookie);
    } catch {
      return NextResponse.json(
        { error: "Could not verify the sign-in. Please try again." },
        { status: 401 },
      );
    }
  }

  if (typeof body.password === "string") {
    if (!isDevPasswordAuthEnabled()) {
      return NextResponse.json(
        { error: "Password sign-in is not enabled on this deployment." },
        { status: 403 },
      );
    }
    if (!verifyDevPassword(body.password)) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    return respondWithSession(mintDevToken());
  }

  return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function respondWithSession(token: string) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
  return response;
}
