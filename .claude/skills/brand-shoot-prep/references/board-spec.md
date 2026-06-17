# Board Spec — Moodboard & Pose Board

## Moodboard goals
A moodboard sells the *feeling* of a concept fast. Aim for a coherent set, not a random
grab-bag. For each chosen concept collect **12–20** images spanning:

- **Light** — examples of the intended lighting (direction, hardness, color temp)
- **Color** — frames that carry the palette
- **Composition / crop** — headshot, environmental, negative space
- **Texture & wardrobe** — fabrics, surfaces, materials
- **Expression & energy** — the emotional register
- **Location / set** — the kind of space

Mix **web references** (curated, reference-only) with a few **AI originals** that nail the
concept's signature look. Cull anything off-tone — coherence beats volume.

## Pose board goals
Give the subject (and you) a clear menu of body language. Per concept aim for **10–16** poses
balanced across:

- Tight headshot (chin, gaze, shoulder line)
- Three-quarter / waist-up
- Full body (standing, weight shift, stance)
- Seated / leaning / against surface
- Hands & gesture (holding, crossed, in motion)
- Interaction with environment or props

Annotate each with a short direction note (the `note` field on fetch, and the Canva caption),
e.g. "weight on back foot, chin down 10°, soft smile".

## Color palette
- Pull 3–5 hex values from the concept (Phase 3) — pass to
  `build-board.mjs --palette "#hex,#hex,#hex"`.
- The palette should reconcile the client's existing brand colors with the concept's mood.

## Layout
- Local HTML: masonry grid, dark surface, palette swatches up top, source/host captions —
  produced by `scripts/build-board.mjs`. This is the reliable fallback + quick preview.
- Canva: one design per board. Tidy grid, generous gutters, palette strip, concept title.
  Group all of a client's designs in one Canva folder.

## Sourcing hygiene
- `fetch-images.mjs` records every source URL in `sources.json` for attribution and for
  Canva `upload-asset-from-url`.
- All references are **for creative direction only** — never represented as the client's work
  or as final deliverables. Generated originals are watermark-free but clearly labeled
  "concept render" in the deck.
