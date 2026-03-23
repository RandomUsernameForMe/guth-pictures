# Code Review — Guth Pictures
**Datum:** 2026-03-23
**Projekt:** Next.js 16.1.6, React 19, TypeScript, Tailwind v4, next-intl v4, Cloudinary, Vercel KV, Framer Motion, Vitest
**Agenti:** Frontend, Backend, QA, Security, UX/UI, Architect, Next.js, State Complexity

---

## 🚨 Ihned (do 1 dne)

### I-01. ADMIN_PASSWORD uložen jako plaintext v env
**Závažnost:** CRITICAL | **Effort:** M | **Oblast:** Security / Backend
Heslo administrátora je porovnáváno přímo s hodnotou `process.env.ADMIN_PASSWORD` bez hashování. Útočník s přístupem k `.env` souboru nebo leak logu ihned získá plný přístup.
**Soubor:** `app/api/admin/login/route.ts`
**Oprava:**
```ts
// Při inicializaci (CLI nebo seed script):
// ADMIN_PASSWORD_HASH=$(node -e "const b=require('bcryptjs');console.log(b.hashSync(process.env.ADMIN_PASSWORD,12))")
// Uložit ADMIN_PASSWORD_HASH do env (nikdy plaintext heslo)

import bcrypt from 'bcryptjs';

const hash = process.env.ADMIN_PASSWORD_HASH;
if (!hash) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
const valid = await bcrypt.compare(password, hash);
if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

---

### I-02. Cloudinary upload-signature vrací podpis klientovi bez dostatečné autorizace
**Závažnost:** CRITICAL | **Effort:** S | **Oblast:** Security / Backend
Endpoint `/api/admin/upload-signature` nevyžaduje ověřenou session — kdokoliv může vyvolat podpis a nahrát soubory do Cloudinary účtu. Navíc chybí `CLOUDINARY_API_SECRET` guard a celá logika není v try/catch.
**Soubor:** `app/api/admin/upload-signature/route.ts`
**Oprava:**
```ts
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder: 'gallery' }, secret);
    return NextResponse.json({ signature, timestamp });
  } catch (err) {
    console.error('Signature error:', err);
    return NextResponse.json({ error: 'Signature failed' }, { status: 500 });
  }
}
```

---

### I-03. Chybí publicId validace v delete route — SSRF / path traversal
**Závažnost:** CRITICAL | **Effort:** S | **Oblast:** Security / Backend
`/api/admin/delete` přijímá `publicId` bez regex validace a předává ho přímo do Cloudinary SDK. Útočník může odeslat libovolný řetězec (např. `../../secret`) a zkusit smazat cizí assety.
**Soubor:** `app/api/admin/delete/route.ts`
**Oprava:**
```ts
const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-\/]+$/;

const { publicId } = await request.json();
if (!publicId || typeof publicId !== 'string' || !CLOUDINARY_ID_RE.test(publicId)) {
  return NextResponse.json({ error: 'Invalid publicId' }, { status: 400 });
}
```

---

### I-04. Chybí error.tsx a loading.tsx — unhandled errors = bílá stránka
**Závažnost:** CRITICAL | **Effort:** S | **Oblast:** Next.js / UX
Bez `app/[locale]/error.tsx` vede jakákoliv server-side chyba k prázdné/bílé stránce místo uživatelsky přívětivé chybové obrazovky. Stejně tak chybí `loading.tsx` pro skeleton/spinner.
**Soubor:** `app/[locale]/` (chybí oba soubory)
**Oprava:**
```tsx
// app/[locale]/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Něco se pokazilo</h1>
      <p className="text-sm text-zinc-400">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-white text-black rounded">
        Zkusit znovu
      </button>
    </main>
  );
}

