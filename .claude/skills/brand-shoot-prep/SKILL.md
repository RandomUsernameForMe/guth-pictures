---
name: brand-shoot-prep
description: >-
  Prep a brand photo shoot end-to-end from a client name / LinkedIn / website:
  deep client research, three distinct shoot concepts, a moodboard and a pose board
  (web-curated references + AI-generated originals), and a client-facing Canva
  presentation exported to PDF. Use when the user wants to prepare, research, pitch,
  or storyboard a brand / personal-branding / founder / headshot photo shoot, or
  invokes /brandshoot.
---

# Brand Shoot Prep

Turn a client identity (name / LinkedIn / website) into a complete, client-ready shoot
proposal. You own the whole pipeline; the photographer just supplies the identity and
makes two creative calls along the way.

## Inputs

- **name** — person or brand
- **linkedin** — LinkedIn profile/company URL (optional but preferred)
- **website** — primary website (optional but preferred)
- **notes** — any free-form context the photographer adds (shoot goal, date, budget, vibe)
- **locale** — language for the client-facing proposal: `cs` or `en` (default `cs`). The
  research, concepts, and image notes are authored in this language.

If name + at least one of linkedin/website is present, proceed. Otherwise ask for the
missing pieces before doing anything else.

## Conventions

- **Working directory:** this tool lives at `tools/brand-shoot-prep/` inside the guth-pictures
  repo. Run every command below from there (`cd tools/brand-shoot-prep`); all paths
  (`scripts/…`, `clients/…`, `.env`) are relative to it.
- One folder per client: `clients/<slug>/` where `<slug>` is the kebab-case name.
- Write each phase's artifact to disk **before** moving on, so a run is inspectable and
  resumable. If an artifact already exists, read it and continue rather than redo.
- Cite sources in `research.md`. All downloaded imagery is **reference-only** (creative
  direction) — never presented as the client's own or as final work.
- Helper scripts live in `scripts/` (run with `node scripts/<name>.mjs`). They are
  resilient: missing key / network issues degrade gracefully, they don't hard-fail the run.

## Phase 1 — Intake & scaffold

1. Parse name / linkedin / website / notes from the input.
2. Compute `<slug>`. Create:
   ```
   clients/<slug>/{assets/moodboard,assets/poses,deliverables}
   ```
3. Write `clients/<slug>/brief.md`: the raw inputs, the slug, today's date, a
   `**Locale:** cs|en` line (default `cs`), and any notes and stated goals.

## Phase 2 — Deep research

Use `WebFetch` and `WebSearch`. Work through
`references/research-checklist.md`. At minimum:

- Fetch the website: offering, positioning, tone of voice, existing imagery style, any
  visible brand colors / typography.
- LinkedIn via `WebFetch`; if it's blocked or thin, fall back to `WebSearch` for the
  person/company (bio, role, recent posts, talks, press).
- Search: direct competitors, recent news, the visual conventions of their industry.

Write `clients/<slug>/research.md`: who they are, target audience, brand voice, current
visual identity (palette / fonts / photo style), competitor visual landscape, gaps &
opportunities, and **3–5 visual keywords** that will steer the boards.

