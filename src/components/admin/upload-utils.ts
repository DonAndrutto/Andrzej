import type { PostImage } from "@/lib/posts/types";

/**
 * Tiny blur placeholder, computed in the author's browser at upload time:
 * downscale to ≤16px and re-encode as a small JPEG data URI. Stored alongside
 * the image so next/image can blur-in without any server-side image library.
 */
export async function computeBlurDataURL(file: File): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = 16 / Math.max(bitmap.width, bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    return dataUrl.length <= 8_192 ? dataUrl : undefined;
  } catch {
    return undefined;
  }
}

/** Upload an image through the admin API; returns a ready-to-use PostImage. */
export async function uploadImage(file: File): Promise<PostImage> {
  const blurDataURL = await computeBlurDataURL(file);
  const form = new FormData();
  form.append("file", file);
  if (blurDataURL) form.append("blurDataURL", blurDataURL);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: form,
  });
  const data = (await response.json().catch(() => null)) as {
    image?: PostImage & { path: string };
    error?: string;
  } | null;
  if (!response.ok || !data?.image) {
    throw new Error(data?.error ?? "Image upload failed.");
  }
  return {
    url: data.image.url,
    alt: "",
    width: data.image.width,
    height: data.image.height,
    blurDataURL: data.image.blurDataURL,
  };
}
