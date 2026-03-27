export type ColorSet = {
  bg: string;
  bgElevated: string;
  bgOverlay: string;
  surface: string;
  text: string;
  textMuted: string;
  textGhost: string;
  accent: string;
  accentHover: string;
};

export type ThemeColors = {
  dark: ColorSet;
  light: ColorSet;
};

export const defaultColors: ThemeColors = {
  dark: {
    bg:          "#0A0A0B",
    bgElevated:  "#111113",
    bgOverlay:   "#18181C",
    surface:     "#1E1E23",
    text:        "#F2F0EB",
    textMuted:   "#9B9899",
    textGhost:   "#5C5A5E",
    accent:      "#C8A96E",
    accentHover: "#D4B87A",
  },
  light: {
    bg:          "#C8CDD6",
    bgElevated:  "#BFC5CF",
    bgOverlay:   "#B6BCC8",
    surface:     "#ADB3C1",
    text:        "#0F172A",
    textMuted:   "#475569",
    textGhost:   "#94A3B8",
    accent:      "#6B3A1F",
    accentHover: "#5A3019",
  },
};
