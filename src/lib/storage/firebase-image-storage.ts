import { randomUUID } from "node:crypto";
import { getAdminStorage } from "@/lib/firebase/admin";
import { detectImageDimensions } from "./image-dimensions";
import type { ImageStorage, StoredImage, UploadFile } from "./image-storage";
import { objectPathFor } from "./local-image-storage";

/**
 * Firebase Storage adapter. Objects are written with a
 * `firebaseStorageDownloadTokens` UUID and served through the stable
 * firebasestorage.googleapis.com download URL — the documented pattern that
 * works regardless of bucket ACL mode and cooperates with storage.rules.
 */
export class FirebaseImageStorage implements ImageStorage {
  readonly backend = "firebase" as const;
  readonly writable = true;

  async save(file: UploadFile): Promise<StoredImage> {
    const storage = await getAdminStorage();
    const bucket = storage.bucket();
    const objectPath = `uploads/${objectPathFor(file)}`;
    const token = randomUUID();

    await bucket.file(objectPath).save(file.buffer, {
      contentType: file.contentType,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const url =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

    const dimensions = detectImageDimensions(file.buffer, file.contentType);
    return { url, path: objectPath, ...dimensions };
  }
}
