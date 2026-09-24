export type { PricingPackage } from "@/lib/types";
import type { PricingPackage } from "@/lib/types";

export type ServiceItem = {
  key: string;
  number: string;
  category: string;
  title: string;
  desc: string;
  packages: PricingPackage[];
  note?: string;
  href?: string; // dedicated service page
  hrefLabel?: string;
};

type Props = { services: ServiceItem[]; selectLabel: string };

export function ServiceCards({ services, selectLabel }: Props) {
  return (
    <div className={`mt-12 grid gap-6 items-start ${services.length === 2 ? "sm:grid-cols-2" : services.length > 2 ? "sm:grid-cols-3" : "grid-cols-1"}`}>
      {services.map((service) => (
        <details key={service.key} className="group border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 open:border-[var(--color-border-sub)]">
          <summary className="cursor-pointer list-none rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] [&::-webkit-details-marker]:hidden">
            <span className="block font-mono text-xs text-[var(--color-text-ghost)] tracking-widest mb-6">{service.number}</span>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">{service.title}</h3>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">{service.desc}</p>
            <span aria-hidden="true" className="flex justify-end mt-6 pt-4 border-t border-[var(--color-border)] text-[var(--color-text-ghost)]">
              <span className="group-open:rotate-45 transition-transform">+</span>
            </span>
          </summary>
          <div className="mt-6 space-y-3">
            {service.packages.map((pkg, i) => (
              <div key={pkg.id ?? `${pkg.name}-${i}`} className="border border-[var(--color-border)] p-4 bg-[var(--color-bg)]">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-xs font-mono tracking-widest text-[var(--color-text-ghost)] uppercase">{pkg.name}</span>
                  <span className="text-sm font-bold text-[var(--color-text)] shrink-0">{pkg.price}</span>
                </div>
                <div className="text-xs text-[var(--color-text-ghost)] mb-3">{pkg.duration}</div>
                <ul className="space-y-1">
                  {pkg.includes.filter(Boolean).map((item) => (
                    <li key={item} className="text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                      <span aria-hidden="true">—</span>{item}
                    </li>
                  ))}
                </ul>
                <a href={`?package=${encodeURIComponent(pkg.name)}&service=${encodeURIComponent(service.title)}#kontakt`} className="inline-block mt-3 px-3 py-1.5 border border-[var(--color-border-sub)] text-xs hover:bg-[var(--color-bg-overlay)] transition-colors">
                  {selectLabel}<span aria-hidden="true"> →</span>
                </a>
              </div>
            ))}
          </div>
          {service.note && <p className="mt-4 text-xs text-[var(--color-text-ghost)]">{service.note}</p>}
          {service.href && <a href={service.href} className="inline-block mt-4 text-sm underline underline-offset-4">{service.hrefLabel ?? service.title} →</a>}
        </details>
      ))}
    </div>
  );
}
