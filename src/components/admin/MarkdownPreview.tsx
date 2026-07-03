"use client";

import { useMemo } from "react";
import { createConfiguredMarked } from "@/lib/posts/marked-config";

const marked = createConfiguredMarked();

/**
 * Client-side render of the author's markdown with the same marked
 * configuration the server uses, so the preview matches the published page.
 * (Sanitisation happens in the server pipeline at publish/render time; here
 * the author is previewing their own content in their own browser.)
 */
export function MarkdownPreview({ markdown }: { markdown: string }) {
  const html = useMemo(() => marked.parse(markdown) as string, [markdown]);
  return <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
