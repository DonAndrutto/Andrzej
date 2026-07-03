import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/blog/PostArticle";
import { getPostRepository } from "@/lib/posts/repository";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Preview: ${slug}` };
}

/**
 * Draft preview — renders exactly like the public post page (same
 * PostArticle component) but requires an admin session and never appears
 * in feeds, sitemaps or search. Public post pages 404 for drafts.
 */
export default async function PreviewPostPage({ params }: Props) {
  const { slug } = await params;
  const repo = await getPostRepository();
  const post = await repo.getPost(slug);
  if (!post) notFound();

  return (
    <div style={{ margin: "-2.2rem -2rem -4rem" }}>
      <div className="preview-banner">
        <span>
          Preview — {post.status === "draft" ? "draft, not public" : "published"}
        </span>
        <Link href={`/admin/posts/${post.slug}`}>← Back to editor</Link>
      </div>
      <PostArticle post={post} />
      <div style={{ paddingBottom: "4rem" }} />
    </div>
  );
}
