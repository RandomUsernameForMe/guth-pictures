import "server-only";

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

async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
}

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
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function saveBlogPost(post: BlogPost): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  const score = new Date(post.publishedAt).getTime();
  // Both writes are independent — no read-modify-write, no race condition
  await Promise.all([
    kv.set(`blog:post:${post.id}`, post),
    kv.zadd("blog:index", { score, member: post.id }),
  ]);
}

// Returns true if deleted, false if post not found
export async function deleteBlogPost(id: string): Promise<boolean> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  const existing = await kv.get(`blog:post:${id}`);
  if (!existing) return false;
  await Promise.all([
    kv.del(`blog:post:${id}`),
    kv.zrem("blog:index", id),
  ]);
  return true;
}
