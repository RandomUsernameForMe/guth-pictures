export function kelvinToRGB(k: number): [number, number, number] {
  const t = k / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, v)) / 255;
  return [clamp(r), clamp(g), clamp(b)];
}

export function mixGel(
  kelvinRGB: [number, number, number],
  gelHex: string
): [number, number, number] {
  if (!gelHex || gelHex === "none") return kelvinRGB;
  const hex = gelHex.replace("#", "");
  const cr = parseInt(hex.slice(0, 2), 16) / 255;
  const cg = parseInt(hex.slice(2, 4), 16) / 255;
  const cb = parseInt(hex.slice(4, 6), 16) / 255;
  return [kelvinRGB[0] * cr, kelvinRGB[1] * cg, kelvinRGB[2] * cb];
}

export function lightColorCSS(kelvin: number, gel: string): string {
  const [r, g, b] = mixGel(kelvinToRGB(kelvin), gel);
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}
