import { getPostRepository } from "@/lib/posts/repository";
import { renderMarkdown } from "@/lib/posts/markdown";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const revalidate = 300;

/** RSS 2.0 feed of published posts, with full rendered content. */
export async function GET() {
  const repo = await getPostRepository();
  const posts = await repo.listPosts({ status: "published", perPage: 50 });

  const items = posts.items
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      // Feed readers can't resolve site-relative URLs — absolutise them.
      const html = renderMarkdown(post.content).replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${absoluteUrl("/")}`,
      );
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.publishedAt ?? post.updatedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.excerpt)}</description>
      <content:encoded><![CDATA[${html.replaceAll("]]>", "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = posts.items[0]
    ? new Date(posts.items[0].publishedAt ?? posts.items[0].updatedAt)
    : new Date();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${siteConfig.author} — ${siteConfig.blogTitle}`)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(siteConfig.blogDescription)}</description>
    <language>${siteConfig.locale}</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
