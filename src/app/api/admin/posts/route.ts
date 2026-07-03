import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionOrResponse } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http-error";
import { getPostRepository } from "@/lib/posts/repository";
import { revalidatePostSurfaces } from "@/lib/posts/revalidate";
import { validatePostInput } from "@/lib/posts/validate";

export const runtime = "nodejs";

/** POST /api/admin/posts — create a post. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminSessionOrResponse();
  if (auth instanceof NextResponse) return auth;

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
    return errorResponse(error, "Failed to create the post.");
  }
}
