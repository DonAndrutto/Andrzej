import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getPostRepository } from "@/lib/posts/repository";
import { revalidatePostSurfaces } from "@/lib/posts/revalidate";
import { validatePostInput } from "@/lib/posts/validate";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ slug: string }>;
}

/** PUT /api/admin/posts/[slug] — update (the payload may rename the slug). */
export async function PUT(request: NextRequest, context: Context) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { slug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validatePostInput(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.errors.join(" ") },
      { status: 400 },
    );
  }

  const repo = await getPostRepository();
  const previous = await repo.getPost(slug);
  if (!previous) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  try {
    const post = await repo.updatePost(slug, result.input);
    // Revalidate both slugs when the post was renamed.
    revalidatePostSurfaces(post, previous);
    return NextResponse.json({ post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update the post.";
    const conflict = message.includes("already exists");
    return NextResponse.json(
      { error: message },
      { status: conflict ? 409 : 500 },
    );
  }
}

/** PATCH /api/admin/posts/[slug] — quick status change: { status: "draft" | "published" }. */
export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { slug } = await context.params;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (body.status !== "draft" && body.status !== "published") {
    return NextResponse.json(
      { error: 'status must be "draft" or "published".' },
      { status: 400 },
    );
  }

  const repo = await getPostRepository();
  const existing = await repo.getPost(slug);
  if (!existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  try {
    const post = await repo.updatePost(slug, {
      slug: existing.slug,
      title: existing.title,
      excerpt: existing.excerpt,
      content: existing.content,
      status: body.status,
      category: existing.category,
      tags: existing.tags,
      featuredImage: existing.featuredImage,
    });
    revalidatePostSurfaces(post);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update the post.",
      },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/posts/[slug] */
export async function DELETE(_request: NextRequest, context: Context) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { slug } = await context.params;

  const repo = await getPostRepository();
  const post = await repo.getPost(slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  try {
    await repo.deletePost(slug);
    revalidatePostSurfaces(post);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete the post.",
      },
      { status: 500 },
    );
  }
}
