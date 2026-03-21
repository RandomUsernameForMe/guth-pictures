import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getBlogPostById, deleteBlogPost } from "@/lib/blog";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  // Single read for slug (needed for revalidation)
  const post = await getBlogPostById(id);
  const deleted = await deleteBlogPost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (post) {
    revalidatePath("/cs/blog");
    revalidatePath("/en/blog");
    revalidatePath(`/cs/blog/${post.slug}`);
    revalidatePath(`/en/blog/${post.slug}`);
  }
  return NextResponse.json({ ok: true });
}
