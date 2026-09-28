import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { sortShoots } from "./core";

const IMAGE_RE = /\.(jpe?g|png|tiff?|webp)$/i;

export async function listShoots(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return sortShoots(entries.filter((e) => e.isDirectory()).map((e) => e.name));
}

export async function listImages(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir, { recursive: true });
  return files.filter((f) => IMAGE_RE.test(f)).sort().map((f) => path.join(dir, f));
}

const PREVIEW_RE = /^(\d{3}\.jpg|map\.json)$/;

// Maže jen vlastní výstupy — --out může omylem ukázat na cizí složku
export async function clearPreviews(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  for (const f of await fs.readdir(dir)) {
    if (PREVIEW_RE.test(f)) await fs.rm(path.join(dir, f));
  }
}

export async function makePreview(src: string, out: string): Promise<void> {
  await sharp(src).rotate().resize(800, 800, { fit: "inside" }).jpeg({ quality: 80 }).toFile(out);
}

export async function webVersion(src: string): Promise<Buffer> {
  return sharp(src)
    .rotate()
    .resize(3000, 3000, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
}
