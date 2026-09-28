# Portfolio Butler — design

Datum: 2026-09-28 · Stav: schváleno v konverzaci

## Cíl

Konverzační pomocník (Claude Code skill `/portfolio`) pro správu fotek v portfoliu webu:
ukáže, které shooty ještě nemají zastoupení na webu, z vybraného shootu navrhne nejlepší
fotky, ohlídá pravidlo **max 2 fotky na shoot** a vybrané fotky nahraje do Cloudinary.

## Současný stav

- Fotograf exportuje z Lightroom CC jen 4–5★ fotky, nahrává je na Google Drive
  (`Guthovo fotky/<shoot>/`) a na web je ručně nahrává přes `/admin/fotky`.
- Web čte Cloudinary složku `portfolio` (`lib/cloudinary.ts`, max. 50 fotek, řazeno od nejnovější).
  Metadata: `context.category` (`portréty` | `svatby` | `larpy`), `context.alt_cs`, `context.alt_en`,
  tag `selected_work`.
- Vazba fotka → shoot neexistuje.

## Rozhodnutí

| Téma | Rozhodnutí |
|---|---|
| Zdroj kandidátů | Google Drive přes Google Drive for Desktop (lokální disk) |
| Definice shootu | Složka nejvyšší úrovně v `Guthovo fotky`, **včetně všech podsložek**. Název složky = ID shootu (např. `2026/9 - Kamča`) |
| Vazba na webu | Nové pole `context.shoot` v Cloudinary se stejnou hodnotou |
| Výběr | Claude vizuálně navrhne top 3–5, uživatel vybere 2 |
| Spouštění | Jen na požádání (`/portfolio`), žádný cron |
| Upload | Plně automatický skript s Cloudinary klíči v `.env.local` |
| Pravidla v1 | Jen max 2 fotky na shoot |

Proč Drive for Desktop: Drive MCP konektor neumí vrátit náhled, jen celý soubor (8–12 MB),
což je pro vizuální hodnocení nepoužitelné. Lokální soubory + `sharp` dají náhledy 800 px.

## Komponenty

### `scripts/portfolio.ts` (spouštění `npx tsx scripts/portfolio.ts <cmd>`)

Konfigurace přes env: `CLOUDINARY_*` (z `.env.local`), `PORTFOLIO_DRIVE_ROOT`
(cesta ke složce `Guthovo fotky` na disku Drive for Desktop).

Příkazy:

- `status`: tabulka shootů (Drive) × počet fotek na webu. Označí shooty s 0 fotkami,
  **porušení** (> 2) a fotky na webu bez `context.shoot`. Vypíše i celkový počet fotek
  v `portfolio` vůči limitu 50.
- `previews <shoot>`: rekurzivně projde složku shootu, vygeneruje JPEG náhledy
  (delší strana 800 px) do předané výstupní složky (scratchpad) a vypíše mapu
  `náhled → originál`.
- `upload <soubor> --shoot <id> --category <kat> --alt-cs <text> --alt-en <text>`:
  nahraje originál do Cloudinary složky `portfolio` s `context` {shoot, category, alt_cs, alt_en}.
  Před nahráním ověří pravidlo; pokud by shoot měl > 2 fotky, odmítne upload (bez `--force`).
- `backfill`: pro fotky v `portfolio` bez `shoot` spočítá perceptual hash (dHash)
  z Cloudinary náhledu a porovná ho s hashi fotek na Drive. Vypíše navržené párování
  se vzdáleností. `backfill --apply <mapping.json>` zapíše potvrzené párování do `context.shoot`.

Čisté funkce (testované): `shootFromPath(root, filePath)`, `countViolations(photos, max)`,
`dhashDistance(a, b)`.

### `.claude/skills/portfolio-butler/SKILL.md`

Popisuje flow:

1. `status`, přehled.
2. Uživatel vybere shoot (nebo Claude doporučí nejstarší nezastoupený).
3. `previews` → Claude si prohlédne náhledy → navrhne top 3–5 s krátkým důvodem
   (kompozice, světlo, výraz, jak doplní stávající portfolio).
4. Uživatel vybere (max. do limitu shootu).
5. Claude navrhne kategorii + alt texty cs/en → po potvrzení `upload`.

## Data flow

```
Drive for Desktop ──(fs + sharp)──► náhledy ──► Claude hodnotí ──► uživatel vybírá
                                                                     │
Cloudinary portfolio ◄──(upload s context.shoot)─────────────────────┘
        │
        └──(search: folder:portfolio, with_field context)──► status / backfill
```

Web se nemění: `lib/cloudinary.ts` pole `shoot` ignoruje.

## Error handling

- Chybí `PORTFOLIO_DRIVE_ROOT` nebo neexistuje → jasná hláška + návod (nainstalovat Drive for Desktop).
- Chybí Cloudinary klíče → hláška „spusť `vercel env pull .env.local`“.
- Soubor ještě není stažený z Drive (online-only placeholder) → čtení ho stáhne; při selhání soubor přeskočit s varováním.
- Upload nad limit shootu → odmítnout bez `--force`.

## Testování

Jeden vitest soubor `scripts/__tests__/portfolio.test.ts` pro čisté funkce
(`shootFromPath` včetně podsložek a diakritiky, `countViolations`, `dhashDistance`).
Ruční ověření: `status` a `previews` na reálné složce `2026/9 - Kamča`.

## Rizika / známé limity

- Web zobrazuje jen 50 nejnovějších fotek, takže nové uploady tiše vytlačí staré. v1 to jen hlásí ve `status`.
- Souhlas klienta se zveřejněním se nehlídá. U firemních portrétů smlouva vyžaduje souhlas
  (`docs/smlouva-business-portrety.md`), proto je třeba ho před uploadem ověřit ručně.
- Backfill přes dHash nemusí spárovat fotky oříznuté nebo jinak upravené, ty je pak nutné přiřadit ručně.

## Mimo rozsah (později)

Vyváženost kategorií, čerstvost, správa limitu 50, seznam souhlasů/výjimek,
paměť zamítnutých fotek, pravidelné připomínky, úpravy adminu.
