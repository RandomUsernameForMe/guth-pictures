/**
 * Hromadně uloží příspěvky do Vercel KV.
 * Pokud příspěvek nemá coverImage, automaticky vygeneruje SVG cover a nahraje do Cloudinary.
 *
 * Použití:
 *   npx tsx scripts/batch-post.ts --file posts.json
 *   npx tsx scripts/batch-post.ts --file posts.json --no-covers   # přeskočit generování coverů
 *
 * posts.json musí být pole BlogPostInput[] — viz příklad níže nebo posts.example.json.
 */

import { readFileSync } from "fs";
import { defaultColors as P } from "../../../lib/theme-presets";
import { randomUUID } from "crypto";

// Load .env.local
try {
  const content = readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {
  // .env.local not available — env vars must be set in shell
}

type BlogPostInput = {
  slug: string;
  coverImage?: string;
  publishedAt?: string; // ISO — pokud chybí, použije se aktuální čas
  published?: boolean;
  cs: { title: string; excerpt: string; content: string };
  en: { title: string; excerpt: string; content: string };
};

// ── SVG cover generation ────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function buildSvg(title: string): string {
  const lines = wrapText(title, 28);
  const lineHeight = 68;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (630 - totalTextHeight) / 2 + 20;

  const textLines = lines
    .map(
      (line, i) =>
        `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700" fill="${P.text}">${escapeXml(line)}</text>`
    )
    .join("\n  ");

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="88%" cy="12%" r="45%">
      <stop offset="0%" stop-color="${P.accentSecondary}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${P.bg}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="10%" cy="90%" r="40%">
      <stop offset="0%" stop-color="${P.accentSecondary}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${P.bg}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${P.bg}"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <rect x="72" y="72" width="1056" height="486" fill="none" stroke="${P.accentSecondary}" stroke-opacity="0.14" stroke-width="1"/>
  ${textLines}
  <rect x="72" y="516" width="64" height="2" fill="${P.accentSecondary}"/>
  <text x="72" y="558" font-family="Georgia, 'Times New Roman', serif" font-size="16" fill="${P.accentSecondary}" letter-spacing="4">GUTH PICTURES</text>
</svg>`;
}

async function uploadCover(title: string, slug: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const svg = buildSvg(title);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUrl, {
    public_id: `blog-covers/${slug}`,
    overwrite: true,
    resource_type: "image",
    format: "jpg",
    transformation: [{ width: 1200, height: 630, crop: "fill", quality: 85 }],
  });

  return result.public_id;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const fileArg = process.argv.indexOf("--file");
  if (fileArg === -1 || !process.argv[fileArg + 1]) {
    console.error("Použití: npx tsx scripts/batch-post.ts --file posts.json");
    process.exit(1);
  }

  const skipCovers = process.argv.includes("--no-covers");
  const inputs: BlogPostInput[] = JSON.parse(
    readFileSync(process.argv[fileArg + 1], "utf-8")
  );

  if (!Array.isArray(inputs)) {
    console.error("posts.json musí být pole []");
    process.exit(1);
  }

  console.log(`\nNačteno ${inputs.length} příspěvků\n`);

  const { kv } = await import("@vercel/kv");
  let saved = 0;

  for (const input of inputs) {
    const now = new Date().toISOString();
    let coverImage = input.coverImage;

    if (!coverImage && !skipCovers) {
      process.stdout.write(`  ↳ generuji cover pro "${input.cs.title}"...`);
      try {
        coverImage = await uploadCover(input.cs.title, input.slug);
        process.stdout.write(` ✓\n`);
      } catch (e) {
        process.stdout.write(` ✗ přeskakuji (${(e as Error).message})\n`);
      }
    }

    const post = {
      id: randomUUID(),
      slug: input.slug,
      coverImage,
      publishedAt: input.publishedAt ?? now,
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

    console.log(
      `✓ [${++saved}/${inputs.length}] "${post.cs.title}" → /${post.slug} (${post.published ? "published" : "draft"})`
    );
  }

  console.log(`\n✅ Hotovo — uloženo ${saved} příspěvků`);
}

main().catch((err) => {
  console.error("Chyba:", err.message);
  process.exit(1);
});