Also add a **`**Summary:**` line to `brief.md`** — ONE warm, client-facing sentence (in the
client's locale) that distils who they are and what they're about, proving "we understand you."
This is shown in the proposal hero (research.md itself stays internal). Keep it specific and
human, not generic marketing.

## Phase 3 — Shoot approaches

Using `references/approaches-framework.md`, generate **three distinct concepts** grounded in
the research (don't reuse generic templates — tie each to specific findings). For each:
rationale (why it fits this client), mood, wardrobe, location / setting, lighting setup, shot
list, pose direction, and **its own set of color palettes**.

**Palettes belong to the approach, not the brand.** Under each concept add a `- **Palety:**`
bullet followed by an **indented sub-list of 2–4 named palettes** (4–6 hex each), grounded in
that concept's mood. On the web these become the **client-toggle palettes** scoped to that
approach: the client switches between the *approved* ones and the proposal page recolors live
(background/surfaces/text/accent derived from the palette). Make a concept's palettes genuinely
different in mood (e.g. a dark editorial, a warm light, a graphic variant). Format exactly — the
sub-bullets **must be indented** under `**Palety:**`:

```
- **Mood:** klidné, fundované, lidské
- **Palety:**
  - **Hřejivá:** `#1f1d1b` `#6b5d4f` `#b9a88f` `#e8e2d8` `#a8412f`
  - **Nokturno:** `#0e0f12` `#33373e` `#8a8d92` `#c87f3a` `#e6e4df`
- **Wardrobe:** …
```

`build-proposal-json.mjs` derives each palette's id as `<concept-letter>-<kebab-name>` (e.g.
`a-hrejiva`), unique across the proposal. There is **no** brand-level `## Color Palettes` section
anymore.

Write `clients/<slug>/approaches.md` (concepts, each with its own `**Palety:**` sub-list).

**Decision point 1:** present the three concepts + their palettes briefly and ask which to board
and which palettes to keep. Default to all three concepts if the user doesn't pick. Palette
approval (like concept/image approval) ultimately happens in the web admin; `approvals.json` may
carry a `palettes: { <palette-id>: "approved" }` map (concept-prefixed id).

## Library-first sourcing

A persistent, tagged **library** of pose sketches + moodboard refs lives at
`library/` (sibling to `clients/`, single source of truth `library/manifest.json`). Always
**match the library first**, then only search/generate for gaps — and feed anything new back
so the library grows every shoot. Tag axes + allowed values: `references/tag-vocabulary.md`
(emotion · shot · setting · lighting · palette). **Poses are loose-line AI sketches, not stock
photos** — stock breaks the aesthetic.

Per concept, derive a tag query from its `mood` / `poseDirection` / `lighting` / `location` /
`shotList`, then:

```
node scripts/library-query.mjs --kind pose --emotion confident,calm \
  --shot three-quarter --setting studio --lighting soft --palette neutral
```

Ranked JSON comes back (emotion + shot weigh most). Open the browser to eyeball candidates,
then materialize the picks into the client folder:

```
node scripts/build-library.mjs                 # (re)build library/index.html browser
node scripts/library-pick.mjs <slug> poses pose-0007 pose-0011 --concept A
node scripts/library-pick.mjs <slug> moodboard mood-0003 mood-0009 --concept A
```

`library-pick` copies the files into `clients/<slug>/assets/{poses,moodboard}/` and merges
their notes into that client's `sources.json` — so **everything downstream (build-board,
review, sync) is unchanged**. Other helpers: `library-add` (add a file/URL), `library-tag`
(tag existing items, e.g. after harvest), `library-harvest` (seed from past clients).

## Phase 4 — Moodboard (library-first, then web for gaps)

For each chosen concept, follow `references/board-spec.md`. Per concept:

1. **Match the library first:** `library-query.mjs --kind moodboard …` with the concept's
   tags → present the ranked candidates → you confirm/swap → `library-pick.mjs <slug>
   moodboard <id…> --concept <X>`.
2. **Fill gaps with web references:** if the library lacks coverage, `WebSearch` for imagery
   matching the concept's style/lighting/color/composition and download:
   ```
   echo '[{"url":"...","note":"warm rim light"}, ...]' \
     | node scripts/fetch-images.mjs clients/<slug>/assets/moodboard --json
   ```
   Then **add the good ones back to the library** so they're reusable next time:
   `library-add.mjs --kind moodboard --url <url> --emotion … --note …`.
3. Build the local board (always-works deliverable + preview):
   ```
   node scripts/build-board.mjs clients/<slug>/assets/moodboard clients/<slug>/moodboard.html \
     --title "Moodboard — <name>" --subtitle "<concept>" \
     --palette "#hex,#hex,#hex" --notes "<look in one line>"
   ```
4. **Canva:** create/locate a client folder (`create-folder`), upload web refs by URL
   (`upload-asset-from-url` — they already have URLs from `sources.json`), then have Canva
   generate a `photo_collage` (or `poster`) moodboard design seeded with those `asset_ids`.
   See "Canva assembly" below.

## Phase 5 — Pose board (library sketches, then generate for gaps)

Poses are **loose-line AI sketches** with one consistent style — never stock photos. Use the
**locked style + generation recipe in `references/pose-sketch-style.md`**. Target a balanced
spread of headshot / three-quarter / full / seated / hands / environmental matched to each
concept's posture and energy.

1. **Match the library first:** `library-query.mjs --kind pose …` with the concept's tags →
   confirm/swap → `library-pick.mjs <slug> poses <id…> --concept <X>`.
2. **Fill gaps by generating new sketches** (then `library-add` → reusable forever):
   - **Primary — Canva MCP** (no extra cost): `generate-design` with the locked style spec →
     `export-design` PNG → `library-add.mjs --kind pose --file <png> --emotion … --shot …`.
     Full recipe in `references/pose-sketch-style.md`.
   - **Optional fallback** — local model (Draw Things/ComfyUI) → `library-add --file`, or
     `gen-pose-sketch.mjs` if `GEMINI_API_KEY` is set (builds the locked prompt + tags itself).
   Then `library-pick` the new ids into the client.
3. Build `clients/<slug>/poseboard.html` with `build-board.mjs` and assemble a Canva pose
   board as in Phase 4. Pose direction notes ride along from the library/`sources.json` notes.

## Phase 6 — Presentation (Canva → PDF)

Assemble the deck — the primary deliverable. Order:

1. Cover (client name, "Brand Shoot Proposal", date)
2. Who they are / research summary (audience, voice, visual identity)
3. The three approaches (one section each)
4. Moodboard(s)
5. Pose board(s)
6. Logistics: shot list, wardrobe, location, lighting, timeline

**Decision point 2:** confirm with the user before exporting.

Then `export-design` to PDF into `clients/<slug>/deliverables/presentation.pdf` and record
all Canva URLs + the PDF path in `clients/<slug>/deliverables/canva-links.md`.

## Phase 7 — Prep & approval (review gate)

Nothing reaches the client until the photographer approves it. Approval is **hybrid**:
per-concept and per-image (each moodboard / pose reference).

```
npm run review            # or: node scripts/review-server.mjs --open
```

Opens a local-only review UI (disposable `localhost`, not hosting — browsers can't write
files from a bare page, so this tiny helper persists the choices). Pick the client, toggle
**Approve / Reject** on each concept and image, then **Finalize & build client view**.
This writes `clients/<slug>/approvals.json` and rebuilds `proposal.html` from **approved
items only**. Any later change reopens the draft (must re-finalize).

- Internal `index.html` shows every item with an approval badge (✓ / ✗ / •).
- `proposal.html` and the published share contain **only approved** concepts + images.
- Status values in `approvals.json`: `approved` / `rejected` / (absent = pending).

## Phase 8 — Client pages (build hub + all-clients gallery)

Generate the self-contained pages. Run **after** approval so the internal hub shows correct
badges and the client proposal reflects approved-only items:

```
node scripts/build-page.mjs clients/<slug>            # internal hub -> index.html (approval badges)
node scripts/build-page.mjs clients/<slug> --client   # client-facing -> proposal.html (approved-only)
node scripts/build-index.mjs clients                  # all-clients gallery -> clients/index.html
```

- **index.html** — internal hub (all 6 tabs incl. Overview/Research + sourcing detail + ✓/✗
  approval badges on every image).
- **proposal.html** (`--client`) — hides Overview/Research and internal notes/alternates,
  hides image source hosts, and shows **only approved** concepts + images. (Phase 7's
  Finalize already rebuilds this; re-run only if you tweak after finalizing.)
- Both: hero band (cover = first approved moodboard image, or `--cover <file>`), dark/light
  theme toggle (persisted), print stylesheet, click-to-zoom galleries, palette strip, CTAs.
- **clients/index.html** — gallery card per client (thumbnail, concept, progress, links);
  rebuild after finishing any client.

No deps, offline-capable; reads brief/research/approaches markdown, both galleries +
`sources.json`, `approvals.json`, and `deliverables/canva-links.md`.

## Phase 9 — Publish (sync to the website)

The proposal is hosted **remotely on the guth-pictures website** (not a static bundle). Sync
pushes the structured proposal + images to the site; the photographer then sets a password and
finalizes in the web admin, and hands the client a URL + password.

```
node scripts/build-proposal-json.mjs clients/<slug>   # assemble structured proposal.json
node scripts/sync-to-web.mjs <slug>                   # builds json if needed, uploads images
                                                      # to Cloudinary, POSTs to the site
```

- `sync-to-web.mjs` is **idempotent**: image ids are content-derived, and the website preserves
  any approval state / password set in its admin across re-syncs. Re-run anytime after edits.
- Required env (in `brand-shoot-prep/.env`, git-ignored): `WEB_URL` (default
  `http://localhost:3000`), `PROPOSAL_SYNC_SECRET` (must match the site), and
  `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
- After sync: open `<WEB_URL>/admin/navrhy/<slug>` → approve concepts + images (or it carries the
  local `approvals.json` statuses on first sync) → set a password → **Finalize**. Give the client
  `<WEB_URL>/<locale>/navrh/<slug>` + the password.
- The client view shows **approved-only** concepts + images; research stays internal (admin only).

> Legacy static-deploy path (`scripts/codes.mjs` + `scripts/build-share.mjs`) is **deprecated**
> in favor of the web sync above, but still works if you need a self-hosted static bundle.

## Canva assembly (MCP)

Connection confirmed. Brand kits available: **Nobig.Deals**, **Herkules** (+ one unnamed).
Ask which brand kit to apply (or none) before generating; pass its id as `brand_kit_id`.

- Group the client's work under one folder: `create-folder` (parent `root`).
- Bring in web references first: `upload-asset-from-url` for each curated URL → collect the
  returned `asset_id`s.
- **Boards** (moodboard / pose board): `generate-design` with `design_type: "photo_collage"`
  (or `"poster"`), passing the uploaded `asset_ids` and a descriptive `query`. This returns
  **design candidates** — show them, let the user pick, then `create-design-from-candidate`.
- **Presentation deck**: `generate-design` does **NOT** support `presentation`. Use the
  outline flow — `request-outline-review` → `generate-design-structured` — or
  `search-brand-templates` + `create-design-from-brand-template` for a fixed house style.
- Refine layout/text/images: `start-editing-transaction` → `perform-editing-operations` →
  `commit-editing-transaction`.
- Combine board + deck pages with `merge-designs` if needed.
- Export: `get-export-formats` then `export-design` (PDF) → `deliverables/`.
- If any Canva step is unavailable, the local `moodboard.html` / `poseboard.html` plus the
  markdown artifacts already constitute a usable deliverable — report that and continue.

## Resilience

- LinkedIn blocked → research proceeds via `WebSearch`.
- New pose sketches are generated via **Canva MCP** (no extra cost) per
  `references/pose-sketch-style.md`; local model or `GEMINI_API_KEY` are optional fallbacks.
  No generator available → reuse existing library poses. (Canva `generate-design` is a design
  generator — fine for line-art *sketches*, but don't use it to fake *photographic* originals.)
- Empty / thin library → `library-query` returns little; just search/generate the full set as
  before and `library-add` / `gen-pose-sketch` feeds it so the next shoot matches more.
- Canva MCP unavailable → deliver local HTML boards + markdown; note the gap.
- Image download failures are skipped, not fatal (script reports saved/skipped/failed).
