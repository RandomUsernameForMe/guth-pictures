import path from "node:path";

export const MAX_PER_SHOOT = 2;
export const WEB_LIMIT = 50;

export const CATEGORIES = ["portréty", "svatby", "larpy"] as const;
export type Category = (typeof CATEGORIES)[number];

export type WebPhoto = { publicId: string; shoot?: string };

export const nfc = (s: string) => s.normalize("NFC");

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

export function shootFromPath(root: string, filePath: string): string | null {
  const rel = path.relative(path.resolve(root), path.resolve(filePath));
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const parts = rel.split(/[\\/]/);
  return parts.length > 1 ? nfc(parts[0]) : null;
}

function shootKey(name: string): number {
  const m = name.match(/^(\d{4})\D+(\d{1,2})/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : -1;
}

export function sortShoots(names: string[]): string[] {
  return [...names].sort((a, b) => shootKey(b) - shootKey(a) || a.localeCompare(b, "cs"));
}

export function countByShoot(photos: WebPhoto[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of photos) {
    if (!p.shoot) continue;
    const key = nfc(p.shoot);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function canAdd(photos: WebPhoto[], shoot: string, max = MAX_PER_SHOOT): boolean {
  return (countByShoot(photos).get(nfc(shoot)) ?? 0) < max;
}

export type StatusReport = {
  rows: { shoot: string; count: number }[];
  violations: { shoot: string; count: number }[];
  untagged: string[];
  unknownShoots: string[];
  total: number;
};

export function buildStatus(driveShoots: string[], photos: WebPhoto[], max = MAX_PER_SHOOT): StatusReport {
  const counts = countByShoot(photos);
  const known = new Set(driveShoots.map(nfc));
  return {
    rows: driveShoots.map((s) => ({ shoot: nfc(s), count: counts.get(nfc(s)) ?? 0 })),
    violations: [...counts].filter(([, c]) => c > max).map(([shoot, count]) => ({ shoot, count })),
    untagged: photos.filter((p) => !p.shoot).map((p) => p.publicId),
    unknownShoots: [...counts.keys()].filter((s) => !known.has(s)),
    total: photos.length,
  };
}
