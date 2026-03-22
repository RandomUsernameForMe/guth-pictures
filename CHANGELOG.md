## [2026-03-22] - UI polish: Nav, BlogPostCard, Footer, PortfolioFilter, Lightbox

- Nav: aktivní locale zvýrazněn (text-white font-medium), mobile menu s AnimatePresence animací
- BlogPostCard: vertikální layout, date + separator linka, animated ArrowRight, hover scale na obrázku
- Footer: přidány quick nav linky (Portfolio, Blog, Kontakt) + email odkaz, logo + tagline vlevo
- PortfolioFilter: konzistentní border na inactive buttonech (opravena nekonzistentní třída na span)
- Lightbox: X, ChevronLeft, ChevronRight z lucide-react místo Unicode znaků

## [2026-03-22] - UI: service cards s ikonami + numbered pattern, SelectedWork header

- Service cards: přidány ikony (Camera/Heart/Sword), mono číslování 001–003, flex layout s ikonou i textem
- SelectedWork: přidán h2 nadpis "Vybraná práce" / "Selected work" (přeloženo v cs.json + en.json)

## [2026-03-21] - hero foto jako fixovaný background, průhledný nav na home stránce

## [2026-03-21] - Blog sekce

- `lib/blog.ts`: CRUD nad Vercel KV (getBlogPosts, getBlogPost, saveBlogPost, deleteBlogPost)
- `app/[locale]/blog/page.tsx`: seznam publikovaných příspěvků
- `app/[locale]/blog/[slug]/page.tsx`: detail příspěvku s Markdown renderingem (`react-markdown`)
- `components/BlogPostCard.tsx`: karta příspěvku s cover obrázkem
- `components/admin/BlogEditor.tsx`: CRUD editor v admin panelu (CS/EN, draft/publish, slug auto-gen)
- `app/api/admin/blog/route.ts` + `[id]/route.ts`: API pro blog
- Nav: přidán odkaz „Blog", blog stránky mají stejný nav jako portfolio
- `app/globals.css`: přidány styly `.blog-content` pro Markdown rendering
- Překlady: `blog.*` klíče přidány do cs.json a en.json

## [2026-03-06] - Přímý upload fotek na Cloudinary bez komprese

- Nový endpoint `/api/admin/upload-signature` generuje signed upload params
- `AdminDashboard.tsx`: klient uploaduje přímo na `api.cloudinary.com` — bez client-side komprese, plná kvalita
- Odstraněna závislost `browser-image-compression`
- Testy aktualizovány (8 testů pro nový direct upload flow)

## [2026-03-06] - Testy: AnimatedSection, HeroSection, PortfolioFilter, Lightbox

- `__tests__/visual-components.test.tsx`: 25 testů pro nové vizuální komponenty
- AnimatedSection (2 testy), HeroSection (4), PortfolioFilter (6), Lightbox (13)
- Fix: Lightbox close button přidal `stopPropagation()` (event bubbloval na backdrop → double call)

## [2026-03-06] - Vizuální vylepšení: animace, hero, lightbox navigace, scroll reveal

- Framer Motion nainstalován
- `AnimatedSection.tsx`: reusable scroll reveal wrapper (whileInView)
- `HeroSection.tsx`: hero s Framer Motion animací textu, scroll indicator, připraveno na Cloudinary bg foto
- `SelectedWork.tsx`: bento grid sekce z Cloudinary fotek (první 3–6), hover efekty, scroll reveal
- `Nav.tsx`: průhledný na top, po scrollu bg-black/80 backdrop-blur
- `PhotoGrid.tsx`: hover scale + overlay na každé fotce
- `Lightbox.tsx`: navigace šipkami (klávesy + tlačítka), AnimatePresence animace
- `PortfolioFilter.tsx`: animovaný aktivní pill přes `layoutId`
- `app/[locale]/page.tsx`: HeroSection, SelectedWork (graceful fallback), about 2-column layout, AnimatedSection wrappery

## [2026-03-06] - Testy: auth-edge a AdminDashboard komprese

- `__tests__/auth-edge.test.ts`: 11 testů pro signToken/verifyToken (roundtrip, expiraci, tampered token, chybějící secret)
- `__tests__/AdminDashboard-compression.test.tsx`: 7 testů pro novou kompresní logiku (parametry, komprimovaný soubor na API, status přechody, chybové stavy)

## [2026-03-06] - Komprese obrázků v browseru před uploadem

- `browser-image-compression` instalováno
- `AdminDashboard`: fotky > 3MB se automaticky zkomprimují před odesláním (max 3MB / 4000px)
- Status `"compressing"` přidán do `FileStatus`, vizuální feedback v thumbnail preview

## [2026-03-05] - Fix: login API route blokována intl middlewarem

- `proxy.ts`: přidáno early return pro `/api` cesty (intl middleware přidával locale prefix → 404)
- `proxy.ts`: matcher rozšířen o `/api/admin/:path*`

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
