# Brand Shoot Prep

A Claude Code tool that takes a client **name / LinkedIn / website** and produces a complete
brand photo-shoot proposal: deep client research, three distinct shoot concepts, a moodboard
and a pose board (web-curated references + AI-generated originals), and a client-facing
**Canva** presentation exported to PDF.

It runs natively inside Claude Code — no external app or runtime to start, no API keys
required to begin.

## Usage

In Claude Code, from this project:

```
/brandshoot Jane Doe | https://linkedin.com/in/janedoe | https://janedoe.com
```

Claude then:

1. **Intake & scaffold** — creates `clients/<slug>/`.
2. **Deep research** — website + LinkedIn + competitors → `research.md`.
3. **Three shoot concepts** — distinct, research-grounded → `approaches.md`.
   *(you pick which to board)*
4. **Moodboard** — curated web refs + AI originals → `moodboard.html` + Canva.
5. **Pose board** — pose references + originals → `poseboard.html` + Canva.
6. **Presentation** — assembles a Canva deck, exports PDF → `deliverables/`.
   *(you confirm before export)*

## Output per client

```
clients/
  index.html          ← all-clients gallery (one card per client)
  <slug>/
    index.html        ← interactive internal hub (all info, galleries, ✓/✗ badges)
    proposal.html     ← client-facing (internal tabs/notes hidden, approved-only)
    approvals.json    ← per-concept + per-image approve/reject state
    brief.md          research.md         approaches.md
    assets/moodboard/   assets/poses/
    moodboard.html      poseboard.html
    deliverables/canva-links.md  deliverables/presentation.pdf
codes.json            ← code → client map + salt (git-ignored)
share/                ← deployable bundle: gate + approved proposals (git-ignored)
```

## Requirements

- **Claude Code** with web tools (built in) for research.
- **Canva MCP** connected — the polished deliverable. If unavailable, the local HTML boards
  + markdown still ship.
- **Gemini (optional)** — set `GEMINI_API_KEY` to generate original images locally; otherwise
  originals are generated via Canva.
- **Node ≥ 20** for the helper scripts (uses built-in `fetch`, no dependencies).

## Helper scripts

| Script | Purpose |
| --- | --- |
| `scripts/fetch-images.mjs` | Download image URLs into a folder, dedupe, record sources |
| `scripts/build-board.mjs`  | Render a self-contained, printable HTML board from a folder |
| `scripts/gen-images.mjs`   | Optional Gemini image generation (no-ops without a key) |
| `scripts/build-page.mjs`   | Build interactive client page (`--client` for proposal.html) |
| `scripts/build-index.mjs`  | Build the all-clients gallery at `clients/index.html` |
| `scripts/review-server.mjs`| Local approve/reject UI (`npm run review`) → writes `approvals.json` |
| `scripts/codes.mjs`        | Mint / list / revoke client access codes (`codes.json`) |
| `scripts/build-share.mjs`  | Build the deployable `share/` bundle (gate + approved proposals) |

## Review & share with the client

Approve before the client sees anything, then share via a code:

```
npm run review                      # local approve/reject UI; Finalize rebuilds proposal.html
node scripts/codes.mjs add <slug>   # mint a short code, e.g. tgj-j8ja-k2gz
node scripts/build-share.mjs        # build share/  (gate page + approved proposals)
npx --yes serve share               # preview locally
# then deploy share/ to a static host (Netlify drop, Cloudflare Pages, GitHub Pages)
```

- **Approval is hybrid**: per-concept + per-image. Only approved items reach `proposal.html`
  and the published share. Internal `index.html` shows ✓/✗ badges.
- **Codes**: the client types a code on the gate page; their proposal lives at an
  unguessable path `sha256(salt+code)`, so proposals aren't listed publicly. No expiry;
  revoke any time with `codes.mjs revoke <code>` + rebuild. `codes.json` is git-ignored.
- The local review server is **not hosting** — just a disposable `localhost` process so the
  approve/reject buttons can persist to disk (browsers can't write files from a bare page).

## Notes

Downloaded imagery is **reference-only** (creative direction) and is git-ignored. It's never
presented as the client's own work or as final deliverables.
