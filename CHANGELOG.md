## [2026-03-27] - fix(admin): hvězdička vždy klikatelná, title linkuje na homepage

- Hvězdička (Selected Work) dostala `z-10` — overlay ji už nepřekrývá při hoveru
- Neoznačené fotky mají hvězdičku vždy viditelnou (ztlumená), ne jen při hoveru
- Titulek "Admin — Guth Pictures" je klikatelný link na "/"

## [2026-03-27] - feat: auto-komprese fotek při uploadu + kvalitnější hero

- Upload: Canvas-based komprese v prohlížeči (max 4000px, JPEG 88%) — nahrát jde jakákoliv fotka z foťáku
- Limit zvýšen na 100 MB (raw vstup, před kompresí)
- Hero: transformace `w_2560,q_90,e_sharpen:60` místo `w_1920,q_auto`

## [2026-03-27] - feat: výběr fotek do Selected Work v adminu + větší karty carouselu

- Admin: hvězdičkový toggle na každé fotce označí ji jako Selected Work (Cloudinary tag `selected_work`)
- Nový API endpoint `/api/admin/toggle-selected` (POST) pro přidání/odebrání tagu
- `SelectedWork`: filtruje dle `selected` flagu, fallback na prvních 10 pokud nic není označeno
- `GalleryPhoto` type: přidáno volitelné pole `selected?: boolean`
- `lib/cloudinary.ts`: fetchuje tagy z Cloudinary, mapuje `selected_work` na `selected`
- Karty carouselu zvětšeny z 210×290 na 270×370 px

## [2026-03-27] - fix: server-only nelze importovat z Client Component

- Typy `ColorSet`, `ThemeColors` a `defaultColors` přesunuty do `lib/theme-types.ts` (bez server-only)
- `lib/theme.ts` re-exportuje typy z `theme-types.ts`, zachovává `server-only` pro KV logiku
- `ThemeEditor.tsx` importuje z `lib/theme-types.ts`
- `ServiceCards`: odebrány nepoužívané props, přidány aria atributy pro přístupnost

## [2026-03-27] - Admin: editor barev dark/light motivu

- Nová admin sekce `/admin/tema` s color pickery pro 9 CSS proměnných × 2 motivy
- Barvy uloženy v Vercel KV, injektovány jako `<style>` tag v layoutu
- Live preview při změně barvy, Reset na default hodnoty
- API route `GET/POST/DELETE /api/admin/theme` s hex validací

## [2026-03-26] - ServiceCards: inline expand balíčků

- Karty služeb jsou klikatelné, klik rozbalí balíčky přímo v kartě (accordion)
- Více karet lze mít rozbalených současně, druhý klik sbalí danou kartu
- Odstraněny portfolio linky z karet
- Odstraněn globální detail view (nahrazen inline expandem)

## [2026-03-26] - Navbar: fix čitelnosti textu nad hero v light módu

- Nav na hero stránce nyní vždy používá světlý text (přepis CSS vars inline), protože hero foto je vždy tmavé

## [2026-03-26] - Navbar: odstraněn hardcoded gradient, top overlay přesunut na hero

- Nav nahoře průhledný (backdrop-blur-sm), bez hardcoded black gradientu
- Top overlay přesunut do HeroSection, theme-aware přes --color-bg

## [2026-03-26] - Lightbox v carouselu na homepage

- Kliknutí na fotku v `SelectedWork` otevře `Lightbox` s navigací a klávesovými zkratkami

## [2026-03-26] - Opravy z code review

- `key={pkg.id}` místo `key={i}` v PackageEditor — stabilní klíče při mazání balíčků
- `selectedService!` assertions odstraněny — TypeScript narrowing přes `selectedService !== null`
- `filter(Boolean)` na includes při renderování — prázdné řádky z textarey nevyrobí prázdné `<li>`
- Délkové limity v content validaci (MAX_SHORT 200, MAX_LONG 2000, MAX_PACKAGES 10, MAX_INCLUDES 20)
- `isServiceContent`: packages volitelné pro backward compat, includes items validovány jako string
- Backward compat: `getContent` normalizuje KV data — doplní `packages: []` a `id` pokud chybí
- Logout cookie — přidány `httpOnly`, `secure`, `sameSite` při mazání
- Login rate limit fail-closed v produkci bez KV; chybějící `ADMIN_PASSWORD_HASH` vrací 401 místo 500
- `AdminNav`: startsWith fix (`href + "/"`) + `aria-current="page"`

