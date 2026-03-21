import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getBlogPosts, saveBlogPost, type BlogPost } from "@/lib/blog";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = await getBlogPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const post = (await req.json()) as BlogPost;
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!post.id || !post.slug) {
    return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  }
  if (!SLUG_RE.test(post.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!post.cs || !post.en) {
    return NextResponse.json({ error: "Missing locale content" }, { status: 400 });
  }
  await saveBlogPost(post);
  revalidatePath("/cs/blog");
  revalidatePath("/en/blog");
  revalidatePath(`/cs/blog/${post.slug}`);
  revalidatePath(`/en/blog/${post.slug}`);
  return NextResponse.json({ ok: true });
}
