import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getBlogPosts, saveBlogPost, type BlogPost } from "@/modules/blog/lib/blog";

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
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;
  if (!post.id || !UUID_RE.test(post.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!post.slug || !SLUG_RE.test(post.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!post.cs?.title || !post.en?.title) {
    return NextResponse.json({ error: "Missing locale title" }, { status: 400 });
  }
  if (post.cs.title.length > 200 || post.en.title.length > 200) {
    return NextResponse.json({ error: "Title too long" }, { status: 400 });
  }
  if ((post.cs.excerpt?.length ?? 0) > 500 || (post.en.excerpt?.length ?? 0) > 500) {
    return NextResponse.json({ error: "Excerpt too long" }, { status: 400 });
  }
  if ((post.cs.content?.length ?? 0) > 50000 || (post.en.content?.length ?? 0) > 50000) {
    return NextResponse.json({ error: "Content too long" }, { status: 400 });
  }
  if (post.coverImage && !CLOUDINARY_ID_RE.test(post.coverImage)) {
    return NextResponse.json({ error: "Invalid coverImage" }, { status: 400 });
  }
  await saveBlogPost(post);
  revalidatePath("/cs/blog");
  revalidatePath("/en/blog");
  revalidatePath(`/cs/blog/${post.slug}`);
  revalidatePath(`/en/blog/${post.slug}`);
  return NextResponse.json({ ok: true });
}
