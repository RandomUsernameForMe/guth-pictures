# Module: Business portraits

Landing page firemních portrétů: `/[locale]/firemni-portrety` (veřejná, v sitemapě).

## Kde co je

- `copy.ts` — statické texty CS/EN (hero, use cases, kroky, FAQ) + Cloudinary ID fotek (`HEADSHOT_IDS`, `AT_WORK_IDS`; prázdný string = šrafovaný placeholder)
- Ceník — **admin** (`/admin/obsah` → Firemní portréty), uložený v KV jako `content:{locale}.sluzby.business` (`packages`, `extras` = příplatky, `note`). Starší KV data bez `business` doplní `normalizeContent` z defaultů.
- Stránka: `app/[locale]/firemni-portrety/page.tsx`; karta na `/sluzby` odkazuje sem

## Vazby

- FAQ odpovídá smlouvě `smlouva-business-portrety.md` (licence, storno, dodání) — měnit obojí
- Formulář = sdílený `ContactForm` (`?package=&service=` předvyplní zprávu), sticky CTA = `StickyContactCta` (potřebuje `#hero` a `#kontakt`)
