## [2026-03-05] - Security: HMAC auth token, rate limiting, MIME validace

- `lib/auth-edge.ts` (nový): Edge-compatible HMAC-SHA256 sign/verify token
- `lib/auth.ts`: cookie hodnota "1" → podepsaný HMAC token; `authCookieConfig(token)`
- `proxy.ts`: async middleware, ověření HMAC tokenu místo `=== "1"`
- `app/api/admin/login/route.ts`: timing-safe compare (`crypto.timingSafeEqual`), rate limiting 5/15min přes Vercel KV, logování neúspěšných pokusů
- `app/api/admin/upload/route.ts`: MIME validace magic bytes (JPEG/PNG/WebP/GIF), file null-check, odstraněna duplicitní Cloudinary konfigurace

Vyžaduje novou env proměnnou: `AUTH_SECRET` (náhodný string, min 32 znaků)

## [2026-03-05] - UI vylepšení — typografie, spacing, interaktivita

- `Nav.tsx`: logo "Guth Pictures" + hover efekt
- `page.tsx`: hero text-6xl/7xl, padding py-32/40, CTA px-8 py-4; o-mne border-t separator + mt-12 bio; sluzby karty hover efekt + group class
- `ContactForm.tsx`: space-y-6, label font-medium, focus:ring, success/error styled div boxy, placeholdery
- `messages/cs.json` + `en.json`: přidány namePlaceholder, emailPlaceholder, messagePlaceholder
- `portfolio/page.tsx`: přepsán na getTranslations server API, intro sekce pt-32 pb-16
- `PhotoGrid.tsx`: md:columns-3 lg:columns-4 breakpointy, gap-4, figure wrapper s bg-zinc-900

## [2026-03-05] - Editace textů z adminu (Vercel KV)

- `lib/content.ts`: ContentData typ, getContent(locale) s KV fallbackem na JSON defaults, setContent(locale, data)
- `app/api/admin/content/route.ts`: GET + POST s auth checkem a revalidatePath
- `components/admin/ContentEditor.tsx`: client komponenta, tabs CZ/EN, formulář pro Hero / O mně / Služby
- `app/[locale]/page.tsx`: async server komponenta, editovatelné texty z getContent(), UI strings z getTranslations()
- `app/admin/page.tsx`: přidán ContentEditor

## [2026-03-05] - Zjednodušení na 2 stránky

- Home page rozšířena o sekce #o-mne, #sluzby, #kontakt (single-page scroll)
- Nav.tsx: anchor linky na home, jiná navigace na /portfolio
- Smazány podstránky: /o-mne, /sluzby, /kontakt
- Sitemap aktualizována (jen / a /portfolio)
- Messages: odstraněny orphan meta záznamy pro smazané stránky

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
