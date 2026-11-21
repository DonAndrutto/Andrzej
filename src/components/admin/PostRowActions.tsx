"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostStatus } from "@/lib/posts/types";

/** Quick actions on a posts-table row: publish/unpublish and delete. */
export function PostRowActions({
  slug,
  status,
  title,
}: {
  slug: string;
  status: PostStatus;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleStatus() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/posts/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "published" ? "draft" : "published",
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        window.alert(data?.error ?? "The status change failed.");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Network error — the status change could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete “${title}”? This removes the post permanently.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/posts/${slug}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        window.alert(data?.error ?? "Deleting failed.");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Network error — deleting failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="row-actions">
      <button type="button" onClick={() => void toggleStatus()} disabled={busy}>
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        className="danger"
        onClick={() => void remove()}
        disabled={busy}
      >
        Delete
      </button>
    </span>
  );
}
