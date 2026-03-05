## [2026-03-05] - SEO

- `generateMetadata` na všech stránkách (CZ/EN) — title, description, openGraph
- `app/sitemap.ts` — sitemap.xml s hreflang alternativami
- `app/robots.ts` — robots.txt (blokuje /admin a /api/)
- JSON-LD schema (LocalBusiness) v locale layoutu
- `messages/*.json` — přidána sekce `meta` s titulky a popisy pro každou stránku
- Layout: `metadataBase` + title template

## [2026-03-05] - Kontaktní formulář (Formspree)

- `components/ContactForm.tsx` — formulář s validací, loading stavem, success/error zprávou
- `app/[locale]/kontakt/page.tsx` — zapojení ContactForm
- Přidány překlady `sending`, `success`, `error` do cs.json a en.json
- `.env.local` — přidáno `NEXT_PUBLIC_FORMSPREE_FORM_ID`

## [2026-03-05] - Admin rozhraní

- `lib/auth.ts` — cookie-based autentizace (ADMIN_PASSWORD, 8h session)
- `proxy.ts` — rozšířen o admin ochranu (redirect na /admin/login)
- `app/admin/layout.tsx` — vlastní layout bez locale/Nav/Footer
- `app/admin/login/page.tsx` — přihlašovací formulář
- `app/admin/page.tsx` — dashboard (seznam fotek, upload, smazání)
- `components/AdminDashboard.tsx` — klientská komponenta pro správu fotek
- `app/api/admin/login|logout|upload|delete` — API routes
- `lib/cloudinary.ts` — přesunuto na server-only (`import "server-only"`)
- `lib/cloudinary-utils.ts` — klientsky bezpečné utility (URL helpers, typy)
- `next.config.ts` — přidáno `serverExternalPackages: ["cloudinary"]`

## [2026-03-05] - Cloudinary integrace + portfolio grid

- `lib/cloudinary.ts` — Cloudinary client, `getGalleryPhotos()`, `cloudinaryUrl()`, `blurUrl()`
- `components/PhotoGrid.tsx` — masonry grid přes CSS columns, `next/image` s blur placeholder
- `app/[locale]/portfolio/page.tsx` — načítá fotky ze Cloudinary, renderuje PhotoGrid
- `next.config.ts` — přidána doména `res.cloudinary.com` pro next/image
- `.env.local` — šablona s proměnnými (vyplnit Cloudinary credentials)

## [2026-03-05] - Obsah stránek: Home, O mně, Služby

- Texty pro Home (hero sekce, 2 CTA tlačítka), O mně (bio, CTA) a Služby (3 karty: portréty, svatby, larpy)
- Brand: Guth Pictures, Praha + cestování po ČR
- Aktualizovány messages/cs.json a messages/en.json
- Footer přejmenován na "Guth Pictures"

## [2026-03-05] - UI komponenty: Nav a Footer

- `components/Nav.tsx` — navigace s locale-aware linky, aktivní stav, přepínač CZ/EN
- `components/Footer.tsx` — copyright s rokem, tagline
- `i18n/navigation.ts` — typované next-intl navigation helpers (Link, usePathname, useRouter)
- Přidány `footer` překlady do cs.json a en.json
- Nav a Footer zapojeny do `app/[locale]/layout.tsx`

## [2026-03-05] - Základ: next-intl, locale routing, folder struktura

- Nainstalováno `next-intl`
- Vytvořen locale routing CZ/EN (`i18n/routing.ts`, `i18n/request.ts`, `proxy.ts`)
- Přidán `withNextIntl` plugin do `next.config.ts`
- Vytvořeny překlady `messages/cs.json` + `messages/en.json`
- Folder struktura: `app/[locale]/` s placeholder stránkami (home, portfolio, sluzby, o-mne, kontakt)
- `app/admin/page.tsx` (placeholder, bez locale)
- Root layout zjednodušen, locale layout s NextIntlClientProvider a dark theme
