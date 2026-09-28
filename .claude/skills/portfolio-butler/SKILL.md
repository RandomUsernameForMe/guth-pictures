---
name: portfolio-butler
description: >-
  Správa fotek v portfoliu webu: porovná shooty na Google Drive s fotkami na webu,
  navrhne nejlepší fotky ze shootu, hlídá max 2 fotky na shoot a nahraje vybrané
  do Cloudinary. Použij, když uživatel chce přidat fotky na web, zkontrolovat
  portfolio, zjistit co na webu chybí, nebo zavolá /portfolio.
---

# Portfolio Butler

CLI: `npm run portfolio -- <příkaz>` (čte `.env.local`: `CLOUDINARY_*`, `PORTFOLIO_DRIVE_ROOT`).
Shoot = složka nejvyšší úrovně v `Guthovo fotky` včetně podsložek. Lokální název
složky je ID shootu (tvar `2026 9 - Kamča`; Drive for Desktop nahrazuje `/` z názvu na Drive mezerou). Na Drive jsou jen exporty 4–5★.

## Flow

1. `npm run portfolio -- status` → shrň: kolik fotek na webu z 50, shooty s 0 fotkami
   (nejnovější první), porušení limitu, fotky bez shootu. Fotky bez shootu jsou staré
   (před butlerem): až je shoot přenahraný, připomeň smazání starých v `/admin/fotky`
   a znovu označení ★ Selected Work.
2. Zeptej se, který shoot. Pokud uživatel neví, doporuč nejnovější s 0 fotkami.
3. `npm run portfolio -- previews "<shoot>" --out <scratchpad>/previews`, pak přečti
   náhledy (Read na `NNN.jpg`). U velkých shootů (>40) je projdi po dávkách.
4. Navrhni **top 3–5** ve formátu `NNN.jpg — proč` (kompozice, světlo, výraz,
   čím doplní stávající portfolio). Ukaž je uživateli.
5. Uživatel vybere (max tolik, kolik shootu zbývá do 2).
6. Pro každou vybranou navrhni kategorii (`portréty` | `svatby` | `larpy`) a alt text
   cs + en (popisný, 1 věta, bez „fotka…“). Po potvrzení:
   `npm run portfolio -- upload "<originál z map.json>" --category … --alt-cs "…" --alt-en "…"`
7. Na konci znovu `status` a připomeň, že web se obnoví do 5 minut.

## Pravidla

- Nikdy nenahrávej bez výslovného výběru uživatele.
- `--force` jen na výslovný pokyn uživatele.
- Firemní portréty: před uploadem se zeptej, jestli klient dal souhlas s portfoliem
  (smlouva to vyžaduje, `docs/smlouva-business-portrety.md`).
- Pokud web přesáhne 50 fotek, upozorni: nejstarší přestanou být vidět.
