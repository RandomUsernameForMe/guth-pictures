"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PhotoGrid } from "./PhotoGrid";
import { CATEGORIES, type GalleryPhoto } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  locale: string;
};

export function PortfolioFilter({ photos, locale }: Props) {
  const t = useTranslations("portfolio");
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [active, setActive] = useState<string | null>(
    CATEGORIES.includes(initialCategory as typeof CATEGORIES[number]) ? initialCategory : null
  );

  const filtered = active ? photos.filter((p) => p.category === active) : photos;

  const btnClass = (isActive: boolean) =>
    `relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors overflow-hidden ${
      isActive ? "" : "border border-white/20 text-gray-400 hover:text-white hover:border-white/40"
    }`;

  return (
    <div>
      <div className="flex gap-3 mb-10 flex-wrap">
        <button onClick={() => setActive(null)} className={btnClass(active === null)}>
          {active === null && (
            <motion.span
              layoutId="active-filter"
              className="absolute inset-0 bg-white rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${active === null ? "text-black" : ""}`}>
            {t("filterAll")}
          </span>
        </button>

        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActive(cat)} className={btnClass(active === cat)}>
            {active === cat && (
              <motion.span
                layoutId="active-filter"
                className="absolute inset-0 bg-white rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={`relative z-10 ${active === cat ? "text-black" : ""}`}>
              {t(`categories.${cat}`)}
            </span>
          </button>
        ))}
      </div>
      <PhotoGrid photos={filtered} locale={locale} />
    </div>
  );
}
