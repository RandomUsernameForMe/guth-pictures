---
name: Client Gallery Module
description: Přehled modulu klientských galerií — zadání, architektura, použití, známé chyby a opravy
type: project
---

## Zadání

Fotograf potřebuje posílat klientům výběr fotek k odsouhlasení. Dosavadní workflow: WeTransfer link e-mailem.

**Požadavky:**
- Fotograf spravuje fotky v Lightroom cloud
- Klient dostane odkaz s heslem, prohlédne watermarkované náhledy, označí oblíbené
- Fotograf vidí výběr v adminu a jedním klikem otaguje vybrané fotky v Lightroomu (`client-selected` keyword)
- Max 5 aktivních galerií, max 300 fotek
- Galerie vyprší po N dnech (nastavitelné), po vypršení read-only
- Watermark: textový overlay "PREVIEW" přes Cloudinary URL transform

---

## Architektura

**Storage:** Vercel KV (Upstash Redis) — galerie, fotky, výběry  
**Foto zdroj:** Adobe Lightroom API (lr.adobe.io)  
**Foto hosting:** Cloudinary (existující infrastruktura)  
**Auth:** admin cookie (existující) + gallery session cookie (HMAC, per-gallery)

### KV datový model
```
gallery:{slug}           → GalleryRecord (metadata, hash hesla, expiry)
gallery:{slug}:photos    → GalleryPhoto[] (lrId, cloudinaryId, rozměry)
gallery:{slug}:selection → GallerySelection (favorites[], timestamps)
galleries:index          → Set<slug>
adobe:tokens             → AdobeTokens (accessToken, refreshToken, expiresAt)
```

### Soubory modulu
```
lib/lightroom.ts                              — Adobe API client
lib/gallery.ts                                — KV data layer
lib/gallery-auth.ts                           — gallery session tokeny (Web Crypto)
app/api/admin/lightroom/connect/route.ts      — OAuth start
app/api/admin/lightroom/callback/route.ts     — OAuth callback
app/api/admin/lightroom/albums/route.ts       — seznam alb z LR
app/api/admin/lightroom/status/route.ts       — je LR připojen?
app/api/admin/gallery/route.ts                — CRUD galerií
app/api/admin/gallery/[slug]/route.ts         — detail / smazání
app/api/admin/gallery/[slug]/sync/route.ts    — sync LR → Cloudinary
app/api/admin/gallery/[slug]/tag/route.ts     — tag v Lightroomu
app/api/gallery/[slug]/auth/route.ts          — ověření hesla klienta
app/api/gallery/[slug]/photos/route.ts        — fotky pro klienta
app/api/gallery/[slug]/selection/route.ts     — výběr klienta
app/admin/galerie/page.tsx                    — admin seznam galerií
app/admin/galerie/[slug]/page.tsx             — admin detail galerie
app/gallery/[slug]/page.tsx                   — klientská galerie
app/gallery/layout.tsx                        — layout pro /gallery/*
components/admin/GalerieList.tsx              — admin list + new gallery form
components/admin/GalerieDetail.tsx            — admin detail + sync + tag
components/GalleryClient.tsx                  — klientská galerie (password gate, grid, lightbox, favorites)
```

---

## Použití — admin workflow

1. `/admin/galerie` → klikni "Připojit Lightroom" (jednou, tokens se ukládají do KV)
2. Klikni "+ Nová galerie" → Načíst alba → vyber album → slug / heslo / platnost
3. Na detailu galerie → "↻ Sync z Lightroomu" — stáhne fotky z LR, nahraje do Cloudinary
4. Pošli klientovi odkaz: `yourdomain.com/gallery/{slug}` + heslo
5. Klient vybere fotky, uloží výběr
6. Admin vidí výběr v detailu galerie → klikni "★ Označit v Lightroomu" → přidá keyword `client-selected`
7. V Lightroomu filtruj podle `client-selected` → exportuj

---

## Použití — klient

1. Otevře `/gallery/{slug}`
2. Zadá heslo (cookie session na 30 dní)
3. Vidí watermarkované náhledy (Cloudinary text overlay "PREVIEW")
4. Klikne srdce na fotky → sticky save bar → "Uložit výběr"
5. Může se vrátit a výběr změnit dokud galerie nevyprší
6. Po vypršení stránka zobrazí "Galerie vypršela"

