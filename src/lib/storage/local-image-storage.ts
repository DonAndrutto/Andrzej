import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { slugify } from "@/lib/posts/slug";
import { detectImageDimensions } from "./image-dimensions";
import {
  ALLOWED_IMAGE_TYPES,
  type ImageStorage,
  type StoredImage,
  type UploadFile,
} from "./image-storage";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Local adapter: images land in public/uploads/<year>/<month>/ and are
 * committed to git alongside the markdown content. Read-only on serverless
 * hosts, where Firebase Storage takes over.
 */
export class LocalImageStorage implements ImageStorage {
  readonly backend = "local" as const;

  get writable(): boolean {
    return !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
  }

  async save(file: UploadFile): Promise<StoredImage> {
    if (!this.writable) {
      throw new Error(
        "Local image storage is read-only in this deployment. Configure Firebase Storage to upload images in production.",
      );
    }

    const relativePath = objectPathFor(file);
    const absolutePath = path.join(UPLOADS_DIR, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    const dimensions = detectImageDimensions(file.buffer, file.contentType);
    return {
      url: `/uploads/${relativePath}`,
      path: `uploads/${relativePath}`,
      ...dimensions,
    };
  }
}

/** `<year>/<month>/<name>-<random>.<ext>` — stable, collision-free, readable. */
export function objectPathFor(file: UploadFile): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = ALLOWED_IMAGE_TYPES[file.contentType] ?? "bin";
  const base =
    slugify(file.filename.replace(/\.[a-z0-9]+$/i, "")) || "image";
  const suffix = randomBytes(4).toString("hex");
  return `${year}/${month}/${base}-${suffix}.${ext}`;
}
