# Module: Admin

CMS panel — správa obsahu celého webu. Nadmodul propojující gallery, blog a homepage.

## Co dělá

- Autentizovaný admin panel na `/admin/*`
- Správa galerií (vytvoření, sync s Lightroom, tagy)
- Správa blogových článků (editor s Markdown preview)
- Úprava obsahu homepage (texty, obrázky, pricing)
- Správa tématu webu (barvy)
- Upload fotek přes Cloudinary

## Struktura

```
modules/admin/
├── components/
│   ├── AdminShell.tsx       # wrapper s autentizací (ověří cookie, jinak redirect na login)
│   ├── AdminNav.tsx         # boční navigace admin panelu
│   ├── AdminDashboard.tsx   # přehledový dashboard (statistiky)
│   ├── BlogEditor.tsx       # editor článků (Markdown + preview + upload cover)
│   ├── ContentEditor.tsx    # editor obsahu homepage
│   ├── ThemeEditor.tsx      # editor barev tématu
│   ├── GalerieList.tsx      # seznam galerií
│   └── GalerieDetail.tsx    # detail galerie (fotky, Lightroom sync, výběry klientů)
├── lib/
│   └── content.ts           # CRUD obsahu homepage v Vercel KV
├── __tests__/
│   ├── login-route.test.ts
│   ├── upload-route.test.ts
│   ├── content-route.test.ts
│   └── AdminDashboard-compression.test.tsx
└── MODULE.md
```

## Admin Routes (app/admin/)

| Route | Komponenta | Účel |
|-------|-----------|------|
| `/admin` | AdminDashboard | Přehled |
| `/admin/login` | — | Login formulář |
| `/admin/blog` | BlogEditor | Správa článků |
| `/admin/galerie` | GalerieList | Seznam galerií |
| `/admin/galerie/[slug]` | GalerieDetail | Detail galerie |
| `/admin/fotky` | — | Upload fotek |
| `/admin/obsah` | ContentEditor | Obsah homepage |
| `/admin/tema` | ThemeEditor | Barvy tématu |

## API Routes (app/api/admin/)

| Route | Účel |
|-------|------|
| `POST /api/admin/login` | Přihlášení (bcrypt verify, vydá JWT cookie) |
| `POST /api/admin/logout` | Odhlášení (smaže cookie) |
| `POST /api/admin/upload` | Upload fotky na Cloudinary |
| `GET /api/admin/upload-signature` | Podpis pro client-side upload |
| `GET /api/admin/images` | Seznam fotek na Cloudinary |
| `DELETE /api/admin/delete` | Smazání fotky z Cloudinary |
| `POST /api/admin/toggle-selected` | Označení fotky jako selected |
| `GET/POST /api/admin/content` | Obsah homepage |
| `GET/POST /api/admin/theme` | Barvy tématu |
| `POST /api/admin/email` | Update kontaktního emailu |
| `POST /api/admin/revalidate` | ISR revalidace cache |

## Závislosti

**Vyžaduje (shared lib):**
- `@/lib/auth` — JWT cookie (signToken, authCookieConfig)
- `@/lib/kv` — Vercel KV store
- `@/lib/cloudinary` — upload
- `@/lib/cloudinary-utils` — typy, URL helpers
- `@/lib/theme` — čtení/zápis barev
- `@/lib/config` — konfigurace

**Závilosti na jiných modulech:**
- `@/modules/gallery/lib/gallery` — správa galerií
- `@/modules/gallery/lib/lightroom` — Lightroom sync
- `@/modules/blog/lib/blog` — správa článků
- `@/modules/admin/lib/content` — obsah homepage

## Autentizace

Middleware (`middleware.ts`) chrání všechny `/admin/*` a `/api/admin/*` routy. Ověřuje JWT cookie (`auth-token`). Login route vydá token přes `POST /api/admin/login`.

`AdminShell.tsx` dělá server-side ověření — redirect na `/admin/login` pokud token chybí nebo je neplatný.
