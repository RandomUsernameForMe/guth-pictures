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
│   ├── GalleryClient.tsx    # hlavní klientský UI (autentizace, zobrazení, výběr)
│   ├── PhotoGrid.tsx        # grid fotek s lazy loadingem
│   └── Lightbox.tsx         # fullscreen náhled fotky
├── lib/
│   ├── gallery.ts           # CRUD galerií v Vercel KV (listGalleries, getGallery, setGalleryPhotos…)
│   ├── gallery-auth.ts      # JWT tokeny pro přístup ke galerii (signGalleryToken, verifyGalleryToken)
│   └── lightroom.ts         # Adobe Lightroom API (OAuth2, listAlbums, getAlbumAssets, streaming)
└── __tests__/
```

## API Routes

| Route | Účel |
|-------|------|
| `GET /api/gallery/[slug]` | Info o galerii (veřejné) |
| `POST /api/gallery/[slug]/auth` | Ověření hesla, vydání JWT cookie |
| `GET /api/gallery/[slug]/photos` | Seznam fotek (vyžaduje JWT) |
| `POST/DELETE /api/gallery/[slug]/selection` | Správa výběru klienta |
| `GET/POST /api/admin/gallery` | CRUD galerií (admin) |
| `GET/PUT /api/admin/gallery/[slug]` | Detail/update galerie |
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

Každá galerie má heslo (bcrypt hash v KV). Klient pošle heslo → API vydá JWT cookie (`gallery-token`) → cookie ověřuje každý request na fotky/selection. Token vyprší s galerií (`expiresAt`).
