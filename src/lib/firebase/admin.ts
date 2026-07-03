import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";

/**
 * Lazy Firebase Admin SDK bootstrap.
 *
 * The SDK is imported dynamically and only when actually requested, so
 * deployments without Firebase (the current filesystem-backed setup) never
 * pay its cold-start cost — and `isFirebaseAdminConfigured()` stays safe to
 * call from anywhere, including module scope.
 *
 * Credentials, in order of precedence:
 *  1. FIREBASE_SERVICE_ACCOUNT — service-account JSON (raw or base64).
 *  2. GOOGLE_APPLICATION_CREDENTIALS — standard ADC key-file path.
 */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

interface ServiceAccountLike {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

function parseServiceAccount(): ServiceAccountLike | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const text = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  try {
    return JSON.parse(text) as ServiceAccountLike;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON (raw or base64-encoded).",
    );
  }
}

let appPromise: Promise<App> | null = null;

export function getAdminApp(): Promise<App> {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps, cert, applicationDefault } = await import(
        "firebase-admin/app"
      );
      const existing = getApps();
      if (existing.length > 0) return existing[0];

      const serviceAccount = parseServiceAccount();
      const projectId =
        serviceAccount?.project_id ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const storageBucket =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
        (projectId ? `${projectId}.firebasestorage.app` : undefined);

      return initializeApp({
        credential: serviceAccount
          ? cert({
              projectId: serviceAccount.project_id,
              clientEmail: serviceAccount.client_email,
              privateKey: serviceAccount.private_key,
            })
          : applicationDefault(),
        projectId,
        storageBucket,
      });
    })();
  }
  return appPromise;
}

export async function getAdminAuth(): Promise<Auth> {
  const [{ getAuth }, app] = await Promise.all([
    import("firebase-admin/auth"),
    getAdminApp(),
  ]);
  return getAuth(app);
}

export async function getAdminFirestore(): Promise<Firestore> {
  const [{ getFirestore }, app] = await Promise.all([
    import("firebase-admin/firestore"),
    getAdminApp(),
  ]);
  return getFirestore(app);
}

export async function getAdminStorage(): Promise<Storage> {
  const [{ getStorage }, app] = await Promise.all([
    import("firebase-admin/storage"),
    getAdminApp(),
  ]);
  return getStorage(app);
}
