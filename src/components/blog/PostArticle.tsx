import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { defaultLocale, localePath, type Locale } from "@/lib/i18n/config";
import { categoryName, getDictionary } from "@/lib/i18n/dictionary";
import { renderMarkdown } from "@/lib/posts/markdown";
import { slugify } from "@/lib/posts/slug";
import type { Post } from "@/lib/posts/types";

/**
 * Full article rendering — shared by the public post page (in either
 * language) and the admin draft preview, so a draft previews exactly as it
 * will publish. Post bodies are rendered as written; `locale` translates the
 * chrome around them.
 */
export function PostArticle({
  post,
  locale = defaultLocale,
}: {
  post: Post;
  locale?: Locale;
}) {
  const t = getDictionary(locale);
  const html = renderMarkdown(post.content);
  const date = formatDate(post.publishedAt ?? post.updatedAt, locale);

  return (
    <article className="post-page">
      <header className="post-header">
        <p className="dharma-mark">
          <Link
            href={localePath(`/blog/category/${slugify(post.category)}`, locale)}
          >
            {categoryName(post.category, locale)}
          </Link>
        </p>
        <h1 className="post-title">{post.title}</h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        <p className="post-meta">
          {post.status === "draft" && (
            <>
              <span className="draft-badge">{t.journal.draft}</span>
              <span className="sep">·</span>
            </>
          )}
          {date && (
            <>
              <time dateTime={post.publishedAt ?? post.updatedAt}>{date}</time>
              <span className="sep">·</span>
            </>
          )}
          {t.journal.minRead(post.readingTimeMinutes)}
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
                <Link
                  className="chip"
                  href={localePath(`/blog/tag/${slugify(tag)}`, locale)}
                >
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
