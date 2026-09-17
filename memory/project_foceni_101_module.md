---
name: Focení 101 Module
description: Koncept interaktivní edukativní scroll-story appky vysvětlující základní fotografické pojmy nefotografům (3D Three.js)
type: project
---

## Zadání

Interaktivní appka, která **nefotografa** provede základními fotografickými pojmy a ukáže jejich vliv na výslednou fotku. Vedená scroll-story s 3D scénami.

**Cíl:** lead-gen + SEO + portfolio showpiece. Edukace → důvěra → klienti.

**Název:** Focení 101

## Klíčová rozhodnutí (zamčeno)

- **Subjekt:** 3D hlava — reuse `public/models/head.glb` ze [[light-tester]] (žádný nový asset)
- **Mechanika:** hybrid — scroll odhalí pojem cinematicky, pak `zkus sám` slider/toggle na hraní
- **Render:** 3D scéna, **raw Three.js** (stejně jako light-tester, žádný react-three-fiber)
- **Tón:** hravý, lidský, žádný žargon, mířeno na nefotografa
- **Design systém:** stejný jako light-tester (viz níže), ale vlastní CSS prefix `f101-`

## Insight: 7 pojmů ≠ 7 scén → 1 souvislý svět + 1 switch

Jeden ateliér (hlava + okno) utáhne většinu příběhu:
- hlava → clona/DoF, ISO, ohnisko, úhel, vyvážení bílé, kompozice
- okno (světlý highlight vs tmavý interiér) → HDR ve stejné místnosti
- odlesk na okně → polarizace

Jediný story-beat switch "ven z ateliéru" → krátká venkovní vinětka pro dlouhou expozici + ND filtr.

## Oblouk story (pořadí zamčeno)

0. **Intro** — hlava v černu, hook "Tohle je scéna. Pojď zjistit, co mění výslednou fotku."
1. **Světlo & jas** — scéna od tmy do světla (základ expozice)
2. **Clona → rozmazané pozadí** — největší "aha"
3. **Čas závěrky** — zmraz vs rozmaž pohyb
4. **ISO** — málo světla = šum → shrnutí: tyhle 3 = expoziční trojúhelník, vždy kompromis
5. **Ohnisko** — komprese, proč 85mm lichotí obličeji
6. **Úhel** — spodní = hrdina, horní = malý
7. **Vyvážení bílé** — teplo/chlad = nálada
8. **Kompozice** — třetiny, kam dát subjekt
9. **Ven z ateliéru** — dlouhá expozice + ND filtr
10. **Zpět: HDR + polarizace** (okno)
11. **Finále** — mobil auto-mód vs profi volby → CTA = **formulář zájmu** (Formspree, jako feedback v [[light-tester]])

MVP = sekce 0–5.

## Pojem → 3D technika

| Pojem | Technika v Three.js |
|---|---|
| Clona / DoF | BokehPass (depth-of-field post-processing) + jas |
| Čas závěrky | motion blur jedoucího objektu + jas |
| ISO | grain shader (šum) + jas |
| Ohnisko | změna FOV + dolly (drží velikost subjektu = komprese) |
| Úhel kamery | posun kamery Y + náklon |
| Vyvážení bílé | barva světla / color temp shader |
| Kompozice | rule-of-thirds overlay, posun subjektu |
| Dlouhá expozice | akumulace snímků / streak (hladká voda, světelné stopy) |
| HDR | tone mapping (ACESFilmic) vs ořezané highlighty |
| Filtry (ND/pol) | ND = ztmavení → umožní dlouhý čas; pol = toggle odlesků/sytost oblohy |

## Design systém (zděděno z [[light-tester]])

- CSS vars `--color-*` v `app/globals.css`: bg `#0A0A0B`, text `#F2F0EB`, accent `#C8A96E`
- Plain CSS třídy, prefix `f101-` (light-tester používá `lt-`), konzumují stejné vars
- buttons `lt-btn` / `lt-btn-primary` / `lt-btn-ghost` patterny
- raw Three.js, render-on-demand + pause-when-offscreen (reuse perf pattern z light-testeru)

## ⚠️ Konflikty s cílem (řešit v implementaci)

1. **SEO/mobil:** light-tester má `robots: { index: false }` a blokuje mobil. Focení 101 MUSÍ být indexovatelný a **plně funkční na mobilu** (povinné — lead-gen traffic je hlavně mobil). Potřeba mobilní strategie: low-quality 3D fallback (nižší pixelRatio, vypnuté DoF) nebo předrenderované statické sekvence. ŽÁDNÝ desktop-only block.
2. **Perf:** víc 3D scén na scrollu — nutně IntersectionObserver mount/pause jen viditelné scény. DoF post-processing je drahé.
3. **Motion blur / dlouhá expozice** v real-time je nejtěžší — možná fake (předrenderovaný streak / accumulation buffer).
4. **3D model** — reuse `public/models/head.glb` (žádný nový asset). VYŘEŠENO.

## Stav: sekce 0–8 postaveno (branch `feat/foceni-101`)

Modul `modules/foceni-101/` + route `app/[locale]/foceni-101/` + f101 CSS v globals.css. Typecheck čistý, route 200. Sekce 0–8 (MVP 0–5 + F2: úhel/WB/kompozice) + CTA placeholder.

F2 engine (`StudioScene.tsx`): nové params `angle` (kamera Y), `whiteBalance` (tint vec3 v GrainShader), `composition` (posun subjektu X + světla follow). Mřížka třetin = CSS overlay `f101-thirds` v `Foceni101App.tsx`, jen na sekci `kompozice`.

**Vizuálně neověřeno v browseru** (3D WebGL → nutné lidské oko, playwright headless nespolehlivý). Otevřít `/cs/foceni-101`, scrollovat, hrát s posuvníky. TODO: F3 dlouhá expozice/ND, F4 HDR/polarizace, i18n (CS hardcoded v `sections.ts`), CTA → Formspree, OG image.
