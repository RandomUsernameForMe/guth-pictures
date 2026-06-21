# Module: Focení 101

Interaktivní edukativní scroll-story pro **nefotografy** — ukazuje, co základní parametry foťáku (jas, clona, čas závěrky, ISO, ohnisko) dělají s výslednou fotkou. Cíl: lead-gen + SEO + showpiece.

## Co dělá

- Jedna 3D scéna (hlava + pozadí), sticky přes celý viewport
- Scrolluješ → panely odhalují pojem za pojmem, scéna se plynule přelaďuje
- U každého pojmu slider "zkus sám" (hybrid scroll + interakce)
- Finále = CTA na formulář zájmu o focení

## Pojem → 3D technika (sekce 0–10)

| Pojem | Technika |
|---|---|
| Jas / expozice | `toneMappingExposure` |
| Clona / DoF | `BokehPass` (maxblur dle f-čísla), bokeh koule v pozadí |
| Čas závěrky | orbitující koule + ghost-trail (motion blur fake) |
| ISO | custom grain ShaderPass + mírné zesvětlení |
| Ohnisko | FOV + dolly (drží velikost subjektu = komprese) |
| Úhel | posun kamery Y (`angle` -1..1), lookAt drží subjekt |
| Vyvážení bílé | `tint` vec3 v GrainShader (teplo/chlad multiply) |
| Kompozice | posun subjektu X + světla follow + CSS mřížka třetin |
| **09 Všechno je světlo** | reveal: meter on, otevři clonu → bar swing (clona/čas/ISO = stejné světlo) |
| **10 Capstone** | fix-it: clona locked f/1.4, balancuj čas+ISO na střed metru |

## Světlo = jeden model (expoziční trojúhelník)

`light.ts` = single source of truth pro jas. `computeLight(params) → { mul, evDelta }`:
**clona × čas × ISO × exposure** → jeden multiplikátor (1.0 = správně exponováno), `evDelta = log2(mul)` (0 = akorát, + přepal, − tma). Konzumuje ho `StudioScene` (`toneMappingExposure = 1.05 * mul`) i `ExposureMeter`.

- **Izolované sekce (clona/čas/ISO, `holdLight: true`):** App dopočítá `exposure = holdExposureFor(base)` (auto-exposure) → net mul = 1, vidíš JEN vlastní efekt (blur/šmouha/zrno), žádná změna jasu, meter skrytý.
- **Reveal (09) + capstone (10):** hold vypnutý → bar se hýbe, vidíš coupling.
- **Capstone (10):** clona locked f/1.4, `exposure = 1/apertureMul(1.4)` → při min čas+ISO je to akorát; start `{shutter:0.5, iso:1600}` = přepal, user sjede dolů. Víc kombinací řeší = obchod. `solved` když `|evDelta| < 0.3`.
- Kalibrační knoby (`K_AP`, `S0`, …) nahoře v `light.ts` — dráma > fotografická přesnost.
- `ExposureMeter` = bar overlay na stage, viditelný jen u sekcí s `meter: true`.

## Struktura

```
modules/foceni-101/
└── components/
    ├── Foceni101App.tsx   # scroll orchestrace, sticky stage, sekce/karty, slider state, capstone wiring
    ├── StudioScene.tsx    # Three.js engine: renderer + EffectComposer (Render→Bokeh→Grain→Output)
    ├── light.ts           # čistý light model: computeLight / apertureMul / holdExposureFor (+ test)
    ├── ExposureMeter.tsx  # bar overlay (evDelta), viditelný u meter:true sekcí
    ├── Capstone.tsx       # bespoke fix-it karta: 2 slidery (čas+ISO), success reveal
    ├── sections.ts        # config sekcí (CS text, target params, slider, meter/holdLight/capstone flags)
    └── types.ts           # PhotoParams, Section (+ meter/holdLight/capstone), SectionControl
```

## Přístupová cesta

`/[locale]/foceni-101` — **veřejná, indexovatelná** (na rozdíl od [[light-tester]] funguje i na mobilu).

## Render / perf

- raw Three.js + EffectComposer (postprocessing z `three/examples/jsm`)
- continuous rAF loop, **pauza když offscreen / tab skrytý** (IntersectionObserver + visibilitychange)
- params se plynule lerpují (`current` → `target`) ve smyčce
- **mobil:** `quality="low"` (pixelRatio 1, bez AA, menší shadow mapy) — detekce `matchMedia max-width:768px / pointer:coarse`

## Závislosti

- `three` + `three/examples/jsm/postprocessing/*`, `GLTFLoader`
- `public/models/head.glb` (sdílený s [[light-tester]])
- CSS: prefix `f101-` v `app/globals.css`, konzumuje stejné `--color-*` vars jako light-tester

## Stav

Sekce 0–10 + CTA placeholder. F2 (úhel/WB/kompozice) hotovo. Expoziční trojúhelník hotovo (unified light model + reveal 09 + capstone 10). TODO dle build planu:
- F3 dlouhá expozice/ND, F4 HDR/polarizace
- i18n (teď CS hardcoded v `sections.ts`), OG image, sitemap
- CTA napojit na Formspree (vzor: FeedbackModal v light-testeru)
