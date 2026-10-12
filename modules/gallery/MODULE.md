# Module: Gallery

Klientská galerie — sdílení fotek s klienty, výběr fotek, synchronizace s Adobe Lightroom.

## Co dělá

- Zobrazuje galerie chráněné heslem (`/gallery/[slug]`)
- Umožňuje klientům vybírat fotky (selection) a stahovat je
- Spravuje galerie přes admin panel (`/admin/galerie/`)
- Synchronizuje fotky z Adobe Lightroom albumů přes OAuth2

## Struktura

```
modules/gallery/
├── components/
│   ├── GalleryClient.tsx        # hlavní klientský UI (zobrazení, výběr)
│   ├── PasswordGate.tsx         # formulář hesla
│   ├── PhotoGrid.tsx            # grid fotek s lazy loadingem
│   ├── Lightbox.tsx             # fullscreen náhled fotky
│   ├── ClientLightbox.tsx       # lightbox klientské galerie s výběrem
│   ├── HeartIcon.tsx
│   ├── SaveSelectionButton.tsx
│   └── __tests__/GalleryClient.test.tsx
├── hooks/
│   └── useGallerySelection.ts   # stav výběru fotek
└── lib/
    ├── gallery.ts               # CRUD galerií v Vercel KV (listGalleries, getGallery, setGalleryPhotos…)
    ├── gallery-auth.ts          # HMAC tokeny pro přístup ke galerii (signGalleryToken, verifyGalleryToken, galleryCookieName)
    ├── gallery-session.ts       # hasGallerySession
    ├── lightroom.ts             # Adobe Lightroom API (OAuth2, listAlbums, getAlbumAssets, streaming)
    ├── selection-filter.ts      # filtrování výběru
    ├── selection-export.ts      # export názvů souborů z výběru
    ├── watermarked-url.ts       # URL fotek s vodoznakem
    └── __tests__/               # selection-filter.test.ts, selection-export.test.ts
```

## API Routes

| Route | Účel |
|-------|------|
| `POST /api/gallery/[slug]/auth` | Ověření hesla, vydání cookie `gallery-session-{slug}` (410 při vypršení) |
| `GET /api/gallery/[slug]/photos` | Seznam fotek a `maxSelection` (vyžaduje cookie, 401 / 404 / 410 při vypršení) |
| `GET/POST /api/gallery/[slug]/selection` | Načtení/uložení výběru klienta (POST vrací 410 po vypršení) |
| `GET/POST /api/admin/gallery` | CRUD galerií (admin) |
| `GET/DELETE /api/admin/gallery/[slug]` | Detail/smazání galerie |
| `POST /api/admin/gallery/[slug]/sync` | Sync z Lightroomu |
| `POST /api/admin/gallery/[slug]/tag` | Přidání tagu k fotce |
| `GET /api/admin/lightroom/status` | Stav Lightroom spojení |
| `GET /api/admin/lightroom/albums` | Seznam albumů z LR |
| `GET /api/admin/lightroom/connect` | OAuth2 redirect |
| `GET /api/admin/lightroom/callback` | OAuth2 callback |

## Závislosti

**Vyžaduje (shared lib):**
- `@/lib/cloudinary` — upload a URL generování fotek
- `@/lib/cloudinary-utils` — typy (GalleryPhoto), URL helpers
- `@/lib/kv` — Vercel KV store (persistence)
- `@/lib/auth` — admin autentizace
- `@/lib/config` — siteUrl

**Importován z:**
- `app/gallery/[slug]/page.tsx` — public gallery page
- `app/admin/galerie/` — admin UI
- `app/api/gallery/` a `app/api/admin/gallery/` — API routes
- `modules/admin/components/GalerieList.tsx`, `GalerieDetail.tsx`
- `modules/homepage/components/PortfolioFilter.tsx` — PhotoGrid sdílen s portfolio

## Lightroom OAuth2 Flow

1. Admin klikne "Připojit Lightroom" → `/api/admin/lightroom/connect` (redirect na Adobe)
2. Adobe redirectuje na `/api/admin/lightroom/callback` (uloží tokeny do KV)
3. Tokeny se auto-refreshují v `lightroom.ts` při každém API volání
4. Sync albumu: `/api/admin/gallery/[slug]/sync` stáhne assety z LR a uloží do galerie

## Autentizace galerií

Každá galerie má heslo (bcrypt hash v KV). Klient pošle heslo → API vydá cookie `gallery-session-{slug}` (`galleryCookieName`) → cookie ověřuje každý request na fotky/selection. Není to JWT, ale HMAC token z `gallery-auth.ts` (`signGalleryToken` / `verifyGalleryToken`, payload `slug:timestamp:uuid`), `maxAge` 30 dní. Token s galerií nevyprší — vypršení (`expiresAt`) hlídají routy přes `isExpired` a vrací 410.
