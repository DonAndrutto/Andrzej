import { Marked, type Tokens } from "marked";
import { slugify } from "./slug";

/**
 * Shared `marked` configuration — used server-side (with sanitisation, see
 * markdown.ts) and client-side by the admin live preview, so the preview and
 * the published page render markdown identically.
 */
export function createConfiguredMarked(): Marked {
  const instance = new Marked({ gfm: true, breaks: false, async: false });

  instance.use({
    renderer: {
      // Headings get stable ids so posts can deep-link to sections.
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        const id = slugify(text.replace(/<[^>]+>/g, ""));
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      // Inline images are lazy; the featured image (next/image, priority)
      // is the LCP candidate, not these.
      image({ href, title, text }: Tokens.Image) {
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
        return `<img src="${escapeAttr(href ?? "")}" alt="${escapeAttr(text ?? "")}"${titleAttr} loading="lazy" decoding="async" />`;
      },
      // External links open in a new tab without leaking the opener.
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
        const external = /^https?:\/\//.test(href ?? "");
        const rel = external ? ` target="_blank" rel="noopener noreferrer"` : "";
        return `<a href="${escapeAttr(href ?? "")}"${titleAttr}${rel}>${text}</a>`;
      },
    },
  });

  return instance;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
