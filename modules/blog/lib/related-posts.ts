import type { BlogPost } from "@/modules/blog/lib/blog";

export function pickRelatedPosts(posts: BlogPost[], currentId: string, limit = 3): BlogPost[] {
  return posts
    .filter((p) => p.published && p.id !== currentId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
