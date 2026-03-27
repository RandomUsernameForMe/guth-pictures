"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  bookLabel: string;
};

export function ServiceCards({ services, bookLabel }: Props) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-3 items-start">
      {services.map((service) => {
        const isOpen = openKeys.has(service.key);

        return (
          <div
            key={service.key}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-controls={`packages-${service.key}`}
            onClick={() => toggle(service.key)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle(service.key)}
            className={`group relative border p-8 flex flex-col transition-all duration-300 cursor-pointer
              ${isOpen
                ? "border-[var(--color-border-sub)] bg-[var(--color-bg-elevated)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-sub)] hover:bg-[var(--color-bg-overlay)]"
              }`}
          >
            <span className="font-mono text-xs text-[var(--color-text-ghost)] tracking-widest mb-6">
              {service.number}
            </span>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">{service.title}</h3>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
              {service.desc}
            </p>

            {/* Expandable packages */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`packages-${service.key}`}
                  key="packages"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 space-y-3">
                    {service.packages.map((pkg, i) => (
                      <div
                        key={pkg.id ?? `${pkg.name}-${i}`}
                        className="border border-[var(--color-border)] p-4 bg-[var(--color-bg)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                          <span className="text-xs font-mono tracking-widest text-[var(--color-text-ghost)] uppercase">
                            {pkg.name}
                          </span>
                          <span className="text-sm font-bold text-[var(--color-text)] shrink-0">
                            {pkg.price}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-text-ghost)] mb-3">{pkg.duration}</div>
                        <ul className="space-y-1">
                          {pkg.includes.filter(Boolean).map((item) => (
                            <li key={item} className="text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                              <span className="text-[var(--color-text-ghost)] shrink-0 mt-0.5">—</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {service.note && (
                    <p className="mt-4 text-xs text-[var(--color-text-ghost)]">{service.note}</p>
                  )}

                  <a
                    href="#kontakt"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-5 px-4 py-2 border border-[var(--color-border-sub)] text-xs hover:bg-[var(--color-bg-overlay)] transition-colors"
                  >
                    {bookLabel}<span aria-hidden="true"> →</span>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer — expand indicator */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-[var(--color-border)]">
              <motion.span
                aria-hidden="true"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[var(--color-text-ghost)] text-lg leading-none select-none"
              >
                +
              </motion.span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
