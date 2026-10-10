import "server-only";
import { getKv } from "@/lib/kv";

export type BlogPost = {
  id: string;
  slug: string;
  coverImage?: string; // Cloudinary public ID
  publishedAt: string; // ISO string
  updatedAt: string;
  published: boolean;
  cs: { title: string; excerpt: string; content: string };
  en: { title: string; excerpt: string; content: string };
};

// Per-post keys + sorted set index eliminates read-modify-write race conditions.
// blog:post:<id>  → BlogPost (independent key per post)
// blog:index      → sorted set keyed by publishedAt timestamp (newest first via rev)

export async function getBlogPosts(): Promise<BlogPost[]> {
  const kv = await getKv();
  if (!kv) return [];
  try {
    const ids = await kv.zrange<string[]>("blog:index", 0, -1, { rev: true });
    if (!ids || ids.length === 0) return [];
    const posts = await Promise.all(ids.map((id) => kv.get<BlogPost>(`blog:post:${id}`)));
    return posts.filter(Boolean) as BlogPost[];
  } catch {
    return [];
  }
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const kv = await getKv();
  if (!kv) return null;
  try {
    return await kv.get<BlogPost>(`blog:post:${id}`);
  } catch {
    return null;
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const kv = await getKv();
  if (!kv) return null;
  try {
    const id = await kv.get<string>(`blog:slug:${slug}`);
    if (!id) return null;
    return await kv.get<BlogPost>(`blog:post:${id}`);
  } catch {
    return null;
  }
}

export type SaveBlogPostResult =
  | { ok: true; previousSlug?: string }
  | { ok: false; error: "slug-taken" };

export async function saveBlogPost(post: BlogPost): Promise<SaveBlogPostResult> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  const score = new Date(post.publishedAt).getTime();
  const [owner, existing] = await Promise.all([
    kv.get<string>(`blog:slug:${post.slug}`),
    kv.get<BlogPost>(`blog:post:${post.id}`),
  ]);
  if (owner && owner !== post.id) return { ok: false, error: "slug-taken" };
  // blog:slug:<slug> → id index enables O(1) slug lookup
  await Promise.all([
    kv.set(`blog:post:${post.id}`, post),
    kv.set(`blog:slug:${post.slug}`, post.id),
    kv.zadd("blog:index", { score, member: post.id }),
  ]);
  if (existing && existing.slug !== post.slug) {
    await kv.del(`blog:slug:${existing.slug}`);
    return { ok: true, previousSlug: existing.slug };
  }
  return { ok: true };
}

// Returns true if deleted, false if post not found
export async function deleteBlogPost(id: string): Promise<boolean> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  const existing = await kv.get<BlogPost>(`blog:post:${id}`);
  if (!existing) return false;
  await Promise.all([
    kv.del(`blog:post:${id}`),
    kv.del(`blog:slug:${existing.slug}`),
    kv.zrem("blog:index", id),
  ]);
  return true;
}
