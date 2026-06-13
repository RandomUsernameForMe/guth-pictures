# Performance Baseline — Phase 0

Captured: 2026-06-13 · Next 16.1.6 (Turbopack) prod build · Lighthouse (system Chrome, headless).
Server: `next start` on :3100. Measure again after fixes, same setup.

## Lighthouse scores

| Route | Desktop perf | Mobile perf | Mobile LCP | Mobile CLS | Mobile TBT | Mobile TTI |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|
| `/cs` (home) | 96 | 84 | **4.5s** | 0 | 50ms | 4.5s |
| `/cs/portfolio` | 99 | 87 | **4.0s** | 0 | 20ms | 4.3s |
| `/cs/blog` | 100 | 87 | **3.6s** | **0.113** | 40ms | 3.6s |
| `/cs/light-tester` | 69 | 87 | 3.7s | 0 | **150ms** (desktop 1200ms) | **5.2s** |

Targets: LCP < 2.5s, CLS < 0.1, TBT < 200ms.

## Bundle (built static JS = 1.8MB total)

| Chunk | Size | Contents |
|-------|:-:|----|
| 225df83d… | 612KB | **three.js** (WebGLRenderer) — lazy, light-tester only ✓ |
| 3d3accb0… | 220KB | react-dom vendor |
| ac87acb9… | 132KB | framer-motion |
| a6dad97d…, 7d6514a9… | 112KB ×2 | unidentified (likely next-intl / react-markdown) |

## HTML payload (uncompressed, prod)

| Route | HTML | TTFB |
|-------|:-:|:-:|
| `/cs` | 52KB | 204ms |
| `/cs/portfolio` | **86KB** | 53ms |
| `/cs/blog` | 27KB | 50ms |
| `/cs/light-tester` | 45KB | 48ms |

## Root-cause findings (ranked)

1. **Mobile LCP 3.6–4.5s all routes.** Homepage LCP=4533ms vs FCP=1367ms → 3.1s render delay after paint.
2. **Portfolio LCP image `loading="lazy"` + no `fetchpriority=high`** (Lighthouse lcp-discovery FAIL, score 0). First above-fold image must be `priority`. Uses next/image+srcset correctly otherwise.
3. **HeroSection uses raw `<img>`** (no next/image) — homepage LCP candidate, unoptimized, no responsive srcset.
4. **Cloudinary direct URLs hardcoded `w_800`** in some spots — oversized on 360px mobile (112KB top image).
5. **light-tester TBT 1200ms desktop / TTI 5.2s** — three.js parse+init blocks main thread. Lazy ✓ but needs init deferral / lower pixel ratio / loading state.
6. **Blog CLS 0.113** (>0.1 fail) — un-reserved space, likely cover image / web font swap.
7. **All content routes `ƒ Dynamic`** (home, portfolio, blog-list, light-tester) — only `blog/[slug]` is SSG. ISR/static would cut TTFB.

## Fix attempt #2 + #3 — results (controlled A/B, same machine)

LCP medians of 3 runs each, Lighthouse mobile, `next start`:

| Route | Baseline | After | Verdict |
|-------|--:|--:|---|
| `/cs` (home) | ~3960ms | ~4459ms | within noise |
| `/cs/portfolio` | ~4312ms | ~4392ms | within noise |

**Shipped (kept):**
- Cloudinary `<link rel="preconnect">` in locale layout (no `crossOrigin` — plain `<img>`/next-image aren't CORS).
- `PhotoGrid` `priority` on first 2 images (removes Lighthouse `lcp-discovery` FAIL: don't lazy-load LCP). Default `priorityCount=2` — mobile is 1-column, more priority preloads starve the real LCP image.

**Not changed (left at original):** hero `loading`/`q_auto:good`. An earlier note here claimed `loading="lazy"` on the underlay regressed LCP +1.5s — **that was wrong, a measurement artifact** (see methodology bug below). Re-tested cleanly: lazy underlay (3 eager imgs) vs eager (6 imgs) is indistinguishable in the noise (medians 4460 vs 4882ms, ranges fully overlapping). Behavior left as original.

## ⚠ Methodology bug that invalidated session-1 A/B

`pkill -f "next start"` kills the npm wrapper but **not** the detached `next-server` child. The child kept holding the port; every "restart" hit `EADDRINUSE` and silently kept serving the **first** build. All stash-based A/B in session 1 measured one frozen build → the "regressions" were host-load noise, not code.
**Fix:** kill by port — `kill -9 $(lsof -nP -iTCP:<port> -sTCP:LISTEN -t)` — and verify a known signature in the served HTML before trusting any measurement. (Distinguish your server from the user's by Next version: this project is v16.1.6.)

## Preload LCP image — follow-up (DONE, no code needed)

**Finding (deterministic, from HTML inspection — not noise):** the LCP image is *already* preloaded automatically.
- Homepage: **React 19 auto-emits `<link rel="preload" as="image">` for every eager hero `<img>`** (verified: 6 eager imgs → 6 preload links, present with or without a manual `ReactDOM.preload`).
- Portfolio: `next/image` with `priority` auto-injects the preload.

A manual `ReactDOM.preload` is redundant — it dedupes against React's auto one and changes nothing (A vs B medians 4667 vs 4882ms = noise). **No preload code added.**

**Remaining real levers (not yet done):**
1. **Cut LCP image bytes.** Hero is fixed `w_800`; full-height `object-cover` may even want *larger* on retina — needs real-device check, not this rig.
2. **Fewer eager hero images.** 6 eager imgs all compete for throttled bandwidth; the underlay is only needed after the first crossfade. Lazy-loading it is plausibly a win but unprovable here (noise).
3. **Validate with field data** (Vercel Speed Insights / CRUX). The ±750ms local noise floor cannot resolve sub-second LCP changes — stop tuning LCP on this laptop.

Note: 4 pre-existing HeroSection tests fail (`IntersectionObserver` unmocked in jsdom) — unrelated to these changes.

## Routes render-mode (build)
- SSG: `blog/[slug]`
- Dynamic (server-rendered on demand): `/[locale]`, `/[locale]/blog`, `/[locale]/portfolio`, `/[locale]/light-tester`
