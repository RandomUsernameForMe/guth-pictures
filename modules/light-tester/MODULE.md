# Module: Light Tester

Interaktivní 3D simulátor studiového osvětlení — vizualizace světel, jejich barev a efektů na portrét.

## Co dělá

- 3D scéna s kamerou, modelem hlavy a nastavitelnými světly
- Nastavení typu světla, teploty (Kelvin), barevných gelů, intenzity, pozice
- Inspektor parametrů světel v reálném čase
- Uložení/načtení setupů

## Struktura

```
modules/light-tester/
└── components/
    ├── LightTesterApp.tsx   # root komponenta, state management světel
    ├── CameraScene.tsx      # Three.js 3D scéna (kamera, osvětlení, model)
    ├── StudioFloor.tsx      # podlaha a pozadí scény
    ├── Inspector.tsx        # UI panel pro nastavení světel
    ├── types.ts             # typy (Light, LightType, Tweaks, SavedSetup, PRESETS, GEL_SWATCHES)
    └── colorUtils.ts        # konverze barev (kelvinToRGB, mixGel, lightColorCSS)
```

## Přístupová cesta

`/[locale]/light-tester` — veřejná stránka, nevyžaduje autentizaci.

## Závislosti

**Vyžaduje:**
- `three` — 3D engine
- `@react-three/fiber`, `@react-three/drei` — React wrapper pro Three.js
- `public/models/head.glb` — 3D model hlavy

**Shared lib:** žádné závislosti na `@/lib/*`.

**Importován z:**
- `app/[locale]/light-tester/page.tsx`

## Izolace

Plně samostatný modul. Nemá žádné závislosti na jiných modulech projektu ani na `@/lib/*`. Lze extrahovat jako standalone balíček.