// app/[locale]/loading.tsx
export default function Loading() {
  return <div className="min-h-screen flex items-center justify-center">
    <span className="animate-pulse text-zinc-500">Načítám…</span>
  </div>;
}
```

---

### I-05. PhotoGrid: figure s onClick bez klávesnicové obsluhy — WCAG 2.1 AA porušení
**Závažnost:** CRITICAL | **Effort:** S | **Oblast:** UX/UI / Accessibility
`<figure>` element s click handlerem nemá `tabIndex`, `role="button"` ani `onKeyDown`. Uživatelé s klávesnicí nebo screen readerem nemohou otevřít lightbox.
**Soubor:** `components/PhotoGrid.tsx`
**Oprava:**
```tsx
<figure
  role="button"
  tabIndex={0}
  aria-label={`Otevřít foto ${photo.alt}`}
  onClick={() => openLightbox(index)}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openLightbox(index)}
  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
>
```

---

### I-06. Login page: password input bez `<label>` — WCAG 2.1 AA porušení
**Závažnost:** CRITICAL | **Effort:** XS | **Oblast:** UX/UI / Accessibility
Input pro heslo na `/admin/login` nemá asociovaný label element ani `aria-label`. Screen readery ho nedokáží popsat.
**Soubor:** `app/admin/login/page.tsx`
**Oprava:**
```tsx
<label htmlFor="password" className="sr-only">Heslo</label>
<input id="password" type="password" ... />
```

---

### I-07. Chybí middleware auth guard pro /admin routes
**Závažnost:** CRITICAL | **Effort:** M | **Oblast:** Security / Next.js
Administrátorská sekce nemá centrální middleware ochranu — každý route handler sice ověřuje token individuálně, ale `/admin/*` page routes jsou dostupné bez ověření na úrovni edge.
**Soubor:** `middleware.ts` (chybí soubor)
**Oprava:**
```ts
// middleware.ts (v kořeni projektu)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_auth')?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
```

---

### I-08. getKv() duplikace v blog.ts a content.ts — architekturální kritická chyba
**Závažnost:** CRITICAL | **Effort:** S | **Oblast:** Architecture
`getKv()` factory funkce je zkopírována do dvou souborů. Při změně KV schématu nebo přidání error handlingu je nutné měnit na dvou místech — zdroj budoucích divergencí.
**Soubor:** `lib/blog.ts`, `lib/content.ts`
**Oprava:** Extrahovat do `lib/kv.ts`:
```ts
// lib/kv.ts
import { kv } from '@vercel/kv';
export function getKv() { return kv; }
export { kv };
```

---

## 📋 Sprint 1 (do 1 týdne)

### S1-01. AdminDashboard: 6+ useState cluster → useReducer
**Závažnost:** HIGH | **Effort:** M | **Oblast:** State Complexity / Frontend
9 samostatných `useState` volání v jedné komponentě s upload logikou tvoří stale closure rizika v asynchronních handlerech. Upload loop pracuje se stálým (stale) referencí na state.
**Soubor:** `components/AdminDashboard.tsx`
**Oprava:** Nahradit skupinu uploadových stavů jedním `useReducer(uploadReducer, initialState)`.

---

### S1-02. BlogEditor a ContentEditor: useState cluster → useReducer
**Závažnost:** HIGH | **Effort:** M | **Oblast:** State Complexity
`BlogEditor.tsx` (6 useState) a `ContentEditor.tsx` (duplikované stavy pro lokalizace) trpí stejným anti-patternem jako AdminDashboard.
**Soubory:** `components/admin/BlogEditor.tsx`, `components/admin/ContentEditor.tsx`
**Oprava:** Zavést `useBlogEditorReducer` / `useContentEditorReducer` s explicitními akcemi.

---

### S1-03. SelectedWork: state synchronizace se scroll progress → useTransform
**Závažnost:** HIGH | **Effort:** S | **Oblast:** State Complexity / Frontend
Použití `useMotionValueEvent` + `useState` pro odvozování indexu z scroll progress je anti-pattern. Navíc chybí dependency v event handleru, což způsobuje stale closure.
**Soubor:** `components/SelectedWork.tsx`
**Oprava:**
```ts
// Nahradit useMotionValueEvent + useState za:
const activeIndex = useTransform(scrollProgress, [0, 1], [0, items.length - 1], { clamp: true });
```

---

### S1-04. upload/route.ts: chybí try/catch na formData a timeout na upload_stream
**Závažnost:** HIGH | **Effort:** S | **Oblast:** Backend
`request.formData()` může vyhodit při malformovaném requestu. `upload_stream` nemá timeout — velký soubor může server zavěsit.
**Soubor:** `app/api/admin/upload/route.ts`
**Oprava:**
```ts
let formData: FormData;
try {
  formData = await request.formData();
} catch {
  return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
}
// Pro timeout wrappovat upload_stream do Promise s AbortSignal nebo setTimeout reject.
```

---

### S1-05. login/route.ts: chybí try/catch kolem signToken, JSON parse a Content-Type check
**Závažnost:** HIGH | **Effort:** S | **Oblast:** Backend / Security
Tři oddělené problémy ve stejném souboru: (1) `signToken()` může vyhodit; (2) `request.json()` vyhazuje při invalid JSON; (3) chybí `Content-Type: application/json` validace.
**Soubor:** `app/api/admin/login/route.ts`
**Oprava:**
```ts
if (request.headers.get('content-type') !== 'application/json') {
  return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
}
let body: unknown;
try { body = await request.json(); } catch {
  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
}
```

---

### S1-06. Lightbox: chybí AnimatePresence mode="wait", focus trap, ARIA atributy
**Závažnost:** HIGH | **Effort:** M | **Oblast:** Frontend / UX/UI / Accessibility
Tři propojené problémy: (1) bez `mode="wait"` se animace kříží; (2) focus uniká za lightbox (WCAG 2.1); (3) chybí `role="dialog"`, `aria-modal="true"`, `aria-label`.
**Soubor:** `components/Lightbox.tsx`
**Oprava:**
```tsx
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Prohlížeč fotografií"
      // focus trap: useEffect s focusable elements query
    >
```

---

### S1-07. Chybí security HTTP headers (CSP, X-Frame-Options, HSTS)
**Závažnost:** HIGH | **Effort:** M | **Oblast:** Security / Next.js
`next.config.ts` neobsahuje security headers. Chybí Content Security Policy, X-Frame-Options (clickjacking), HSTS a X-Content-Type-Options.
**Soubor:** `next.config.ts`
**Oprava:**
```ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' res.cloudinary.com data:; ..." },
];
// Přidat do nextConfig.headers()
```

---

### S1-08. SVG/polyglot soubory procházejí MIME type kontrolou v upload route
**Závažnost:** HIGH | **Effort:** S | **Oblast:** Security / Backend
MIME type check lze obejít — SVG soubor s `<script>` tagem projde jako `image/svg+xml`. Chybí server-side magic bytes validace nebo whitelist bez SVG.
**Soubor:** `app/api/admin/upload/route.ts`
**Oprava:**
```ts
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
// SVG explicitně vyloučit — nebo použít file-type balíček pro magic bytes check
if (!ALLOWED_MIME.includes(file.type)) {
  return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
}
```

---

### S1-09. CSRF protection chybí na admin login
**Závažnost:** HIGH | **Effort:** M | **Oblast:** Security
Login endpoint nemá CSRF token. Útočník může odeslat cross-site formulář a zahájit přihlášení s cizími credentials (login CSRF).
**Soubor:** `app/admin/login/page.tsx`, `app/api/admin/login/route.ts`
**Oprava:** Implementovat Double Submit Cookie pattern nebo použít `next-csrf` knihovnu.

---

### S1-10. Chybí API testy pro kritické routes
**Závažnost:** HIGH | **Effort:** L | **Oblast:** QA
Žádné testy pro: `login/route.ts`, `delete/route.ts`, `upload-signature/route.ts`, `revalidate/route.ts`, `blog/route.ts`. Tyto routes zpracovávají autentizaci a mutace.
**Soubory:** `__tests__/` (chybí API route testy)
**Oprava:** Vytvořit `__tests__/api/login.test.ts`, `delete.test.ts`, `upload-signature.test.ts` s MSW nebo direct handler testing.

---

### S1-11. lib/blog.ts: Promise.all bez error handling → Promise.allSettled
**Závažnost:** HIGH | **Effort:** S | **Oblast:** Backend / Next.js
`Promise.all` na KV operacích způsobí, že jediná chyba zruší celou operaci bez diagnostiky. Navíc KV operace nejsou atomic — race condition při souběžných requestech.
**Soubor:** `lib/blog.ts`
**Oprava:**
```ts
const results = await Promise.allSettled(ids.map(id => kv.get<BlogPost>(id)));
const posts = results
  .filter((r): r is PromiseFulfilledResult<BlogPost> => r.status === 'fulfilled' && r.value !== null)
  .map(r => r.value);
```

---

### S1-12. Chybí prefers-reduced-motion globální podpora ve Framer Motion
**Závažnost:** HIGH | **Effort:** M | **Oblast:** UX/UI / Accessibility
Žádná komponenta (AnimatedSection, HeroSection, WordReveal, Nav, SelectedWork) nerespektuje `prefers-reduced-motion`. Způsobuje problémy uživatelům s vestibulárními poruchami — porušení WCAG 2.3.3.
**Soubory:** `components/AnimatedSection.tsx`, `components/HeroSection.tsx`, `components/WordReveal.tsx`
**Oprava:**
```ts
// lib/motion.ts — sdílený helper
import { useReducedMotion } from 'framer-motion';
export function useMotionVariants(full: Variants, reduced: Variants) {
  const reduce = useReducedMotion();
  return reduce ? reduced : full;
}
```

---

### S1-13. Chybí skip-to-main-content link
**Závažnost:** HIGH | **Effort:** XS | **Oblast:** UX/UI / Accessibility
Stránka nemá skip link — uživatelé s klávesnicí musí procházet celou navigaci na každé stránce (WCAG 2.4.1).
**Soubor:** `app/[locale]/layout.tsx`
**Oprava:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-white text-black px-4 py-2 rounded">
  Přeskočit na obsah
</a>
```

---

## 📋 Sprint 2 (do 2 týdnů)

### S2-01. UUID_RE, SLUG_RE, CLOUDINARY_ID_RE duplikace v 3+ API routes
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Architecture
Validační regex jsou zkopírovány do každého route handleru zvlášť. DRY porušení — při změně formátu nutno aktualizovat na N místech.
**Oprava:** Extrahovat do `lib/validators.ts` s exportovanými konstantami a helper funkcemi.

---

### S2-02. AdminDashboard.tsx: příliš velká komponenta (272 řádků, 9 useState)
**Závažnost:** MEDIUM | **Effort:** M | **Oblast:** Architecture / Frontend
Komponenta míchá upload logiku, preview stav, drag & drop a error handling. Těžko testovatelná a udržovatelná.
**Soubor:** `components/AdminDashboard.tsx:1-272`
**Oprava:** Rozdělit na `useAdminUpload` hook + `FilePreviewList` + `UploadDropzone` komponenty.

---

### S2-03. BlogEditor.tsx: rozdělit na BlogList + BlogForm + BlogActions
**Závažnost:** MEDIUM | **Effort:** M | **Oblast:** Architecture
150+ řádků s 5 stavy a smíšenou UI/fetch logikou. Chybí také error handling v useEffect fetch a useId je importován ale nepoužit.
**Soubor:** `components/admin/BlogEditor.tsx`

---

### S2-04. Revalidation paths centralizovat do lib/revalidate.ts
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Architecture
`revalidatePath()` volání jsou roztříštěna v blog, content a images routes. Typy cest nejsou konzistentní.
**Oprava:**
```ts
// lib/revalidate.ts
export const PATHS = { gallery: '/gallery', blog: '/blog', home: '/' };
export async function revalidateAll() {
  Object.values(PATHS).forEach(p => revalidatePath(p));
}
```

---

### S2-05. i18n/request.ts: messages.json se načítají při každém requestu bez cache
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Next.js / Performance
Každý server request znovu načítá JSON soubory s překlady. Mělo by být cachováno pomocí `unstable_cache` nebo `import()` cache.
**Soubor:** `i18n/request.ts`

---

### S2-06. PortfolioFilter: useSearchParams bez Suspense wrapperu
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Next.js
`useSearchParams()` v Next.js App Router vyžaduje Suspense boundary v parent komponentě, jinak způsobuje hydration chybu nebo opt-out ze static rendering.
**Soubor:** `components/PortfolioFilter.tsx`
**Oprava:** Obalit použití v parent do `<Suspense fallback={<FilterSkeleton />}>`.

---

### S2-07. blog/[slug]/page.tsx: chybí og:image a coverImage transformace
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Next.js / SEO
Blog posty nemají og:image metadata (chybí v generateMetadata). `coverImage` je renderován bez `q_auto,f_auto` Cloudinary transformací.
**Soubor:** `app/[locale]/blog/[slug]/page.tsx`

---

### S2-08. lib/cloudinary.ts: krátký revalidate interval a chybí on-demand tags
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Next.js / Architecture
`revalidate: 300` (5 min) je zbytečně agresivní pro galerii. Chybí `tags: ['gallery']` pro on-demand revalidaci po uploadu/smazání.
**Soubor:** `lib/cloudinary.ts`
**Oprava:**
```ts
const data = await unstable_cache(fetchGalleryPhotos, ['gallery'], {
  revalidate: 3600,
  tags: ['gallery'],
})();
// V upload/delete route: revalidateTag('gallery')
```

---

### S2-09. Nav.tsx: chybí SSR hydration guard, cleanup v useEffect, language switcher ARIA
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Frontend / UX/UI
Tři propojené problémy: scroll state způsobuje hydration mismatch; useEffect event listener nemá cleanup; language switcher chybí `role="group"` a `aria-label`.
**Soubor:** `components/Nav.tsx`

---

### S2-10. HeroSection: scroll handler bez throttle
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Frontend / Performance
Scroll event listener na HeroSection se spouští na každý scroll event bez throttle/debounce. Na mobilních zařízeních způsobuje frame drops.
**Soubor:** `components/HeroSection.tsx`
**Oprava:** Použít `requestAnimationFrame` throttle nebo Framer Motion `useScroll` hook.

---

### S2-11. PhotoGrid a BlogPostCard: chybí Cloudinary transformace a blur placeholder
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Next.js / Performance / Frontend
`PhotoGrid.tsx` používá `cloudinaryUrl` bez transformací (chybí `f_auto`, `q_auto`, `w_auto`) a chybí `sizes` atribut. `BlogPostCard.tsx` stejný problém + chybí `blurDataURL` placeholder.
**Soubory:** `components/PhotoGrid.tsx`, `components/BlogPostCard.tsx`

---

### S2-12. ContactForm: chybí try/catch, role="alert" na success message, aria atributy
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Frontend / UX/UI
Network chyba v submit handleru není zachycena. Success/error message chybí `role="alert"` a `aria-live="polite"`. Inputs nemají `aria-describedby`.
**Soubor:** `components/ContactForm.tsx`

---

### S2-13. Lightbox: keyboard handler bez useCallback; PortfolioFilter: chybí aria-pressed
**Závažnost:** MEDIUM | **Effort:** XS | **Oblast:** Frontend / UX/UI
Keyboard handler v Lightbox se recreatuje na každý render. Filter buttons nemají `aria-pressed` atribut pro oznámení aktivního filtru screen readerům.
**Soubory:** `components/Lightbox.tsx`, `components/PortfolioFilter.tsx`

---

### S2-14. blog/route.ts, content/route.ts, images/route.ts: chybí try/catch na KV operace
**Závažnost:** MEDIUM | **Effort:** S | **Oblast:** Backend
`saveBlogPost()`, `setContent()`, `setImages()` volání nejsou obalena v try/catch. KV výpadek způsobí unhandled rejection a 500 bez popisné chyby.
**Soubory:** `app/api/admin/blog/route.ts`, `app/api/admin/content/route.ts`, `app/api/admin/images/route.ts`

---

### S2-15. PortfolioFilter: chybí useMemo na filtered array
**Závažnost:** MEDIUM | **Effort:** XS | **Oblast:** Frontend / Performance
Filtrování pole fotografií probíhá na každý render bez memoizace. Při větší galerii způsobuje zbytečné výpočty.
**Soubor:** `components/PortfolioFilter.tsx`
**Oprava:** `const filtered = useMemo(() => photos.filter(...), [photos, activeFilter]);`

---

### S2-16. Admin layout: chybí robots noindex metadata
**Závažnost:** MEDIUM | **Effort:** XS | **Oblast:** Next.js / SEO
Admin stránky jsou indexovatelné vyhledávači. Měly by mít `robots: { index: false, follow: false }`.
**Soubor:** `app/admin/layout.tsx`
**Oprava:**
```ts
export const metadata: Metadata = { robots: { index: false, follow: false } };
```

---

### S2-17. WordReveal: duplicate text span bez aria-hidden; key={i} anti-pattern
**Závažnost:** MEDIUM | **Effort:** XS | **Oblast:** Frontend / UX/UI / Accessibility
Duplicitní span pro animaci je čtený screen readery dvakrát. `key={i}` na mapovaných slovech je anti-pattern při změně pořadí.
**Soubor:** `components/WordReveal.tsx`
**Oprava:**
```tsx
<span aria-hidden="true">{word}</span>
// Pro key použít: key={`${word}-${i}`} nebo stabilní ID
```

---

### S2-18. Doplnit chybějící testy: file type/size validace, handleDelete, síťové chyby
**Závažnost:** MEDIUM | **Effort:** M | **Oblast:** QA
Chybí test pro: validaci file type/size v AdminDashboard; drag & drop; handleDelete; síťovou chybu v ContactForm; `notConfigured` stav; `searchParams initialCategory` v PortfolioFilter; `getAlt` funkci v cloudinary-utils.
**Soubory:** `__tests__/AdminDashboard-compression.test.tsx`, `__tests__/ContactForm.test.tsx`, `__tests__/PortfolioFilter.test.tsx`

---

## 💡 Backlog

### B-01. Types centralizovat do lib/types.ts
**Oblast:** Architecture
`BlogPost`, `GalleryPhoto`, `ContentData` a další typy jsou rozptýleny v různých souborech. Sjednotit do `lib/types.ts` pro lepší discoverability.

---

### B-02. Footer.tsx: new Date().getFullYear() memoizovat
**Oblast:** Frontend / Performance
`new Date().getFullYear()` se volá na každý render. Výsledek by měl být konstanta nebo `useMemo(() => new Date().getFullYear(), [])`.
**Soubor:** `components/Footer.tsx`

---

### B-03. BlogPostCard: article obalený celý v Link — accessibility problém
**Oblast:** UX/UI / Accessibility
Celý `<article>` jako odkaz je anti-pattern — interaktivní elementy uvnitř (tagy, autor) nelze samostatně aktivovat. Použít heading odkaz + `aria-labelledby`.
**Soubor:** `components/BlogPostCard.tsx`

---

### B-04. Rate limit fallback Map není thread-safe v serverless
**Oblast:** Architecture / Security
In-memory `Map` pro rate limiting nefunguje správně v serverless prostředí (každá instance má vlastní paměť). Přesunout rate limiting do Vercel KV nebo Redis.
**Soubor:** `app/api/admin/login/route.ts`

---

### B-05. logout/route.ts: chybí httpOnly flag při mazání cookie; chybí auth check
**Oblast:** Security / Backend
Cookie se smazáním by měla být nastavena se stejnými atributy jako při vytvoření (`httpOnly: true`). Chybí také kontrola auth před provedením logout (minor).
**Soubor:** `app/api/admin/logout/route.ts`

---

### B-06. unstable_cache bez dynamického key pro folder parameter
**Oblast:** Next.js / Architecture
Cache key neobsahuje `folder` parametr, takže různé galerie sdílejí jeden cache záznam.
**Soubor:** `lib/cloudinary.ts`

---

### B-07. app/[locale]/layout.tsx: chybí suppressHydrationWarning a og:locale:alternate
**Oblast:** Next.js / SEO
`suppressHydrationWarning` na `<html>` elementu zabraňuje hydration warnings od browser extensions. `og:locale:alternate` zlepšuje SEO pro vícejazyčný obsah.
**Soubor:** `app/[locale]/layout.tsx`

---

### B-08. vitest.setup.ts: přidat cleanup hooks a matchMedia mock
**Oblast:** QA
Minimalistický setup chybí `afterEach(cleanup)` pro React Testing Library a `matchMedia` mock pro komponenty testující media queries.
**Soubor:** `vitest.setup.ts`

---

### B-09. cookie name "admin_auth" jako magic string
**Oblast:** Architecture
Název cookie je roztroušen v kódu jako literal string. Extrahovat do `lib/config.ts`:
```ts
export const COOKIE_NAME = 'admin_auth' as const;
```

---

### B-10. HeroSection: scroll indicator bez aria-hidden; hero image alt=""
**Oblast:** UX/UI / Accessibility
Dekorativní scroll indikátor by měl mít `aria-hidden="true"`. Hero image s `alt=""` je OK pro dekorativní obrázek, ale pokud nese obsah, potřebuje popis.
**Soubor:** `components/HeroSection.tsx`

---

### B-11. app/[locale]/page.tsx: og:image ze statického /og-image.jpg
**Oblast:** Next.js / SEO
OG image vychází ze statického souboru místo dynamicky generovaného nebo Cloudinary URL. Zvážit `next/og` pro dynamické generování.
**Soubor:** `app/[locale]/page.tsx`

---

### B-12. SelectedWork.tsx: chybí f_auto v cloudinaryUrl
**Oblast:** Frontend / Performance
Cloudinary URL na řádku 121 postrádá `f_auto` transformaci — prohlížeče nedostanou WebP/AVIF automaticky.
**Soubor:** `components/SelectedWork.tsx:121`

---

### B-13. blog/page.tsx: revalidate = 60 je příliš nízké
**Oblast:** Next.js / Performance
60 sekund revalidation pro blog posts způsobuje zbytečné ISR regenerace. Zvýšit na 3600 nebo přejít na on-demand revalidaci.
**Soubor:** `app/[locale]/blog/page.tsx`

---

### B-14. Nav.tsx: inline handlers bez useCallback; custom hook useNavState
**Oblast:** Frontend / State Complexity
Inline event handlers způsobují zbytečné re-rendery child komponent. Logika by mohla být extrahována do `useNavState` custom hooku pro testovatelnost.
**Soubor:** `components/Nav.tsx`

---

## Skóre projektu

| Oblast | Skóre | Komentář |
|--------|-------|---------|
| Frontend | 6/10 | Solidní vizuální implementace, ale scroll handling, memoizace a React key anti-patterny snižují skóre. Lightbox a WordReveal potřebují refactor. |
| Backend | 5/10 | Funkční API routes, ale chybí konzistentní error handling v KV operacích, validace vstupů a try/catch pokrytí je neúplné. |
| QA | 4/10 | Testy existují pro komponentní vrstvu, ale kritické API routes nemají žádné testy. Vitest setup je minimalistický. |
| Security | 3/10 | Tři kritické zranitelnosti (plaintext heslo, nezabezpečený upload-signature endpoint, chybí middleware auth guard) a chybějící security headers. Nutná okamžitá akce. |
| UX/UI | 5/10 | Design je kvalitní, ale accessibility je podhodnocena — PhotoGrid, Lightbox, ContactForm a Nav mají WCAG 2.1 AA porušení. |
| Architecture | 6/10 | Struktura projektu je přehledná, ale duplicita (getKv, regex, revalidate paths) a příliš velké komponenty (AdminDashboard, BlogEditor) snižují maintainability. |
| Next.js | 6/10 | Správné využití App Routeru a ISR, ale chybí error.tsx/loading.tsx, og:image optimalizace, Suspense wrappery a cache tagy jsou klíčové mezery. |
| State Complexity | 4/10 | Čtyři komponenty s useState clustery místo useReducer. SelectedWork má fundamentální anti-pattern v scroll state synchronizaci. |
| **Celkem** | **4.9/10** | Projekt má dobrý základ a vizuální kvalitu, ale Security a QA mezery jsou kritické pro produkční nasazení. Po opravě I-01 až I-07 vzroste skóre na ~7/10. |
