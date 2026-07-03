import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getPostRepository } from "@/lib/posts/repository";
import { revalidatePostSurfaces } from "@/lib/posts/revalidate";
import { validatePostInput } from "@/lib/posts/validate";

export const runtime = "nodejs";

/** POST /api/admin/posts — create a post. */
export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

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
  try {
    const post = await repo.createPost(result.input);
    revalidatePostSurfaces(post);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create the post.";
    const conflict = message.includes("already exists");
    return NextResponse.json(
      { error: message },
      { status: conflict ? 409 : 500 },
    );
  }
}
