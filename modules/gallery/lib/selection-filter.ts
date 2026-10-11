export function filterPhotos<T extends { lrId: string }>(
  photos: T[],
  favorites: ReadonlySet<string>,
  onlyFavorites: boolean
): T[] {
  if (!onlyFavorites) return photos;
  return photos.filter((p) => favorites.has(p.lrId));
}

export function stepPhoto<T extends { lrId: string }>(
  list: T[],
  currentId: string,
  dir: 1 | -1
): T | null {
  if (list.length === 0) return null;
  const idx = list.findIndex((p) => p.lrId === currentId);
  if (idx === -1) return dir === 1 ? list[0] : list[list.length - 1];
  return list[(idx + dir + list.length) % list.length];
}

export function selectionLabel(count: number): string {
  if (count === 1) return "fotka vybrána";
  if (count >= 2 && count <= 4) return "fotky vybrány";
  return "fotek vybráno";
}
