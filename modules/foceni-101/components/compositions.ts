export type OverlayKind = "thirds" | "center" | "golden" | "leading" | "space";

export interface Composition {
  id: string;
  /** Chip text (CS). */
  label: string;
  /** Explanation of what differs (CS, exact, no metaphor). */
  body: string;
  /** Subject horizontal placement, -1..1 (maps to scene `composition`). */
  comp: number;
  /** Camera-distance multiplier (1 = normal, >1 = subject smaller). */
  framing: number;
  overlay: OverlayKind;
}

export const COMPOSITIONS: Composition[] = [
  {
    id: "thirds",
    label: "Třetiny",
    comp: 0.5,
    framing: 1,
    overlay: "thirds",
    body: "Subjekt leží na pravé třetinové čáře místo ve středu. Pohled má kam plynout a záběr působí vyváženě, ne staticky.",
  },
  {
    id: "center",
    label: "Na střed",
    comp: 0,
    framing: 1,
    overlay: "center",
    body: "Subjekt přesně uprostřed. Působí symetricky, formálně a přímo — vhodné, když chceš klid a konfrontaci pohledem.",
  },
  {
    id: "golden",
    label: "Zlatý řez",
    comp: 0.62,
    framing: 1,
    overlay: "golden",
    body: "Subjekt na linii zlatého řezu (≈ 62 %). Podobné třetinám, ale o kousek blíž středu — poměr převzatý z malířství.",
  },
  {
    id: "leading",
    label: "Vedoucí linie",
    comp: 0,
    framing: 1,
    overlay: "leading",
    body: "Linie v záběru (cesty, hrany, světlo) směřují k subjektu a vedou k němu oko diváka. Najeď myší na dlaždici a uvidíš je.",
  },
  {
    id: "space",
    label: "Prostor",
    comp: -0.55,
    framing: 1.8,
    overlay: "space",
    body: "Subjekt je malý a posunutý ke kraji, zbytek záběru zůstává prázdný. Negativní prostor dává záběru dýchat a podtrhuje měřítko.",
  },
];

/** Subject world X = comp * 0.7 in the scene; approximate to screen fraction 0..1. */
export function subjectScreenX(comp: number): number {
  return Math.min(1, Math.max(0, 0.5 + comp * 0.32));
}
