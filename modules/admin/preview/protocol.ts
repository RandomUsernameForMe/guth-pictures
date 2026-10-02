import type { ContentData, EditorialImages } from "@/modules/admin/lib/content";

export const PREVIEW_PAGES = {
  home: "Homepage",
  portrety: "Portréty",
  business: "Business",
  eventy: "Eventy",
} as const;

export type PreviewPage = keyof typeof PREVIEW_PAGES;

export const isPreviewPage = (value: string): value is PreviewPage => value in PREVIEW_PAGES;

export type PreviewMessage =
  | { type: "preview:ready" }
  | { type: "preview:data"; content?: ContentData; editorial?: EditorialImages }
  | { type: "preview:focus"; selector: string }
  | { type: "preview:find"; text: string };

// Finds the element whose visible text contains the given value (used to locate an edited field).
export function findByText(root: Node, text: string): HTMLElement | null {
  const needle = text.replace(/\s+/g, " ").trim().slice(0, 60);
  if (needle.length < 2) return null;
  const walker = root.ownerDocument!.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent?.replace(/\s+/g, " ").includes(needle)) return node.parentElement;
  }
  return null;
}
