import type { ColorSet } from "./theme-types";

export type ThemePreset = {
  id: string;
  label: string;
  note?: string;
  colors: ColorSet;
};

/**
 * Every preset follows the same logic: the background carries the colour,
 * `accent` is the fill, `accentSecondary` only ever draws lines.
 */
export const themePresets: ThemePreset[] = [
  {
    id: "vino",
    label: "Víno",
    note: "Výchozí — kostěný akcent na vínové ploše, měděné linky",
    colors: {
      bg:              "#1A0A0F",
      bgElevated:      "#221117",
      bgOverlay:       "#2A1720",
      surface:         "#331D27",
      text:            "#EDE2D9",
      textMuted:       "#C0A49C",
      textGhost:       "#8A6A66",
      accent:          "#FAF0E4",
      accentHover:     "#FDF8F0",
      accentSecondary: "#B87333",
      grain:           "#6B2030",
    },
  },
  {
    id: "visen",
    label: "Višeň",
    note: "Nejsytější — jedna barva ve třech hloubkách",
    colors: {
      bg:              "#170A0D",
      bgElevated:      "#1F0F14",
      bgOverlay:       "#28151B",
      surface:         "#331B22",
      text:            "#F1E4E4",
      textMuted:       "#B79A9C",
      textGhost:       "#7E5A5E",
      accent:          "#D64C5E",
      accentHover:     "#E76474",
      accentSecondary: "#B87333",
      grain:           "#A0202F",
    },
  },
  {
    id: "uhel",
    label: "Uhel",
    note: "Bez barvy — neutrální grain, fotky bez nádechu",
    colors: {
      bg:              "#0A0A0B",
      bgElevated:      "#111113",
      bgOverlay:       "#18181C",
      surface:         "#1E1E23",
      text:            "#EFEDE9",
      textMuted:       "#9B9899",
      textGhost:       "#5C5A5E",
      accent:          "#F5F2ED",
      accentHover:     "#FFFFFF",
      accentSecondary: "#8A8A8A",
      grain:           "#8A8A8A",
    },
  },
  {
    id: "zlata",
    label: "Zlatá",
    note: "Archiv — původní vzhled webu",
    colors: {
      bg:              "#0A0A0B",
      bgElevated:      "#111113",
      bgOverlay:       "#18181C",
      surface:         "#1E1E23",
      text:            "#F2F0EB",
      textMuted:       "#9B9899",
      textGhost:       "#5C5A5E",
      accent:          "#C8A96E",
      accentHover:     "#D4B87A",
      accentSecondary: "#C8A96E",
      grain:           "#C8A96E",
    },
  },
];

export const defaultColors: ColorSet = themePresets[0].colors;
