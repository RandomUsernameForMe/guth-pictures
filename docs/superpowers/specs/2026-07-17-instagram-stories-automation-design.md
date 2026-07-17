# Instagram Stories automatizace — design

Datum: 2026-07-17
Stav: schváleno uživatelem (konverzačně), čeká na review spec dokumentu

## Cíl

Automatizovat tvorbu a publikaci Instagram stories pro Guth Pictures. Uživatel jednou
týdně otevře admin, prohlédne připravené návrhy storýček, případně upraví, zvolí
termíny a odklikne. Vše ostatní (výběr fotek, texty, render videa, publikace na IG)
běží samo.

## Kontext

- **guth-story-generator** — samostatná React/Vite appka. Generuje 1080×1920 MP4
  stories ze 2 animovaných šablon (C: fotky + headline, D: rotující slova). Render
  v prohlížeči přes MediaRecorder + html2canvas, stav v localStorage. Zůstává beze
  změny; šablony se zkopírují do portfolia. Po dokončení lze generator vyřadit.
- **guth-pictures** — Next.js portfolio na Vercelu. Má admin panel s autentizací
  (`/admin/*`), fotky v Cloudinary (kategorie), Vercel KV, moduly (`modules/*`).
  Sem se staví vše nové jako modul `modules/stories`.
- IG účet: Business/Creator, propojený (nebo bude propojen) s FB stránkou →
  publikace přes Instagram Graph API.

## Rozhodnutí (z brainstormingu)

1. Zdroj fotek: Cloudinary knihovna portfolia (výběr nejlepších fotek, kategorie).
2. Workflow: systém připraví hotové návrhy, uživatel je týdně schválí/upraví.
3. Texty: fixní schválený zásobník + AI (Claude API) občas navrhne nové varianty.
4. Umístění: admin panel portfolia (`/admin/stories`), žádná nová infrastruktura.
5. Render videa: v prohlížeči při schválení (přístup A). Server-side rendering
   (Playwright/GitHub Actions) zamítnut jako zbytečná infrastruktura; lze doplnit
   později, pokud bude vadit nutnost schvalovat z počítače.

## Architektura

```
┌─ Cron 1 (po, ráno) ─────────┐     ┌─ /admin/stories ──────────────┐
│ výběr fotek z Cloudinary    │ KV  │ živé preview návrhů (šablony) │
│ + texty (zásobník + Claude) ├────►│ úpravy, termín, schválení     │
│ → drafts, e-mail (Resend)   │     │ render v prohlížeči → upload  │
└─────────────────────────────┘     │ do Cloudinary → queue         │
                                    └───────────────┬───────────────┘
┌─ Cron 2 (à 15 min) ─────────┐                     │ KV
│ splatné položky z queue     │◄────────────────────┘
│ → IG Graph API publish      │
│ + refresh IG tokenu         │
└─────────────────────────────┘
```

## Datový model (Vercel KV)

- `stories:texts` — zásobník textů:
  `{id, template: 'C'|'D', headline?, sub?, words?, subHeadline?, source: 'manual'|'ai', approved: boolean}`
- `stories:drafts` — návrhy:
  `{id, template, photos: [{publicId, x, y}], texts (inline kopie ze zásobníku — úpravy v návrhu nemění zásobník), suggestedAt, status: 'draft'}`
- `stories:queue` — schválené položky:
  `{id, videoPublicId, publishAt, status: 'queued'|'published'|'failed', error?}`
- `stories:usedPhotos` — `{publicId, usedAt}`; fotka se ~8 týdnů neopakuje
- `stories:igAuth` — dlouhodobý token + expirace

## Komponenty

### Cron 1 — generování návrhů (pondělí ráno)

Vercel cron → API route:

1. Cloudinary search: fotky portfolia podle kategorií, vyfiltrovat nedávno použité
   (dle `stories:usedPhotos`).
2. Složit 3–5 návrhů: střídání šablon C/D, 3–6 fotek na story, mix kategorií.
3. Texty: většina ze schváleného zásobníku, 1–2 čerstvé návrhy od Claude API
   (označené `source: 'ai'` — uživatel je schvaluje jako součást návrhu).
4. Uložit drafts do KV, poslat e-mail s odkazem na `/admin/stories` (Resend).
   E-mail je nice-to-have; bez něj funguje flow „otevřu admin v pondělí sám".

### Schvalovací UI — `/admin/stories`

- Přenesené komponenty ze story-generatoru: TemplateC, TemplateD, PhotoCycle,
  primitives, useExport (kopie do `modules/stories`, ne sdílený balíček).
- Seznam návrhů se **živým preview** (React šablony, žádné čekání na render).
- Úpravy: texty, výměna/přeuspořádání fotek, focal pointy (x/y), výběr dne+času.
- **Schválit** → render videa v prohlížeči (MediaRecorder, mechanismus
  z generatoru) → upload do Cloudinary (video) → záznam do `stories:queue`.
  IG-kompatibilní MP4 zajistí Cloudinary transformace (`f_mp4,vc_h264`).
- Zamítnout návrh / ručně vytvořit vlastní návrh.
- Záložka správy zásobníku textů (CRUD, schvalování AI návrhů).

### Cron 2 — publikace (každých 15 min)

1. Vzít z `stories:queue` položky s `publishAt <= now` a `status: 'queued'`.
2. IG Graph API: create media container (`media_type: STORIES`, `video_url` =
   Cloudinary MP4 URL) → poll stavu containeru → publish.
3. Chyba → `status: 'failed'` + důvod uložen a viditelný v adminu + e-mail
   notifikace. Žádné automatické retry.
4. Tentýž cron obnovuje dlouhodobý IG token, když zbývá <10 dní do expirace.

## Jednorázové nastavení (manuální, s asistencí)

1. Propojit IG Business účet s FB stránkou (nastavení IG/stránky), pokud už není.
2. Meta developer app → Facebook Login → oprávnění `instagram_content_publish`,
   `pages_read_engagement`. App zůstává v dev módu (pro vlastní účet stačí).
3. Vygenerovat dlouhodobý token (60 dní) → env/KV.

## Chybové stavy

- Publikace selže → `failed` + error v adminu + e-mail. Ruční re-queue z adminu.
- Cron 1 nenajde dost nepoužitých fotek → sníží počet návrhů, případně povolí
  opakování nejstarších použitých; nikdy nespadne naprázdno.
- Expirovaný/neplatný token → publikace failnou s jasnou hláškou, admin ukáže
  stav tokenu.

## Testování

- Unit: výběr fotek (neopakování, mix kategorií), logika fronty, IG publish
  modul s mockovaným fetch.
- **První krok implementace (spike):** ručně publikovat testovací story přes
  Graph API s reálným tokenem a Cloudinary-transkódovaným videem z generatoru —
  ověří celý rizikový řetězec (MediaRecorder → Cloudinary MP4 → IG akceptace)
  před stavbou čehokoli dalšího.
- První ostrá publikace spuštěná ručně, pak teprve zapnout cron.

## Rizika

1. IG akceptace Cloudinary-transkódovaného videa (codec/bitrate/délka) — kryto
   spikem v prvním kroku.
2. Vercel KV limity — objemy triviální (jednotky záznamů týdně), bez rizika.
3. Render v prohlížeči vyžaduje počítač — přijato; server render je pozdější
   rozšíření, pokud bude potřeba schvalovat z mobilu.
