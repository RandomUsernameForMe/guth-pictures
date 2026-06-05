import Link from "next/link";

interface Props {
  label: string;
  title: string;
  desc: string;
  cta: string;
  locale: string;
}

export function LightTesterPromo({ label, title, desc, cta, locale }: Props) {
  return (
    <div className="lt-promo">
      <div className="lt-promo-text">
        <span className="lt-promo-label">{label}</span>
        <h2 className="lt-promo-title">{title}</h2>
        <p className="lt-promo-desc">{desc}</p>
        <Link href={`/${locale}/light-tester`} className="lt-promo-cta">
          {cta} →
        </Link>
      </div>

      <div className="lt-promo-diagram" aria-hidden="true">
        <svg viewBox="-200 -200 400 400" width="320" height="320">
          {/* Outer ring */}
          <circle cx="0" cy="0" r="175" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          {/* Inner ring */}
          <circle cx="0" cy="0" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Light rays */}
          <line x1="-90" y1="-100" x2="0" y2="0" stroke="#C8A96E" strokeWidth="1" opacity="0.45" />
          <line x1="95" y1="-95" x2="0" y2="0" stroke="#9B9899" strokeWidth="1" opacity="0.32" />
          <line x1="0" y1="130" x2="0" y2="0" stroke="#7BA7BC" strokeWidth="1" opacity="0.38" />

          {/* KEY light */}
          <circle cx="-108" cy="-118" r="22" fill="#C8A96E" opacity="0.9" />
          <circle cx="-108" cy="-118" r="36" fill="none" stroke="#C8A96E" strokeWidth="1.5" opacity="0.45" />
          <text x="-108" y="-88" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="#C8A96E" opacity="0.65" style={{ textTransform: "uppercase" }}>KEY</text>

          {/* FILL light */}
          <circle cx="108" cy="-108" r="22" fill="#9B9899" opacity="0.85" />
          <circle cx="108" cy="-108" r="36" fill="none" stroke="#9B9899" strokeWidth="1.5" opacity="0.38" />
          <text x="108" y="-78" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="#9B9899" opacity="0.6" style={{ textTransform: "uppercase" }}>FILL</text>

          {/* RIM light */}
          <circle cx="0" cy="140" r="18" fill="#7BA7BC" opacity="0.85" />
          <circle cx="0" cy="140" r="30" fill="none" stroke="#7BA7BC" strokeWidth="1.5" opacity="0.38" />
          <text x="0" y="166" textAnchor="middle" fontSize="9" letterSpacing="2.5" fill="#7BA7BC" opacity="0.6" style={{ textTransform: "uppercase" }}>RIM</text>

          {/* Subject */}
          <circle cx="0" cy="0" r="26" fill="#1E1E23" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="11" fill="#9B9899" opacity="0.8" />
          <text x="0" y="44" textAnchor="middle" fontSize="8" letterSpacing="3" fill="#5C5A5E" style={{ textTransform: "uppercase" }}>SUBJECT</text>

          {/* TOP VIEW label */}
          <text x="155" y="185" textAnchor="end" fontSize="8" letterSpacing="3" fill="#5C5A5E" style={{ textTransform: "uppercase" }}>TOP VIEW</text>
        </svg>
      </div>
    </div>
  );
}
