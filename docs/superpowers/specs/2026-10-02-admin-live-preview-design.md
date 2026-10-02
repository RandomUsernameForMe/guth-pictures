# Admin: živý náhled + vizuální ořez — design

Datum: 2026-10-02 · Větev: `codex/editorial-redesign`

## Cíl

Správa obsahu v adminu je teď slepá: ořez fotek se píše jako `"50% 50%"` do textových polí
a texty se editují ve formuláři bez kontextu. Cíl:

1. Ořez fotky nastavit klikem / tažením bodu zájmu (zvlášť desktop a mobil).
2. Vedle editoru fotek i textů živý náhled skutečné stránky z **neuložených** dat.

Úspěch: v `/admin/fotky` i `/admin/obsah` změním ořez nebo text a do ~100 ms to vidím
v náhledu správné stránky (desktop i mobil), aniž bych cokoliv uložil.

## Rozhodnutí

- Ořez = **bod zájmu** (object-position). Žádný zoom, žádný volný obdélník.
  Datový formát `FocalPoint { desktop: "x% y%", mobile: "x% y%" }` beze změny.
- Náhled = **split view**: editor vlevo, iframe vpravo.
- Přenos dat = **postMessage** do iframu (ne draft v KV + reload).

## Architektura

### 1. Preview route — `app/[locale]/nahled/[page]/page.tsx`

- `page` ∈ `home | portrety | business | eventy`. Jiná hodnota → `notFound()`.
- Server načte `getContent(locale)` + `getImages()` jako výchozí stav a předá je
  klientské komponentě `PreviewSurface`.
- `export const dynamic = "force-dynamic"`, metadata `robots: { index: false, follow: false }`.
- Ochrana: `middleware.ts` — cesty `/(cs|en)/nahled/*` vyžadují admin session stejně
  jako `/admin/*` (bez session → redirect `/admin/login`). Route se nesmí objevit
  v `sitemap.ts`.

### 2. `PreviewSurface` (client) — `modules/admin/preview/PreviewSurface.tsx`

- Drží `{ content, images }` ve stavu, výchozí z props.
- `window.addEventListener("message")`, přijímá jen `event.origin === location.origin`
  a `event.source === window.parent`. Zprávy:
  - `{ type: "preview:data", content?, images? }` → nahradí stav (content přes
    `normalizeContent`, images přes `normalizeImages`, ať nevalidní koncept nespadne).
  - `{ type: "preview:focus", section }` → `document.querySelector([data-preview=section])
    ?.scrollIntoView({ block: "center", behavior: "smooth" })` + krátké zvýraznění (outline).
- Po mountu pošle rodiči `{ type: "preview:ready" }`; admin pak pošle aktuální koncept.
- Vykreslí `HomeEditorial | PortraitEditorial | BusinessEditorial | EventsEditorial`
  se stejnými props jako veřejná stránka. Komponenty nemají nic server-only
  (ověřeno: plain funkce, `Link` z next-intl, `ContactForm` je client) — jen se
  importují do client stromu. Pokud build ukáže problém, je to blokátor → zastavit a hlásit.
- Odkazy v náhledu: klik na `<a>` se v náhledu zablokuje (`preventDefault` v capture
  listeneru), aby admin neodnavigoval iframe pryč.

### 3. `data-preview` atributy

Jen na úrovni sekcí v editorial komponentách (`<section data-preview="home.hero">` apod.),
žádné změny chování ani vzhledu. Klíče:
`home.hero, home.stories, home.photographer, home.tools, home.contact, portrait.hero,
portrait.gallery, business.hero, business.headshots, events.hero, events.reportage`
(+ sekce textů, které nemají fotku, pojmenované podle klíče v `PageCopy`).

### 4. `AdminPreview` (client) — `modules/admin/preview/AdminPreview.tsx`

Props: `page`, `locale`, `content?`, `images?`, `focus?`.

- Iframe `src=/${locale}/nahled/${page}`; při změně `page`/`locale` se mění `src`.
- Přepínač zařízení: desktop (iframe 1280 px) / mobil (390 px); iframe se škáluje
  `transform: scale(šířkaPanelu / šířkaIframu)` (ResizeObserver na kontejneru).
  Mobilní šířka zároveň aktivuje `@media (max-width: 760px)` → `--focus-mobile`.
- Na `preview:ready` a při každé změně `content`/`images` posílá `preview:data`
  (změny stavu v Reactu jsou už dávkované, debounce netřeba).
