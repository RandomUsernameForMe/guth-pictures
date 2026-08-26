# Podzimní paleta + přepínatelné presety

**Datum:** 2026-08-26
**Stav:** schváleno k naplánování

## Problém

Web stojí na zlatém akcentu `#C8A96E`. Ta barva je vizuální klišé AI generovaného
obsahu (tmavé pozadí + zlatá) a majitel se s ní neztotožňuje. Chce teplou vínovou
jako hlavní barvu značky a možnost přepínat mezi hotovými paletami z adminu.

Zlatý podtón navíc není jen v akcentu. Přes celou stránku leží film-grain overlay
(`app/globals.css:182`) obarvený na `#C8A96E` s `background-blend-mode: color` —
tedy zlatý nádech na každém pixelu. Admin ho neumí změnit.

Dnešní editor motivu (`/admin/tema`) mění 9 CSS proměnných uložených v KV.
Zbytek zlaté je zapečený na ~66 místech v kódu.

## Cíle

1. Vínová paleta jako výchozí vzhled webu.
2. V adminu jedním klikem přepnout mezi 4 hotovými presety.
3. Zlatý podtón odstranit i z míst, kam dnešní editor nedosáhne.
4. Původní vzhled zůstane dostupný jako preset, ať se dá vrátit.

## Nezahrnuto

- Změny typografie, layoutu, animací nebo rozestupů. Jen barvy.
- Uživatelské vytváření vlastních presetů. Editor barev zůstane jak je —
  preset se do něj jen nasype a dá se ručně doladit před uložením.
- Barvy světel a gelů v `light-tester` (viz Rozhodnutí).

## Rozhodnutí

### R1 — Světlý motiv se ruší

Zjištění při průzkumu: **light mode je už dnes mrtvý.**
`components/ThemeProvider.tsx:8` má `forcedTheme="dark"`, takže `.light` větev
nikdy nenaběhne. `components/ThemeToggle.tsx` se nikde nerenderuje — v
`components/Nav.tsx:296` zbyl jen komentář `{/* Theme toggle row */}`.

Rušení je tedy mazání, ne přepisování. Odstraní se:

- `components/ThemeToggle.tsx` (mrtvý soubor)
- `components/ThemeProvider.tsx` a závislost `next-themes` — nahradí je
  statické `<html className="dark">` v `app/[locale]/layout.tsx`
- bloky `.light` (`app/globals.css:132`) a `.light body::after` (`:197`)
- `light` půlka typu `ThemeColors`, panel „Světlý motiv" v `ThemeEditor.tsx`
  a jeho validace v `app/api/admin/theme/route.ts`

Typ `ThemeColors` tím zaniká; KV i API pracují přímo s jedním `ColorSet`.

**Důvod:** web je fotografické portfolio, tmavý režim je jediný, který kdy běžel.
Udržovat druhou paletu, kterou nikdo nevidí, je čistá režie.

### R2 — Token set se rozšíří o 2 klíče, hranice se odvodí

`ColorSet` má dnes 9 klíčů. Přibudou dva:

| klíč | CSS proměnná | role |
|---|---|---|
| `accentSecondary` | `--color-accent-secondary` | vlásové linky, rámeček eyebrow, číslování, dělící čárky, levý pruh karet |
| `grain` | `--color-grain` | odstín film-grain overlaye |

`grain` dostává vlastní token právě proto, že dnes tiše přebírá `accent` — a je
to hlavní zdroj celoplošného podtónu.

Hraniční barvy se **nepřidávají jako tokeny**, ale odvodí se z textové barvy:

```css
--color-border:     color-mix(in srgb, var(--color-text) 12%, transparent);
--color-border-sub: color-mix(in srgb, var(--color-text)  7%, transparent);
```

Tím zteplají samy s presetem a mizí hardcody `rgba(255, 255, 255, 0.10)`
a `rgba(255, 255, 255, 0.06)`.

Stejným způsobem se nahradí hardcodované zlaté průhlednosti:
`rgba(200,169,110,0.25)` → `color-mix(in srgb, var(--color-accent-secondary) 45%, transparent)`
(`globals.css:321`, `:539`, `:576`).

**Dvouúrovňový akcent:** `accent` je barva výplní a hlavního CTA.
`accentSecondary` je detailová barva pro linky a drobné značení. Měď smí být
druhá, nikdy první — to je celý smysl rozdělení.

### R3 — Presety jsou data, editor se nemění

`lib/theme-presets.ts` exportuje pojmenované `ColorSet` objekty. `ThemeEditor`
dostane nad stávající mřížku řádek tlačítek; klik nasype preset do lokálního
state (živý náhled beze změny na serveru), tlačítko **Uložit** ho zapíše do KV
jako dosud.

