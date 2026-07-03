import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/posts/markdown";
import { slugify } from "@/lib/posts/slug";
import type { Post } from "@/lib/posts/types";

/**
 * Full article rendering — shared by the public post page and the admin
 * draft preview so a draft previews exactly as it will publish.
 */
export function PostArticle({ post }: { post: Post }) {
  const html = renderMarkdown(post.content);
  const date = formatDate(post.publishedAt ?? post.updatedAt);

  return (
    <article className="post-page">
      <header className="post-header">
        <p className="dharma-mark">
          <Link href={`/blog/category/${slugify(post.category)}`}>
            {post.category}
          </Link>
        </p>
        <h1 className="post-title">{post.title}</h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        <p className="post-meta">
          {post.status === "draft" && (
            <>
              <span className="draft-badge">Draft</span>
              <span className="sep">·</span>
            </>
          )}
          {date && (
            <>
              <time dateTime={post.publishedAt ?? post.updatedAt}>{date}</time>
              <span className="sep">·</span>
            </>
          )}
          {post.readingTimeMinutes} min read
        </p>
      </header>

      {post.featuredImage && (
        <figure className="post-featured">
          {post.featuredImage.width && post.featuredImage.height ? (
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              width={post.featuredImage.width}
              height={post.featuredImage.height}
              sizes="(max-width: 940px) 100vw, 880px"
              priority
              placeholder={post.featuredImage.blurDataURL ? "blur" : "empty"}
              blurDataURL={post.featuredImage.blurDataURL}
            />
          ) : (
            // Dimensions unknown (e.g. hand-written frontmatter): plain <img>
            // keeps the layout honest instead of guessing an aspect ratio.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              fetchPriority="high"
            />
          )}
          {post.featuredImage.alt && (
            <figcaption>{post.featuredImage.alt}</figcaption>
          )}
        </figure>
      )}

      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {post.tags.length > 0 && (
        <div className="post-tail">
          <ul className="chip-row">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link className="chip" href={`/blog/tag/${slugify(tag)}`}>
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
