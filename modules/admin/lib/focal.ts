type Point = { x: number; y: number };
type Rect = { left: number; top: number; width: number; height: number };

const clamp = (value: number) => (Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 50);

export const formatFocal = ({ x, y }: Point) => `${Math.round(clamp(x))}% ${Math.round(clamp(y))}%`;

export function parseFocal(value: string): Point {
  const match = /^\s*(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(value);
  return match ? { x: clamp(Number(match[1])), y: clamp(Number(match[2])) } : { x: 50, y: 50 };
}

export const toFocal = (clientX: number, clientY: number, rect: Rect) =>
  formatFocal({ x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 });

export function nudgeFocal(value: string, dx: number, dy: number) {
  const { x, y } = parseFocal(value);
  return formatFocal({ x: x + dx, y: y + dy });
}
