import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/posts/types";

/**
 * Journal card — the blog counterpart of the home page app card. The featured
 * image is optimised by next/image (AVIF/WebP, responsive sizes), lazy-loaded
 * and blurred-in when the post stores a placeholder.
 */
export function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.publishedAt ?? post.updatedAt);
  return (
    <Link className="post-card" href={`/blog/${post.slug}`}>
      {post.featuredImage && (
        <span className="post-card-media">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt}
            fill
            sizes="(max-width: 500px) 100vw, (max-width: 940px) 50vw, 350px"
            placeholder={post.featuredImage.blurDataURL ? "blur" : "empty"}
            blurDataURL={post.featuredImage.blurDataURL}
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
