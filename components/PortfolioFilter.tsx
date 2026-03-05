"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PhotoGrid } from "./PhotoGrid";
import { CATEGORIES, type GalleryPhoto } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  locale: string;
};

export function PortfolioFilter({ photos, locale }: Props) {
  const t = useTranslations("portfolio");
  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? photos.filter((p) => p.category === active) : photos;

  return (
    <div>
      <div className="flex gap-3 mb-10 flex-wrap">
        <button
          onClick={() => setActive(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === null
              ? "bg-white text-black"
              : "text-gray-400 hover:text-white border border-white/20 hover:border-white/50"
          }`}
        >
          {t("filterAll")}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active === cat
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white border border-white/20 hover:border-white/50"
            }`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>
      <PhotoGrid photos={filtered} locale={locale} />
    </div>
  );
}