---

## Opravené chyby (chronologicky)

### 1. `jose` není v package.json
- **Příčina:** gallery auth routes importovaly `jose` (JWT lib), ale projekt používá vlastní Web Crypto implementaci
- **Oprava:** `lib/gallery-auth.ts` — vlastní HMAC token signing/verify stejným vzorem jako `lib/auth-edge.ts`

### 2. KV `smembers<string>` TypeScript error
- **Příčina:** `@vercel/kv` typový constraint `unknown[]` neumí `<string>`
- **Oprava:** `as string[]` cast

### 3. `Uint8Array` TypeScript error v gallery-auth.ts
- **Příčina:** stejný problém jako v existujícím `auth-edge.ts` — `Uint8Array<ArrayBufferLike>` vs `Uint8Array<ArrayBuffer>`
- **Oprava:** explicitní návratový typ `Uint8Array<ArrayBuffer>`

### 4. ADMIN_PASSWORD_HASH — špatné heslo
- **Příčina:** Next.js používá `dotenv-expand` — `$` znaky v hash byly expandovány jako proměnné. `node --env-file` expandovat neumí, takže test prošel ale Next.js selhal.
- **Oprava:** escape v `.env.local`: `ADMIN_PASSWORD_HASH="\$2b\$12\$..."`

### 5. Rate limit po opakovaných pokusech
- **Příčina:** 5 neúspěšných loginů = 15 min ban (in-memory nebo KV)
- **Oprava:** smazat klíč `ratelimit:login:unknown` z KV přes REST API

### 6. OAuth callback → "Unauthorized" (middleware)
- **Příčina:** `proxy.ts` (middleware) chrání všechny `/api/admin/*` routes. Callback přichází z Adobe jako cross-site redirect → `SameSite=Strict` admin cookie se nepošle → middleware vrátí 401.
- **Oprava:** přidat výjimku v `proxy.ts`: `pathname !== "/api/admin/lightroom/callback"`. Callback chráněn state parametrem (CSRF ochrana).

### 7. State cookie pro CSRF ochranu
- **Příčina:** callback neměl CSRF ochranu po odebrání admin cookie checku
- **Oprava:** `connect` nastavuje `adobe_oauth_state` cookie (`SameSite=lax`), callback verifikuje

### 8. Adobe 403 — špatný scope
- **Příčina:** první připojení proběhlo s `openid,AdobeID,offline_access` bez `lr_partner_apis` → token nemá přístup k Lightroom API
- **Oprava:** přidat `lr_partner_apis` do scopes, uživatel se znovu připojil

### 9. Adobe XSSI prefix `while (1) {}`
- **Příčina:** Adobe prefixuje JSON odpovědi anti-XSSI prefixem, `JSON.parse` selže
- **Oprava:** `lrFetch` stripuje prefix pro `Content-Type: application/json` odpovědi (ne pro binární renditions)

### 10. Missing root layout `/gallery/*`
- **Příčina:** `/gallery/[slug]` je mimo `[locale]` i `admin` segmenty — žádný layout s `<html>/<body>`
- **Oprava:** `app/gallery/layout.tsx`

### 11. LR album filter `subtype=project` příliš restriktivní
- **Příčina:** uživatelova alba měla jiný subtype
- **Oprava:** odstranit filtr, načíst všechna alba

---

### 12. Rendition 404 — špatné asset ID
- **Příčina:** album assets endpoint vrací resources kde `r.id` = album-asset relationship ID, ale rendition endpoint potřebuje `r.asset.id` = skutečné asset ID. Používali jsme `r.id`.
- **Oprava:** `getAlbumAssets` nyní čte `(r.asset as Record).id` jako asset ID

---

## Stav: funkční ✓

Sync z Lightroomu → Cloudinary funguje end-to-end.

---

## Adobe API poznámky

- Base URL: `https://lr.adobe.io`
- Token URL: `https://ims-na1.adobelogin.com/ims/token/v3`
- Auth URL: `https://ims-na1.adobelogin.com/ims/authorize/v2`
- Scopes: `openid,AdobeID,offline_access,lr_partner_apis`
- Všechny odpovědi prefixovány `while (1) {}` — nutno stripovat
- Refresh token se ukládá do KV, access token se auto-refreshuje
