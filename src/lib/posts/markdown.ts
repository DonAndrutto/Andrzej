import sanitizeHtml from "sanitize-html";
import { createConfiguredMarked } from "./marked-config";

/**
 * Server-side markdown → sanitised HTML pipeline, shared by the public post
 * pages and the RSS feed. The admin live preview uses the same marked
 * configuration (marked-config.ts) in the browser, so what the author sees
 * is what readers get.
 */
const marked = createConfiguredMarked();

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "figure",
    "figcaption",
    "details",
    "summary",
    "ins",
    "del",
    "sup",
    "sub",
    "h1",
    "h2",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["id"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    code: ["class"],
    pre: ["class"],
    td: ["align"],
    th: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Relative URLs (e.g. /uploads/…) must survive sanitisation.
  allowProtocolRelative: false,
};

/** Render trusted-author markdown to sanitised HTML (server-side). */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown) as string;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

const MARKDOWN_IMAGE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

/**
 * First image referenced in the markdown source, as a display-only fallback
 * thumbnail for posts that have no explicit featured image (e.g. an author
 * inserted an inline image via the editor toolbar without also setting a
 * featured image). Never persisted — computed at render time only, so it
 * never masks an author's deliberate "no featured image".
 */
export function firstMarkdownImage(
  markdown: string,
): { url: string; alt: string } | null {
  const match = MARKDOWN_IMAGE.exec(markdown);
  if (!match) return null;
  const [, alt, url] = match;
  if (url.startsWith("//")) return null;
  if (!url.startsWith("/")) {
    try {
      if (!["http:", "https:"].includes(new URL(url).protocol)) return null;
    } catch {
      return null;
    }
  }
  return { url, alt: alt.trim() };
}
