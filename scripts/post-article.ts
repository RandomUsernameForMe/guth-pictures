/**
 * Uloží článek do Vercel KV jako draft.
 *
 * Použití:
 *   npx tsx scripts/post-article.ts < article.json
 *   npx tsx scripts/post-article.ts --file article.json
 *
 * article.json musí mít strukturu BlogPostInput (viz níže).
 * Env proměnné se načtou z .env.local automaticky.
 */

import { readFileSync } from "fs";
import { randomUUID } from "crypto";

// --- Load .env.local before initializing @vercel/kv ---
try {
  const content = readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {
  // .env.local není dostupné — env proměnné musí být nastaveny v shellu
}

type BlogPostInput = {
  slug: string;
  coverImage?: string;
  published?: boolean;
  cs: { title: string; excerpt: string; content: string };
  en: { title: string; excerpt: string; content: string };
};

function readInput(): BlogPostInput {
  const fileArg = process.argv.indexOf("--file");
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    return JSON.parse(readFileSync(process.argv[fileArg + 1], "utf-8"));
  }
  // stdin
  return JSON.parse(readFileSync("/dev/stdin", "utf-8"));
}

async function main() {
  const { kv } = await import("@vercel/kv");

  const input = readInput();

  const now = new Date().toISOString();
  const post = {
    id: randomUUID(),
    slug: input.slug,
    coverImage: input.coverImage,
    publishedAt: now,
    updatedAt: now,
    published: input.published ?? false,
    cs: input.cs,
    en: input.en,
  };

  const score = new Date(post.publishedAt).getTime();
  await Promise.all([
    kv.set(`blog:post:${post.id}`, post),
    kv.set(`blog:slug:${post.slug}`, post.id),
    kv.zadd("blog:index", { score, member: post.id }),
  ]);

  console.log(`✓ Článek uložen jako ${post.published ? "published" : "draft"}`);
  console.log(`  id:   ${post.id}`);
  console.log(`  slug: ${post.slug}`);
  console.log(`  cs:   ${post.cs.title}`);
  console.log(`  en:   ${post.en.title}`);
}

main().catch((err) => {
  console.error("Chyba:", err.message);
  process.exit(1);
});
