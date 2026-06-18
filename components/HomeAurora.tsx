// One continuous, fixed brand-glow layer behind the whole homepage. Because it's fixed and
// page-wide (not per-section), there are no seams between sections — content scrolls over a
// calm, steady aurora. Sits at z-index:-1, above the body background but behind all content;
// homepage sections are transparent so it shows through consistently.
export function HomeAurora() {
  return <div className="home-aurora" aria-hidden />;
}
