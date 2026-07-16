import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { firstMarkdownImage } from "@/lib/posts/markdown";
import type { Post } from "@/lib/posts/types";

/**
 * Journal card — the blog counterpart of the home page app card. The featured
 * image is optimised by next/image (AVIF/WebP, responsive sizes), lazy-loaded
 * and blurred-in when the post stores a placeholder. Posts saved without an
 * explicit featured image (e.g. the author only inserted an inline image in
 * the body) fall back to that first inline image so the card isn't blank.
 */
export function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.publishedAt ?? post.updatedAt);
  const thumbnail = post.featuredImage ?? firstMarkdownImage(post.content);
  return (
    <Link className="post-card" href={`/blog/${post.slug}`}>
      {thumbnail && (
        <span className="post-card-media">
          <Image
            src={thumbnail.url}
            alt={thumbnail.alt || post.title}
            fill
            sizes="(max-width: 500px) 100vw, (max-width: 940px) 50vw, 350px"
            placeholder={post.featuredImage?.blurDataURL ? "blur" : "empty"}
            blurDataURL={post.featuredImage?.blurDataURL}
          />
        </span>
      )}
      <span className="post-card-body">
        <span className="card-tag">{post.category}</span>
        <span className="card-title">{post.title}</span>
        <span className="card-desc">{post.excerpt}</span>
        <span className="post-meta">
          {date && (
            <>
              <time dateTime={post.publishedAt ?? post.updatedAt}>{date}</time>
              <span className="sep">·</span>
            </>
          )}
          {post.readingTimeMinutes} min read
        </span>
      </span>
    </Link>
  );
}
