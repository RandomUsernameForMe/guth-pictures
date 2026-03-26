"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";

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
};

type Props = {
  services: ServiceItem[];
  portfolioLabel: string;
  pricingLabel: string;
  closeLabel: string;
  bookLabel: string;
};

export function ServiceCards({ services, portfolioLabel, pricingLabel, closeLabel, bookLabel }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedService = services.find((s) => s.key === selected) ?? null;

  return (
    <div className="mt-12">
      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="grid gap-6 sm:grid-cols-3"
          >
            {services.map((service) => (
              <div
                key={service.key}
                className="group relative border border-[var(--color-border)] p-8 flex flex-col hover:border-[var(--color-border-sub)] hover:bg-[var(--color-bg-overlay)] transition-all duration-300 overflow-hidden"
              >
                <span className="font-mono text-xs text-[var(--color-text-ghost)] tracking-widest mb-6">
                  {service.number}
                </span>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">{service.title}</h3>
                <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed flex-1">
                  {service.desc}
                </p>
                <div className="flex gap-3 mt-6 flex-wrap">
                  <Link
                    href={`/portfolio?category=${service.category}`}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors border border-[var(--color-border)] px-3 py-1.5"
                  >
                    {portfolioLabel} →
                  </Link>
                  <button
                    onClick={() => setSelected(service.key)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-bg-elevated)]"
                  >
                    {pricingLabel}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : selectedService !== null ? (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="border border-[var(--color-border)] p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[var(--color-text)]">
                  {selectedService.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {selectedService.desc}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 -mt-1 -mr-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors rounded-lg hover:bg-[var(--color-bg-overlay)]"
                aria-label={closeLabel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Packages */}
            <div className="grid gap-4 sm:grid-cols-3">
              {selectedService.packages.map((pkg) => (
                <div
                  key={pkg.id ?? pkg.name}
                  className="border border-[var(--color-border)] p-6 flex flex-col bg-[var(--color-bg-elevated)]"
                >
                  <div className="text-xs font-mono tracking-widest text-[var(--color-text-ghost)] uppercase mb-3">
                    {pkg.name}
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text)]">{pkg.price}</div>
                  <div className="text-xs text-[var(--color-text-ghost)] mt-1 mb-4">{pkg.duration}</div>
                  <ul className="flex-1 space-y-2">
                    {pkg.includes.filter(Boolean).map((item) => (
                      <li
                        key={item}
                        className="text-xs text-[var(--color-text-muted)] flex items-start gap-2"
                      >
                        <span className="text-[var(--color-text-ghost)] shrink-0 mt-0.5">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Note */}
            {selectedService.note && (
              <p className="mt-6 text-xs text-[var(--color-text-ghost)]">
                {selectedService.note}
              </p>
            )}

            {/* CTA */}
            <a
              href="#kontakt"
              className="inline-block mt-8 px-6 py-3 border border-[var(--color-border-sub)] text-sm hover:bg-[var(--color-bg-overlay)] transition-colors"
            >
              {bookLabel} →
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