- Na změnu `focus` posílá `preview:focus`.
- Výběr stránky + CS/EN jako malé tlačítka nad iframem.

### 5. `FocalPicker` (client) — `modules/admin/components/FocalPicker.tsx`

- Zobrazí celou fotku (`c_limit,w_600`) bez ořezu, přes ni křížek na aktuálním bodu.
- Přepínač „Desktop / Mobil“ určuje, který bod se edituje; druhý bod se zobrazí
  tlumeně.
- Klik i tažení (pointer events, `setPointerCapture`) → `toFocal(event, rect)` →
  `"x% y%"` zaokrouhleno na celá %, oříznuto na 0–100.
- Klávesnice: šipky posouvají aktivní bod o 1 % (Shift = 10 %), `role="slider"`-like
  ovládání s `aria-label` a `aria-valuetext`.
- Čistá funkce `toFocal(clientX, clientY, rect): string` a `parseFocal(value): {x, y}`
  v `modules/admin/lib/focal.ts` (testovatelné).
- Mini-náhledy v poměrech stran slotů **vynechány** — reálný ořez ukazuje živý náhled.

### 6. Úpravy existujících editorů

- `EditorialImageEditor`: textové inputy ořezu → `FocalPicker`. Layout změněn na
  split view: vlevo seznam slotů (jednosloupcový, kompaktní), vpravo `AdminPreview`
  (sticky, výška viewportu). Výběr / fokus slotu → `focus` + přepnutí `page` podle
  prefixu slotu (Homepage → home, Portréty → portrety, …). Koncept `data` jde do
  `AdminPreview` jako `images.editorial`.
- `ContentEditor` (sekce s `PageCopyEditor`): stejný split view. `PageCopyEditor`
  dostane volitelný `onFocusPath(path: string)` volaný z `onFocus` polí; `ContentEditor`
  z cesty odvodí `page` a `section`. Koncept `current` (aktuální locale) jde do náhledu
  jako `content`; locale náhledu = locale editoru.
- Pod šířkou `lg` se náhled schová za tlačítko „Zobrazit náhled“ (overlay), editor zůstává
  plně použitelný na mobilu.

## Odchylky při implementaci

- `data-preview` atributy nepřidány — fokus fotky scrolluje na existující třídy sekcí
  (`.ed-home-hero` …), fokus textového pole hledá v náhledu jeho text (`preview:find`).
  Editorial komponenty zůstaly beze změny.
- Pro iframe bylo nutné povolit `frame-ancestors 'self'` / `X-Frame-Options: SAMEORIGIN`
  jen na `/(cs|en)/nahled/*` (`next.config.ts`); zbytek webu dál `DENY`.
- `Nav` (globální navbar) se na `/nahled/*` skrývá stejně jako na editorial stránkách.
- Odeslání formulářů v náhledu je blokované (kontaktní formulář by jinak reálně odeslal).

## Mimo rozsah (v1)

- Náhled `/o-mne` a `/sluzby` — jejich obsah je inline JSX v `page.tsx` s
  `getTranslations` (server-only). Pro náhled by se musel vytáhnout do komponenty.
  → fáze 2, pokud bude potřeba.
- Inline editace přímo v náhledu.
- Zoom / volný ořez.
- Blog, galerie, stories.

## Chybové stavy

- Iframe nepošle `preview:ready` do 5 s → v panelu hláška „Náhled se nenačetl“ + tlačítko
  „Načíst znovu“.
- Session vyprší → iframe ukáže login; admin to ukáže tak, jak to je (save stejně selže
  s 401 a stávající flow přesměruje).
- Nevalidní koncept (prázdná pole) → normalizace doplní fallbacky, nic nespadne.

## Testování

- `modules/admin/lib/__tests__/focal.test.ts`: `toFocal` (rohy, střed, mimo rect → clamp,
  zaokrouhlení), `parseFocal` (validní, nevalidní → `50% 50%`).
- `FocalPicker` test (Testing Library): klik na pozici → `onChange` s očekávaným bodem;
  šipka → posun o 1 %.
- `PreviewSurface` test: `postMessage` s cizím origin ignorován; `preview:data` přerenderuje
  text (ověřit nový nadpis v DOM).
- Middleware: `/cs/nahled/home` bez session → redirect na `/admin/login`.
- Existující testy editorial komponent musí projít (atributy `data-preview` jsou jen aditivní).
- `tsc --noEmit` + `npm test` zelené.
- Ruční ověření v prohlížeči (Playwright): změna ořezu i textu se projeví v náhledu bez
  uložení; desktop i mobil.
