import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/**
 * Storage contract for uploaded images — the same pattern as PostRepository:
 * a local filesystem adapter that works with zero configuration, and a
 * Firebase Storage adapter that takes over when Firebase is configured.
 */
export interface UploadFile {
  buffer: Buffer;
  contentType: string;
  /** Original file name; used (slugified) in the stored object name. */
  filename: string;
}

export interface StoredImage {
  /** Publicly reachable URL (site-relative for local, absolute for Firebase). */
  url: string;
  /** Backend-internal object path, stored for future housekeeping. */
  path: string;
  width?: number;
  height?: number;
}

export interface ImageStorage {
  readonly backend: "local" | "firebase";
  readonly writable: boolean;
  save(file: UploadFile): Promise<StoredImage>;
}

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export type ImageBackend = "local" | "firebase";

export function resolveImageBackend(): ImageBackend {
  const explicit = process.env.IMAGE_BACKEND;
  if (explicit === "local" || explicit === "firebase") return explicit;
  return isFirebaseAdminConfigured() ? "firebase" : "local";
}

let storagePromise: Promise<ImageStorage> | null = null;

export function getImageStorage(): Promise<ImageStorage> {
  if (!storagePromise) {
    storagePromise =
      resolveImageBackend() === "firebase"
        ? import("./firebase-image-storage").then(
            (m) => new m.FirebaseImageStorage(),
          )
        : import("./local-image-storage").then(
            (m) => new m.LocalImageStorage(),
          );
  }
  return storagePromise;
}
