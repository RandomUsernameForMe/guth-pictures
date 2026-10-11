import type { GalleryPhoto } from "./gallery";

export function selectedFilenames(photos: GalleryPhoto[], favorites: string[]): string[] {
  const selected = new Set(favorites);
  return photos.filter((p) => selected.has(p.lrId)).map((p) => p.filename);
}

export function formatFilenamesForCopy(photos: GalleryPhoto[], favorites: string[]): string {
  return selectedFilenames(photos, favorites).join(", ");
}

export function formatFilenamesForTxt(photos: GalleryPhoto[], favorites: string[]): string {
  const names = selectedFilenames(photos, favorites);
  return names.length ? `${names.join("\n")}\n` : "";
}