KV drží plochý `ColorSet` — žádná resolution logika, žádný merge overridů,
žádné ukládání ID presetu.

**Zavržená alternativa:** ukládat do KV ID presetu + overridy. Umožnilo by to
propsat pozdější změny presetu v kódu do už uloženého motivu, ale za cenu
merge logiky, migrace a složitějšího UI. Za tuhle jednu vlastnost to nestojí.

**Migrace KV:** klíč `theme-colors` → `theme-colors-v2`. Nová shape (bez
`light`, s dvěma klíči navíc), starý záznam se prostě ignoruje a použije se
výchozí preset. Žádný migrační kód. Starý klíč se smaže ručně.

### R4 — Statické obrázky čtou výchozí preset z kódu, ne z KV

Favicon (`app/icon.tsx`) a OG obrázky (`app/[locale]/foceni-101/opengraph-image.tsx`,
`app/[locale]/light-tester/opengraph-image.tsx`) budou importovat výchozí preset
z `lib/theme-presets.ts`. **Nebudou** číst KV.

**Důvod:** jsou to sice route handlery a `await getThemeColors()` by šlo, ale
dynamický favicon znamená KV read při každém načtení stránky a OG obrázky si
crawleři cachují na týdny — přínos „preset se propíše" je skoro nulový, cena
reálná. Přebarví se na vínovou, jen nesledují přepínač v adminu.

Totéž platí z jiného důvodu pro `modules/blog/scripts/generate-cover.ts`,
`modules/blog/scripts/batch-post.ts` a šablony v `modules/stories/components/story/`
— jsou to CLI skripty a offline renderery, na KV nedosáhnou vůbec.

### R5 — Barvy světel v light-testeru zůstávají

V `modules/light-tester/components/types.ts` zůstávají beze změny:

- `GELS` — `#FFB870` (CTO), `#FFE6C8` (cream), `#FFD580` (sun) — reprezentují
  skutečnou barvu světla, mají fyzikální význam
- `LIGHT_TYPES` — `#C8A96E` (key), `#E8D49A` (softbox) — legenda uvnitř
  simulátoru, kde teplá žlutá znamená „světlo"

Na tokeny se převádí jen **chrome** nástroje: mřížka, výběrový prstenec, popisky
a rámečky v `StudioFloor.tsx` a `Inspector.tsx`.

## Palety

Čtyři presety. Všechny sdílejí logiku: **plocha nese barvu, hlavní akcent je
světlý nebo sytý, druhý akcent dělá jen linky.**

### Víno — výchozí

| token | hex |
|---|---|
| `bg` | `#1A0A0F` |
| `bgElevated` | `#221117` |
| `bgOverlay` | `#2A1720` |
| `surface` | `#331D27` |
| `text` | `#EDE2D9` |
| `textMuted` | `#C0A49C` |
| `textGhost` | `#8A6A66` |
| `accent` | `#FAF0E4` |
| `accentHover` | `#FDF8F0` |
| `accentSecondary` | `#B87333` |
| `grain` | `#6B2030` |

Kostěný akcent na vínové ploše, měděné linky. Měď posunuta z `#C8A96E` na
`#B87333` — méně žlutá, více do hnědooranžova.

### Višeň

| token | hex |
|---|---|
| `bg` | `#170A0D` |
| `bgElevated` | `#1F0F14` |
| `bgOverlay` | `#28151B` |
| `surface` | `#331B22` |
| `text` | `#F1E4E4` |
| `textMuted` | `#B79A9C` |
| `textGhost` | `#7E5A5E` |
| `accent` | `#D4485A` |
| `accentHover` | `#E45E6E` |
| `accentSecondary` | `#B87333` |
| `grain` | `#A0202F` |

Akcent je proti mockupu zesvětlen z `#B32B3C` na `#D4485A`. Původní hodnota
dávala na pozadí `#170A0D` kontrast 2,5 : 1, což na text neprojde.
`#D4485A` je na 4,5 : 1, `#E45E6E` na 5,2 : 1.

Chybová barva zůstává `#F87171`. Od akcentu se liší, ale je to blízko —
implementace musí ověřit, že chybová hláška v tomhle presetu čte jako chyba.

### Uhel

| token | hex |
|---|---|
| `bg` | `#0A0A0B` |
| `bgElevated` | `#111113` |
| `bgOverlay` | `#18181C` |
| `surface` | `#1E1E23` |
| `text` | `#EFEDE9` |
| `textMuted` | `#9B9899` |
| `textGhost` | `#5C5A5E` |
| `accent` | `#F5F2ED` |
| `accentHover` | `#FFFFFF` |
| `accentSecondary` | `#8A8A8A` |
| `grain` | `#8A8A8A` |

