# Ověření editorialového redesignu

Datum: 2026-09-28
Větev: `codex/editorial-redesign`

## Automatické kontroly

- `npx tsc --noEmit`: bez chyb.
- `npx vitest run --exclude ".codex/**" --exclude "modules/homepage/__tests__/visual-components.test.tsx"`: 271/271 testů prošlo.
- `npm run build`: produkční build prošel, včetně CS/EN variant všech nových tras.
- Nezměněný starší soubor `visual-components.test.tsx` má při plném běhu čtyři testy původního `HeroSection`, které v jsdom padají na chybějícím `IntersectionObserver`. Komponenta už není na redesignované homepage použitá; mimo rozsah redesignu nebyla měněna.

## Vizuální a funkční kontrola

- Stránky: homepage, kreativní portrét, business portrét, eventy a svatby.
- Šířky: 1440, 1024, 768, 390 a 320 px.
- Pro každou kombinaci vznikl první pohled i plný screenshot: celkem 40 snímků v ignorované pracovní složce `.superpowers/sdd/2026-09-28-editorial-redesign/screenshots/final`.
- Žádná z 20 kombinací nemá vodorovné přetékání.
- Ověřeny české i anglické H1, interní odkazy, Focení 101, Light Tester, blog, portfolio a admin login.
- Mobilní menu lze otevřít a zavřít pouze klávesnicí; po zavření se focus vrátí na spouštěcí tlačítko.
- Při `prefers-reduced-motion: reduce` nezůstala žádná běžící animace.
- Lokální konzole hlásila pouze očekávané 404 pro Vercel Analytics skript, který je dostupný až na Vercelu.

## Obsahové placeholdery

Tyto sloty jsou záměrně prázdné a čekají na fotografie vybrané v administraci:

- Business: hero, 3× headshot, 3× firma při práci.
- Eventy a svatby: hero, 4× reportáž.

Administrace u každého slotu podporuje výběr fotografie, vyprázdnění, pořadí vícenásobných slotů, CS/EN alt text a samostatný ořez pro desktop a mobil. Titulek eventové stránky je editovatelný pro každý jazyk. Náhledy Focení 101 a Light Planner jsou skutečné snímky nástrojů a lze je v administraci nahradit.

## Ověření podstránek — 2026-09-29

- Ručně i automatizovaně zkontrolovány CS/EN varianty služeb, portfolia, profilu, blogu, VOP a ochrany osobních údajů při 1280 × 800 a 390 × 844 px.
- Všechny stránky používají editorialový obal, mají očekávaný H1 a bez vodorovného přetékání.
- Kontrola viditelného textu nenašla kontrast pod limitem WCAG AA; pole kontaktního formuláře mají čitelný text, pozadí a okraj.
- Mobilní menu má dotykový cíl alespoň 44 px, nativní dialog, zavření klávesou Escape, návrat focusu a přepínač jazyka.
- Přepnutí jazyka zachovává aktuální cestu včetně detailu článku a stránky ochrany osobních údajů.
- Cílený regresní test navigace, TypeScript kontrola a produkční build byly spuštěny znovu před lokálním sloučením.
- Plný Vitest běh má čtyři známé starší pády v `modules/homepage/__tests__/visual-components.test.tsx` kvůli chybějícímu `IntersectionObserver`; soubor ani původní `HeroSection` nejsou součástí této změny.
