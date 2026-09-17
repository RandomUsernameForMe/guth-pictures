/**
 * Vygeneruje SVG cover obrázek a nahraje ho do Cloudinary.
 * Užitečné pro regeneraci coveru u existujícího příspěvku.
 *
 * Použití:
 *   npx tsx scripts/generate-cover.ts --title "Název článku" --slug muj-clanek
 *
 * Výstup: Cloudinary public_id (vložte jako coverImage v adminu nebo posts.json)
 */

import { readFileSync } from "fs";
import { defaultColors as P } from "../../../lib/theme-presets";

try {
  const content = readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {}

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

async function main() {
  const titleArg = process.argv.indexOf("--title");
  const slugArg = process.argv.indexOf("--slug");

  if (titleArg === -1 || !process.argv[titleArg + 1] || slugArg === -1 || !process.argv[slugArg + 1]) {
    console.error('Použití: npx tsx scripts/generate-cover.ts --title "Název článku" --slug muj-clanek');
    process.exit(1);
  }

  const title = process.argv[titleArg + 1];
  const slug = process.argv[slugArg + 1];

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  process.stdout.write(`Generuji cover pro "${title}"...`);

  const svg = buildSvg(title);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUrl, {
    public_id: `blog-covers/${slug}`,
    overwrite: true,
    resource_type: "image",
    format: "jpg",
    transformation: [{ width: 1200, height: 630, crop: "fill", quality: 85 }],
  });

  console.log(` ✓\n`);
  console.log(`coverImage: "${result.public_id}"`);
}

main().catch((err) => {
  console.error("Chyba:", err.message);
  process.exit(1);
});
