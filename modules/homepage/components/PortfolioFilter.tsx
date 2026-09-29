"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PhotoGrid } from "@/modules/gallery/components/PhotoGrid";
import { CATEGORIES, type GalleryPhoto } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  locale: string;
};

function QueryCategory({ onChange }: { onChange: (category: string | null) => void }) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  useEffect(() => {
    onChange(CATEGORIES.includes(category as typeof CATEGORIES[number]) ? category : null);
  }, [category, onChange]);
  return null;
}

export function PortfolioFilter({ photos, locale }: Props) {
  const t = useTranslations("portfolio");
  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? photos.filter((p) => p.category === active) : photos;

  const btnClass = (isActive: boolean) =>
    `relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors overflow-hidden ${
      isActive ? "" : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)]"
    }`;

  return (
    <div>
      <Suspense fallback={null}>
        <QueryCategory onChange={setActive} />
      </Suspense>
      <div className="flex gap-3 mb-10 flex-wrap">
        <button onClick={() => setActive(null)} className={btnClass(active === null)}>
          {active === null && (
            <motion.span
              layoutId="active-filter"
              className="absolute inset-0 bg-[var(--color-text)] rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${active === null ? "text-[var(--color-bg)]" : ""}`}>
            {t("filterAll")}
          </span>
        </button>

        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActive(cat)} className={btnClass(active === cat)}>
            {active === cat && (
              <motion.span
                layoutId="active-filter"
                className="absolute inset-0 bg-[var(--color-text)] rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={`relative z-10 ${active === cat ? "text-[var(--color-bg)]" : ""}`}>
              {t(`categories.${cat}`)}
            </span>
          </button>
        ))}
      </div>
      <PhotoGrid photos={filtered} locale={locale} />
    </div>
  );
}
