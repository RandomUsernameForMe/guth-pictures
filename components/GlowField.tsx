// Decorative brand-colored glow layer (brass accent + warm tones). Absolute, sits behind
// section content. Same idea as the proposal page's .bsp-decor, but driven by the site's
// global brand tokens. Place inside a `position: relative; overflow: hidden` container.
export function GlowField({ className = "" }: { className?: string }) {
  return <div className={`glow-field ${className}`.trim()} aria-hidden />;
}
