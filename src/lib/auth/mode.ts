import "server-only";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseAuthClientConfigured } from "@/lib/firebase/client";
import { allowedAdminEmails, isDevPasswordAuthEnabled } from "./session";

export type AuthMode = "firebase" | "dev-password" | "unconfigured";

export interface AuthModeInfo {
  mode: AuthMode;
  /** Setup problems worth surfacing to the site owner on the login screen. */
  problems: string[];
}

/** Which sign-in mechanism this deployment offers, plus setup diagnostics. */
export function resolveAuthMode(): AuthModeInfo {
  const clientReady = isFirebaseAuthClientConfigured();
  const adminReady = isFirebaseAdminConfigured();
  const problems: string[] = [];

  if (clientReady && adminReady) {
    if (allowedAdminEmails().length === 0) {
      problems.push(
        "ADMIN_ALLOWED_EMAILS is empty — no account can pass the admin allowlist until it is set.",
      );
    }
    return { mode: "firebase", problems };
  }

  if (clientReady && !adminReady) {
    problems.push(
      "Firebase client keys are set but FIREBASE_SERVICE_ACCOUNT is missing — the server cannot verify sign-ins.",
    );
  }
  if (!clientReady && adminReady) {
    problems.push(
      "FIREBASE_SERVICE_ACCOUNT is set but the NEXT_PUBLIC_FIREBASE_* client keys are missing — the sign-in form cannot start.",
    );
  }

  if (isDevPasswordAuthEnabled()) {
    return { mode: "dev-password", problems };
  }

  if (!process.env.ADMIN_DEV_PASSWORD && !clientReady && !adminReady) {
    problems.push(
      "No authentication is configured. Set the Firebase environment variables (see .env.example), or set ADMIN_DEV_PASSWORD for local development.",
    );
  }
  return { mode: "unconfigured", problems };
}
