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
rationale (why it fits this client), mood, **color palette (hex)**, wardrobe, location /
setting, lighting setup, shot list, and pose direction.

Then add a **`## Color Palettes`** section to the same file: **4–6 distinct named palettes**
(brand-level, 4–6 hex each), grounded in the research and reconciling the client's existing brand
colors. These are the **client-toggle palettes** — on the web the client switches between the
*approved* ones and the proposal page recolors live (background/surfaces/text/accent derived from
the palette). So make them genuinely different in mood (e.g. a dark editorial, a warm light, a
high-contrast graphic). Format each line exactly:

```
## Color Palettes
- **Nokturno:** `#0c0d0f` `#3a3d42` `#8a8d92` `#c0392b` `#e6e4df`
- **Sépie:** `#1c1b19` `#5b5347` `#a8967a` `#e7e1d6` `#b23a2e`
```

Write `clients/<slug>/approaches.md` (concepts + the Color Palettes section).

**Decision point 1:** present the three concepts + the palettes briefly and ask which to board
and which palettes to keep. Default to all three concepts if the user doesn't pick. Palette
approval (like concept/image approval) ultimately happens in the web admin; `approvals.json` may
carry a `palettes: { <palette-id>: "approved" }` map (id = kebab-case of the palette name).

## Phase 4 — Moodboard (web refs + AI originals)

For each chosen concept, follow `references/board-spec.md`. Per concept:

1. **Curate web references (primary image source):** `WebSearch` for imagery matching the
   concept's style, lighting, color, and composition. Collect ~12–20 strong image URLs.
2. Download them:
   ```
   echo '[{"url":"...","note":"warm rim light"}, ...]' \
     | node scripts/fetch-images.mjs clients/<slug>/assets/moodboard --json
   ```
3. **AI originals — deferred (no Gemini yet).** `scripts/gen-images.mjs` is wired but no-ops
   without `GEMINI_API_KEY`. Canva's `generate-design` is a *design* generator, not a
   photographic image generator, so do NOT use it to fake originals. For now boards are built
   from curated web references; AI originals turn on later by setting `GEMINI_API_KEY`.
4. Build the local board (always-works deliverable + preview):
   ```
   node scripts/build-board.mjs clients/<slug>/assets/moodboard clients/<slug>/moodboard.html \
     --title "Moodboard — <name>" --subtitle "<concept>" \
     --palette "#hex,#hex,#hex" --notes "<look in one line>"
   ```
5. **Canva:** create/locate a client folder (`create-folder`), upload web refs by URL
   (`upload-asset-from-url` — they already have URLs from `sources.json`), then have Canva
   generate a `photo_collage` (or `poster`) moodboard design seeded with those `asset_ids`.
   See "Canva assembly" below.

## Phase 5 — Pose board

Same dual sourcing, targeting **pose reference** specifically: a balanced spread of
headshot / three-quarter / full-body / seated / standing / hands, matched to each concept's
posture and energy. Save into `clients/<slug>/assets/poses`, build
`clients/<slug>/poseboard.html`, and assemble a Canva pose board.

Annotate pose tiles with short direction notes (e.g. "chin slightly down, weight on back
foot") via the `--notes` field on fetch and in the Canva captions.

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
- No `GEMINI_API_KEY` → AI originals are skipped; boards use curated web references only.
  (Canva `generate-design` is a design generator, not a photo generator — don't substitute.)
- Canva MCP unavailable → deliver local HTML boards + markdown; note the gap.
- Image download failures are skipped, not fatal (script reports saved/skipped/failed).
