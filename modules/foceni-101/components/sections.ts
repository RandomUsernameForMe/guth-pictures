import type { Section } from "./types";

/** Translator for the `foceni101` namespace (next-intl `useTranslations`). */
export type F101Translator = (key: string) => string;

// ── Value formatters (exact, real units) ──────────────────────────────────────
/** Exposure multiplier (0.2..2) → EV relative to correct. +1 EV = 2× světla. */
export const fmtEv = (v: number) => `${Math.log2(v) >= 0 ? "+" : ""}${Math.log2(v).toFixed(1)} EV`;
/** Shutter "slowness" param 0..1 → real exposure time (1/1000 s .. 1 s). */
export function fmtShutter(v: number): string {
  const t = Math.pow(1000, v) / 1000; // seconds
  return t >= 1 ? `${t.toFixed(t < 2 ? 1 : 0)} s` : `1/${Math.round(1 / t)} s`;
}
export const fmtIso = (v: number) => `ISO ${Math.round(v)}`;

/** Build the section config with all copy resolved for the active locale. */
export function buildSections(t: F101Translator): Section[] {
  const copy = (id: string) => ({
    id,
    title: t(`sections.${id}.title`),
    body: t(`sections.${id}.body`),
  });
  return [
    {
      ...copy("intro"),
      num: "00",
      target: { exposure: 1, aperture: 5.6, shutter: 0, iso: 100, focal: 50 },
    },
    {
      ...copy("expozice"),
      num: "01",
      target: { exposure: 1 },
      control: {
        param: "exposure",
        min: 0.2,
        max: 2,
        step: 0.01,
        label: t("ctrl.exposure"),
        fmt: fmtEv,
      },
    },
    {
      ...copy("clona"),
      num: "02",
      target: { aperture: 1.8 },
      holdLight: true,
      control: {
        param: "aperture",
        min: 1.8,
        max: 16,
        step: 0.1,
        label: t("ctrl.aperture"),
        fmt: (v) => `f/${v.toFixed(1)}`,
        invert: true,
      },
    },
    {
      ...copy("cas"),
      num: "03",
      target: { shutter: 0 },
      holdLight: true,
      orb: true,
      control: {
        param: "shutter",
        min: 0,
        max: 1,
        step: 0.01,
        label: t("ctrl.shutter"),
        fmt: fmtShutter,
      },
    },
    {
      ...copy("iso"),
      num: "04",
      target: { iso: 100 },
      holdLight: true,
      control: {
        param: "iso",
        min: 100,
        max: 6400,
        step: 100,
        label: t("ctrl.iso"),
        fmt: fmtIso,
      },
    },
    {
      ...copy("ohnisko"),
      num: "05",
      target: { focal: 50 },
      control: {
        param: "focal",
        min: 24,
        max: 135,
        step: 1,
        label: t("ctrl.focal"),
        fmt: (v) => `${Math.round(v)} mm`,
      },
    },
    {
      ...copy("uhel"),
      num: "06",
      target: { angle: -0.5 },
      control: {
        param: "angle",
        min: -1,
        max: 1,
        step: 0.01,
        label: t("ctrl.angle"),
        fmt: (v) => (v < -0.3 ? t("angle.low") : v > 0.3 ? t("angle.high") : t("angle.eye")),
      },
    },
    {
      ...copy("wb"),
      num: "07",
      target: { whiteBalance: 4200 },
      control: {
        param: "whiteBalance",
        min: 3000,
        max: 8000,
        step: 50,
        label: t("ctrl.wb"),
        fmt: (v) => `${Math.round(v)} K`,
      },
    },
    {
      ...copy("kompozice"),
      num: "08",
      // Open a bit so the rearranged background balls read as bokeh, not dots.
      target: { aperture: 3.2 },
      composition: true,
    },
    {
      ...copy("svetlo"),
      num: "09",
      target: { aperture: 5.6 },
      meter: true,
      control: {
        param: "aperture",
        min: 1.8,
        max: 16,
        step: 0.1,
        label: t("ctrl.aperture"),
        fmt: (v) => `f/${v.toFixed(1)}`,
        invert: true,
      },
    },
    {
      ...copy("capstone-blur"),
      num: "10",
      target: {},
      meter: true,
      capstone: true,
      orb: true,
    },
    {
      ...copy("capstone-freeze"),
      num: "11",
      target: {},
      meter: true,
      capstone: true,
      orb: true,
    },
    {
      ...copy("finale"),
      num: "→",
      // The money shot: portrait tele + open aperture + subject on thirds.
      target: {
        focal: 85,
        aperture: 2.8,
        angle: -0.15,
        whiteBalance: 5300,
        composition: 0.3,
        compositionY: 0.15,
      },
      holdLight: true,
      cta: true,
    },
  ];
}
