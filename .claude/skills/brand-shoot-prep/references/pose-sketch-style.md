# Pose sketch style (locked)

Pose references are **loose-line AI sketches**, never stock photos — stock breaks the
proposal aesthetic. One locked style keeps the whole pose library consistent across
generators (Canva, local model, or Gemini).

## Locked style spec — use verbatim in every prompt

> Minimal loose single-weight black contour line drawing of one person on a clean plain
> white background. Gesture-sketch / editorial fashion-illustration style. No shading, no
> fill, no color, no background detail. Expressive, confident, economical line. Whole pose
> clearly readable.

Append per-sketch specifics: shot framing, the emotion conveyed by posture, optional minimal
setting cue, and any direction note (e.g. "weight on back foot, chin down").

Shot framing wording:
- `headshot` → head-and-shoulders framing
- `three-quarter` → three-quarter (knees-up) framing
- `full` → full-body framing, head to feet
- `seated` → seated figure, full pose visible
- `hands` → close framing emphasizing hands and gesture
- `environmental` → figure within a suggested minimal environment

(This is the exact wording `scripts/gen-pose-sketch.mjs` builds, so all paths match.)

## Primary path — Canva MCP (no extra cost)

The Canva generation runs through MCP tools you (the agent) call — not a node script.

1. `generate-design` with the locked style spec + per-sketch specifics as the `query`
   (use a `poster` / illustration type, not a photo collage). One figure per sketch.
2. Show candidates, `create-design-from-candidate` for the chosen one.
3. `export-design` → PNG; download the exported URL to a temp file.
4. Add it to the library (this is the only handoff to the scripts):
   ```
   node scripts/library-add.mjs --kind pose --file /tmp/sketch.png \
     --emotion confident --shot three-quarter --setting studio \
     --note "weight on back foot, chin down"
   ```
5. `build-library.mjs` to refresh the browser; `library-pick` into the client.

If Canva output drifts off-style, regenerate with the spec tightened — don't accept stock-
photo-looking results.

## Optional fallback — local model or Gemini

- **Local (free):** any local HTTP image API (Draw Things / ComfyUI) → save PNG →
  `library-add --file`. Same locked spec in the prompt.
- **Gemini (billed):** `scripts/gen-pose-sketch.mjs` builds the locked prompt automatically
  and adds + tags in one step. No-ops without `GEMINI_API_KEY`.
