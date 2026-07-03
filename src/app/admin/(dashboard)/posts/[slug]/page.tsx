import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getPostRepository } from "@/lib/posts/repository";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Edit: ${slug}` };
}

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params;
  const repo = await getPostRepository();
  const [post, categories] = await Promise.all([
    repo.getPost(slug),
    repo.listCategories(),
  ]);
  if (!post) notFound();

  return (
    <>
      <div className="admin-heading">
        <h1>Edit post</h1>
        <span className="admin-heading-note">/blog/{post.slug}</span>
      </div>
      <PostEditor
        post={post}
        categories={categories.map((c) => c.name)}
        writable={repo.writable}
      />
    </>
  );
}