## [2026-03-26] - Admin rozdělen na podstránky

- `/admin` → redirect na `/admin/fotky`
- `/admin/fotky` — správa fotek
- `/admin/obsah` — editor textů a ceníku
- `/admin/blog` — editor blogu
- Sdílený `AdminShell` (auth check + header + nav tabs)

## [2026-03-26] - Ceník editovatelný z adminu

- Ceníková data přesunuta z messages do KV storage (`lib/content.ts`)
- Sdílený typ `PricingPackage` v `lib/types.ts`
- `ContentEditor` rozšířen o editor balíčků (název, cena, délka, co zahrnuje, poznámka) pro každou službu
- Validace v `/api/admin/content` rozšířena o strukturu packages

## [2026-03-26] - Rozbalovací ceník na kartách služeb

- Nová komponenta `ServiceCards` — každá karta má tlačítka „Portfolio" a „Ceník"
- Klik na Ceník animovaně vymění mřížku karet za panel s balíčky (framer-motion AnimatePresence)
- Ceníková data v `messages/cs.json` + `messages/en.json` (packages + note)

## [2026-03-25] - Film grain + ambient glow, sjednocení pozadí

- Odstraněn explicitní `bg-[var(--color-bg)]` z SelectedWork — carousel sdílí barvu body
- `body::after` — statický SVG feTurbulence grain (opacity 3.8% dark / 2.2% light), analogová textura
- `body` background-image — subtilní radial amber glow přes horní část stránky (přes hero přechod)

## [2026-03-25] - Odstraněn frosted glass, carousel omezen na max-width

- Sekce o-mne, sluzby, kontakt: `backdrop-blur-2xl bg-[var(--glass-bg)]` → solid `bg-[var(--color-bg-elevated)]`
- SelectedWork carousel obalén do `max-w-6xl mx-auto` — nepůjde přes stránkový limit, fade na okrajích kontejneru

## [2026-03-25] - Homepage: frosted glass sekce, theme-aware hero gradient

- Přidána CSS proměnná `--glass-bg` (dark: rgba(10,10,11,0.78), light: rgba(247,245,242,0.82))
- Hero overlay změněn z `from-black` na gradient pouze dole s `var(--color-bg)`, funguje v obou themes
- Hero texty a buttony přepsány na `--color-text` / `--color-bg` (žádný hardcoded white)
- Sekce o-mne, sluzby, kontakt mají `backdrop-blur-2xl bg-[var(--glass-bg)]` — frosted glass přes parallax pozadí

## [2026-03-25] - Dark/light mode: CSS variables, ThemeProvider, ThemeToggle v Navu

- Přidán `next-themes` s class-based přepínáním (dark default)
- CSS tokeny v `globals.css`: dvě sady (`dark` / `.light`), warm off-black dark, cream paper light
- Nové komponenty: `ThemeProvider.tsx`, `ThemeToggle.tsx` (Sun/Moon + Framer Motion fade)
- ThemeToggle v desktop navu (za lang switcher) + v mobile draweru
- Aktualizovány: Nav, Footer, BlogPostCard, ContactForm, PhotoGrid, ScrollVelocityStrip → CSS vars
- Cinematic sekce (SelectedWork, Lightbox) záměrně zachovány dark
- Globální color transitions 300ms ease, obrázky a SVG vyloučeny

## [2026-03-23] - AI blog generátor (Claude Code workflow)

- `scripts/post-article.ts` – CLI skript pro uložení článku do Vercel KV jako draft
- `lib/blog-topics.ts` – 25 předpřipravených SEO témat k fotografii (svatby, portréty, Brno, tipy)
- `tsx` přidán do devDependencies, npm script `post-article`

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

## [2026-03-26] - hero buttons: přejmenování a prohození pořadí
- "Napsat mi" → "Chci fotky" (CTA, primární, první)
- "Prohlédnout portfolio" → "Moje tvorba" (sekundární, druhý)
- en: "Book a shoot" / "My work"

## [2026-03-26] - hero nav scrim: neutrální black overlay místo --color-bg
- přidána proměnná --hero-scrim-top (dark: 0.65, light: 0.30 alpha)
- odstraněn efekt barevného pásu u navbaru v obou themes
