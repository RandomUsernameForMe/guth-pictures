# Module: Homepage

Hlavní stránka webu — landing page, portfolio showcase, kontakt. Propojuje ostatní moduly vizuálně.

## Co dělá

- Landing page fotografa (`/[locale]`)
- Hero sekce s animovaným textem a ambientním glow efektem
- Portfolio sekce s filtrováním fotek dle kategorie
- Scroll velocity strip a word reveal animace
- Service cards (nabídka služeb)

## Struktura

```
modules/homepage/
├── components/
│   ├── HeroSection.tsx          # hero s fotkou, animovaným textem
│   ├── SelectedWork.tsx         # výběr nejlepších fotek
│   ├── ServiceCards.tsx         # karty služeb (typy focení)
│   ├── ScrollVelocityStrip.tsx  # horizontální scroll strip
│   ├── WordReveal.tsx           # animace odhalování slov
│   ├── AmbientGlow.tsx          # ambient glow efekt za hero
│   └── PortfolioFilter.tsx      # filtrování portfolio fotek
├── __tests__/
│   ├── PortfolioFilter.test.tsx
│   └── visual-components.test.tsx
└── MODULE.md
```

## Přístupová cesta

`/[locale]` — lokalizovaná homepage (cs/en). Portfolio page (`/[locale]/portfolio`) používá stejné komponenty.

## Závislosti

**Vyžaduje (shared lib):**
- `@/lib/content` (přes `modules/admin/lib/content`) — načítání obsahu (texty, obrázky)
- `@/lib/cloudinary-utils` — typy fotek, URL helpers
- `@/lib/config` — siteUrl, ogImage

**Závilost na jiném modulu:**
- `@/modules/gallery/components/PhotoGrid` — PortfolioFilter používá PhotoGrid pro zobrazení fotek

**Importován z:**
- `app/[locale]/page.tsx`
- `app/[locale]/portfolio/page.tsx`

## Obsah

Texty a obrázky na homepage se spravují přes admin panel (`/admin/obsah`). Data jsou uložena v Vercel KV přes `modules/admin/lib/content.ts`.
