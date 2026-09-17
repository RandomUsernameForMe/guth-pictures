# Library tag vocabulary

Controlled vocabulary for the brand-shoot library (`tools/brand-shoot-prep/library/`).
Tags only enable matching if they stay consistent — the scripts validate against these
lists and **warn** (don't fail) on unknown values. Add new values here first, then use them.

Four axes. `shot` is a **single value** (poses only). The rest are **lists** (one or more).

## emotion / mood (list)

`confident` `calm` `warm` `sharp` `playful` `authoritative` `approachable`
`focused` `bold` `serene` `dynamic` `thoughtful` `friendly` `intense` `relaxed`
`grounded` `engaged`

## shot (single — poses only)

`headshot` `three-quarter` `full` `seated` `hands` `environmental`

(Moodboard items usually omit `shot`.)

## setting / context (list)

`studio` `office` `stage` `outdoor` `home` `urban` `workshop` `neutral-bg`

## lighting (list)

`soft` `hard` `dark` `bright` `natural` `mixed` `dramatic` `high-key` `low-key` `rim`

## palette (list)

`neutral` `warm` `cool` `dark` `bright` `earthy` `monochrome` `vibrant` `muted`

## Mapping a concept to a tag query

From `approaches.md` a concept gives you:

- **Mood** line → pick the closest `emotion` words.
- **Pose direction** → posture energy (`dynamic`, `grounded`, `relaxed`) + which `shot`
  types to cover (headshot/three-quarter/full/seated/hands/environmental).
- **Lighting** line → `lighting` words.
- **Location / setting** → `setting` words.
- **Palette** mood → `palette` family.

Query the library with those, confirm/swap the ranked candidates, then pick.
