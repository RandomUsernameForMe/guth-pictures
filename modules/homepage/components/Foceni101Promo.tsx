import Link from "next/link";

interface Props {
  label: string;
  title: string;
  desc: string;
  cta: string;
  locale: string;
}

export function Foceni101Promo({ label, title, desc, cta, locale }: Props) {
  const legs = locale === "en"
    ? { ap: "APERTURE", sh: "SHUTTER", iso: "ISO" }
    : { ap: "CLONA", sh: "ČAS", iso: "ISO" };
  return (
    <div className="lt-promo lt-promo--flip">
      <div className="lt-promo-text">
        <span className="lt-promo-label">{label}</span>
        <h2 className="lt-promo-title">{title}</h2>
        <p className="lt-promo-desc">{desc}</p>
        <Link href={`/${locale}/foceni-101`} className="lt-promo-cta">
          {cta} →
        </Link>
      </div>

      {/* Exposure-triangle diagram — same visual as the page's OG image */}
      <div className="lt-promo-diagram" aria-hidden="true">
        <svg viewBox="-200 -200 400 400" width="320" height="320">
          {/* Outer ring */}
          <circle cx="0" cy="0" r="175" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

          {/* Triangle edges */}
          <line x1="0" y1="-130" x2="-120" y2="90" stroke="var(--color-accent-secondary)" strokeWidth="1" opacity="0.4" />
          <line x1="0" y1="-130" x2="120" y2="90" stroke="var(--color-accent-secondary)" strokeWidth="1" opacity="0.4" />
          <line x1="-120" y1="90" x2="120" y2="90" stroke="var(--color-accent-secondary)" strokeWidth="1" opacity="0.4" />

          {/* CLONA — apex */}
          <circle cx="0" cy="-130" r="18" fill="var(--color-accent-secondary)" opacity="0.9" />
          <circle cx="0" cy="-130" r="30" fill="none" stroke="var(--color-accent-secondary)" strokeWidth="1.5" opacity="0.45" />
          <text x="0" y="-172" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="var(--color-accent-secondary)" opacity="0.65">{legs.ap}</text>

          {/* ČAS — bottom left */}
          <circle cx="-120" cy="90" r="18" fill="var(--color-text-muted)" opacity="0.85" />
          <circle cx="-120" cy="90" r="30" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.38" />
          <text x="-120" y="134" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="var(--color-text-muted)" opacity="0.6">{legs.sh}</text>

          {/* ISO — bottom right */}
          <circle cx="120" cy="90" r="18" fill="#7BA7BC" opacity="0.85" />
          <circle cx="120" cy="90" r="30" fill="none" stroke="#7BA7BC" strokeWidth="1.5" opacity="0.38" />
          <text x="120" y="134" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="#7BA7BC" opacity="0.6">{legs.iso}</text>

          {/* Centre: balanced-exposure readout */}
          <text x="0" y="-6" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-text)" letterSpacing="-0.5">0.0 EV</text>
          <rect x="-55" y="8" width="110" height="7" rx="3.5" fill="#1E1E23" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="-55" y="8" width="55" height="7" rx="3.5" fill="var(--color-accent-secondary)" />
          <rect x="-1" y="5" width="2" height="13" fill="var(--color-text)" />
        </svg>
      </div>
    </div>
  );
}
