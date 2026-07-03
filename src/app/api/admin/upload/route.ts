import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionOrResponse } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http-error";
import {
  ALLOWED_IMAGE_TYPES,
  getImageStorage,
  MAX_IMAGE_BYTES,
} from "@/lib/storage/image-storage";

export const runtime = "nodejs";

/**
 * POST /api/admin/upload — multipart upload of a single image.
 * Fields: `file` (required), `blurDataURL` (optional tiny data URI the editor
 * computes in the browser at upload time — no native image libraries needed
 * server-side).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminSessionOrResponse();
  if (auth instanceof NextResponse) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return NextResponse.json(
      {
        error: `Unsupported image type "${file.type}". Allowed: ${Object.keys(ALLOWED_IMAGE_TYPES).join(", ")}.`,
      },
      { status: 415 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `Image exceeds ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  const blurRaw = form.get("blurDataURL");
  const blurDataURL =
    typeof blurRaw === "string" &&
    blurRaw.startsWith("data:image/") &&
    blurRaw.length <= 8_192
      ? blurRaw
      : undefined;

  const storage = await getImageStorage();
  if (!storage.writable) {
    return NextResponse.json(
      {
        error:
          "Image storage is read-only in this deployment. Configure Firebase Storage to upload images.",
      },
      { status: 501 },
    );
  }

  try {
    const stored = await storage.save({
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      filename: file.name,
    });
    return NextResponse.json({ image: { ...stored, blurDataURL } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to store the image.");
  }
}