Nulová barva, neutrální grain. Pro sérii fotek, kde barva pozadí vadí.

### Zlatá — archiv

| token | hex |
|---|---|
| `bg` | `#0A0A0B` |
| `bgElevated` | `#111113` |
| `bgOverlay` | `#18181C` |
| `surface` | `#1E1E23` |
| `text` | `#F2F0EB` |
| `textMuted` | `#9B9899` |
| `textGhost` | `#5C5A5E` |
| `accent` | `#C8A96E` |
| `accentHover` | `#D4B87A` |
| `accentSecondary` | `#C8A96E` |
| `grain` | `#C8A96E` |

Dnešní stav zachovaný jako preset.

## Dotčená místa

### Přejde na CSS proměnné — mění se s presetem

| soubor | co |
|---|---|
| `app/globals.css:191` | grain `#C8A96E` → `var(--color-grain)` |
| `app/globals.css:321` | rámeček eyebrow → `color-mix` na `--color-accent-secondary` |
| `app/globals.css:539`, `:576` | aktivní řádky v adminu → totéž |
| `app/globals.css` `:root` | `--color-border`, `--color-border-sub` → `color-mix` na `--color-text` |
| `app/globals.css:1686`–`1849` | fallbacky `var(--p-accent, …)` a `var(--bsp-duo-*, …)` → hodnoty z tabulky níže |
| `modules/homepage/components/Foceni101Promo.tsx` | 8× `#C8A96E` v SVG → `var(--color-accent-secondary)` |
| `modules/homepage/components/LightTesterPromo.tsx` | 4× totéž |
| `modules/light-tester/components/StudioFloor.tsx` | mřížka, prstenec, popisky → tokeny |
| `modules/light-tester/components/Inspector.tsx` | rámeček → token |
| `modules/brand-shoot/components/ProposalView.tsx:11`–`12` | výchozí paleta návrhu → hodnoty z tabulky níže |

Stránky návrhů (`bsp-*`) mají vlastní paletu odvozenou z brandu klienta —
ta zůstává. Mění se jen **výchozí hodnota**, když klientská paleta chybí.
Sladí se s presetem „Víno“ a musí být totožná v `ProposalView.tsx` i ve
fallbacích v `globals.css`:

| proměnná | dnes | nově |
|---|---|---|
| `--p-accent` | `#C8A96E` | `#B87333` |
| `glowA` | `#2A1C12` | `#2A1218` |
| `glowB` | `#15110D` | `#150D10` |
| `tint` | `#0A0A0B` | `#1A0A0F` |
| `--bsp-duo-shadow` | `#3A2A1A` | `#3A1A24` |
| `--bsp-duo-light` | `#E8DFCF` | `#E8DCD4` |

### Přejde na výchozí preset z kódu — nesleduje přepínač

| soubor | co |
|---|---|
| `app/icon.tsx` | favicon |
| `app/[locale]/foceni-101/opengraph-image.tsx` | OG karta |
| `app/[locale]/light-tester/opengraph-image.tsx` | OG karta |
| `modules/blog/scripts/generate-cover.ts` | generátor coverů |
| `modules/blog/scripts/batch-post.ts` | tentýž SVG duplikovaný |
| `modules/stories/components/story/TemplateC.tsx`, `TemplateD.tsx` | IG stories |

### Zůstává beze změny

`modules/light-tester/components/types.ts` — `GELS` a `LIGHT_TYPES` (viz R5).

## Ověření

1. `grep -rn "#C8A96E" app components modules lib` vrátí zásahy **jen**
   v `lib/theme-presets.ts` (preset „Zlatá") a v `light-tester/types.ts`.
2. Jednotkový test: každý preset má všech 11 klíčů `ColorSet` a každá hodnota
   projde `/^#[0-9a-fA-F]{6}$/`. Jinak ho `app/api/admin/theme/route.ts` odmítne.
3. Jednotkový test: v presetu „Višeň" má `accent` proti `bg` kontrast ≥ 4,5 : 1.
4. `npx vitest run` — baseline zůstává 160 pass / 4 fail. Ty 4 pády jsou
   předchozí (jsdom bez `IntersectionObserver`), nesouvisí.
5. `npx tsc --noEmit` projde — typ `ThemeColors` zmizel z API i editoru.
6. Vizuální kontrola na dev serveru: `/`, `/foceni-101`, `/light-tester`,
   `/blog`, `/admin/tema`. V adminu přepnout všechny 4 presety a ověřit,
   že se stránka překreslí a Uložit funguje.
7. Ověřit, že po smazání `next-themes` nezůstal import a build projde.
