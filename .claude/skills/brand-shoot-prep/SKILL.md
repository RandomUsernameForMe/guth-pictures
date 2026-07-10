---
name: brand-shoot-prep
description: >-
  Prep a brand photo shoot end-to-end from a client name / LinkedIn / website:
  deep client research, three distinct shoot concepts, a moodboard and a pose board
  (library-first references + AI-generated sketches), synced to a password-gated
  client proposal page on the website. Use when the user wants to prepare, research,
  pitch, or storyboard a brand / personal-branding / founder / headshot photo shoot,
  or invokes /brandshoot.
---

# Brand Shoot Prep

Turn a client identity (name / LinkedIn / website) into a complete, client-ready shoot
proposal hosted on the website. You own the whole pipeline; the photographer just supplies
the identity and makes one creative call along the way (which concepts/palettes to board) —
final approval happens in the web admin.

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
3. Build `clients/<slug>/poseboard.html` with `build-board.mjs`. Pose direction notes ride
   along from the library/`sources.json` notes.

## Phase 6 — Publish (sync to the website)

The proposal is hosted **remotely on the guth-pictures website**. Sync pushes the structured
proposal + images to the site; **all approval happens in the web admin** (concepts, images,
palette choice), then the photographer sets a password, finalizes, and hands the client a
URL + password. The client page has an inline feedback form (concept pick + message), so
client reactions land back in the admin.

```
node scripts/build-proposal-json.mjs clients/<slug>   # assemble structured proposal.json
node scripts/sync-to-web.mjs <slug>                   # builds json if needed, uploads images
                                                      # to Cloudinary, POSTs to the site
```

- `build-proposal-json.mjs` **fails loudly** if it can't parse any concepts or a concept has
  no palettes (usually a malformed heading or a non-indented palette sub-list) — fix
  `approaches.md` and re-run.
- `sync-to-web.mjs` is **idempotent**: image ids are content-derived, and the website preserves
  approval state, password, and admin text edits across re-syncs. Re-run anytime after edits.
- Required env (in `brand-shoot-prep/.env`, git-ignored): `WEB_URL` (default
  `http://localhost:3000`), `PROPOSAL_SYNC_SECRET` (must match the site), and
  `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
- After sync: open `<WEB_URL>/admin/navrhy/<slug>` → approve concepts + images (bulk-approve
  button for fresh syncs), pick one palette per concept, optionally edit concept texts inline
  (edits survive re-syncs) → set a password (min 8 chars) → **Finalize**. Give the client
  `<WEB_URL>/<locale>/navrh/<slug>` + the password.
- The client view shows **approved-only** concepts + images; research stays internal (admin only).
- Optional local preview before syncing: `node scripts/build-board.mjs …` boards from Phases
  4–5 are self-contained HTML you can open directly.

## Canva (pose sketches only)

Canva MCP is used solely to **generate pose sketches** (Phase 5) — the deck/board assembly
path is retired; the website proposal is the deliverable.

- `generate-design` with the locked style spec from `references/pose-sketch-style.md` →
  `export-design` PNG → `library-add.mjs --kind pose --file <png> --emotion … --shot …`.
- Optionally group generated assets under a client folder (`create-folder`, parent `root`).
- Canva unavailable → local model / `GEMINI_API_KEY` fallbacks per Resilience below.

## Resilience

- LinkedIn blocked → research proceeds via `WebSearch`.
- New pose sketches are generated via **Canva MCP** (no extra cost) per
  `references/pose-sketch-style.md`; local model or `GEMINI_API_KEY` are optional fallbacks.
  No generator available → reuse existing library poses. (Canva `generate-design` is a design
  generator — fine for line-art *sketches*, but don't use it to fake *photographic* originals.)
- Empty / thin library → `library-query` returns little; just search/generate the full set as
  before and `library-add` / `gen-pose-sketch` feeds it so the next shoot matches more.
- Image download failures are skipped, not fatal (script reports saved/skipped/failed).
