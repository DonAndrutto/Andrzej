"use client";

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/posts/markdown";

/**
 * Client-side preview using the exact same render pipeline (marked config +
 * sanitisation) as the published page, so preview never shows markup that
 * publishing would strip, and pasted/typed script can't execute unsanitised.
 */
export function MarkdownPreview({ markdown }: { markdown: string }) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  return <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
