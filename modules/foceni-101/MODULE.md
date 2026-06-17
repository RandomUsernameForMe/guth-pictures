# Module: Focení 101

Interaktivní edukativní scroll-story pro **nefotografy** — ukazuje, co základní parametry foťáku (jas, clona, čas závěrky, ISO, ohnisko) dělají s výslednou fotkou. Cíl: lead-gen + SEO + showpiece.

## Co dělá

- Jedna 3D scéna (hlava + pozadí), sticky přes celý viewport
- Scrolluješ → panely odhalují pojem za pojmem, scéna se plynule přelaďuje
- U každého pojmu slider "zkus sám" (hybrid scroll + interakce)
- Finále = CTA na formulář zájmu o focení

## Pojem → 3D technika (sekce 0–8)

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

## Struktura

```
modules/foceni-101/
└── components/
    ├── Foceni101App.tsx   # scroll orchestrace, sticky stage, sekce/karty, slider state
    ├── StudioScene.tsx    # Three.js engine: renderer + EffectComposer (Render→Bokeh→Grain→Output)
    ├── sections.ts        # config sekcí (CS text, target params, slider)
    └── types.ts           # PhotoParams, Section, SectionControl
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

Sekce 0–8 + CTA placeholder. F2 (úhel/WB/kompozice) hotovo. TODO dle build planu:
- F3 dlouhá expozice/ND, F4 HDR/polarizace
- i18n (teď CS hardcoded v `sections.ts`), OG image, sitemap
- CTA napojit na Formspree (vzor: FeedbackModal v light-testeru)
