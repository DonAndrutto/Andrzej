import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/PostEditor";
import { getPostRepository } from "@/lib/posts/repository";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const repo = await getPostRepository();
  const categories = await repo.listCategories();

  return (
    <>
      <div className="admin-heading">
        <h1>New post</h1>
      </div>
      <PostEditor
        categories={categories.map((c) => c.name)}
        writable={repo.writable}
      />
    </>
  );
}
