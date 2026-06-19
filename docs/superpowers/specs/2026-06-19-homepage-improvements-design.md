# Homepage Improvements — Design

**Date:** 2026-06-19
**Status:** Approved for planning

## Goal

Strengthen the homepage on three fronts the user prioritized: visual/design polish,
new content (social proof), and conversion (clearer paths to contact). Performance is
explicitly out of scope.

During scoping, two candidate items were dropped:

- **`SelectedWork` work strip** — rejected. The hero triptych already showcases work,
  so a second work showcase is redundant.
- **Service-card → contact prefill** — already fully implemented. `ServiceCards` deep-links
  `?package=…&service=…#kontakt`, and `ContactForm` reads those params and prefills the
  message via the `packagePreset` translation. Nothing to build.

Final scope is three independent pieces:

1. Testimonials section (social proof) — admin-editable, hidden until ≥1 exists.
2. Sticky CTA that appears after the hero scrolls away.
3. Mid-page CTA band after the Services section.

All three reuse existing patterns: Vercel KV content model, `AnimatedSection`,
the hatch/mono editorial styling, the navbar's IntersectionObserver, and the
Cloudinary upload-signature flow.

## 1. Testimonials

### Data model

Add to `ContentData` in `modules/admin/lib/content.ts`:

```ts
export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;   // e.g. "Svatba, Praha" / job title — optional
  photo?: string;  // Cloudinary public ID — optional
};

export type ContentData = {
  // …existing fields…
  testimonials: Testimonial[];
};
```

- `normalizeContent` defaults `testimonials` to `[]` and assigns `id` to any row missing
  one (same `crypto.randomUUID()` pattern already used for `packages`).
- `defaults.cs` and `defaults.en` ship with `testimonials: []` (start empty).

### Render component

New `modules/homepage/components/Testimonials.tsx` (server-safe; no client interactivity
required).

- Returns `null` when `testimonials.length === 0` → **section hidden until ≥1 exists**.
- Editorial styling consistent with the rest of the page: unnumbered eyebrow label,
  hatch background band (`gp-hatch`), quotes laid out in a 1–2 column grid, author rendered
  as a mono line.
- **Two variants per testimonial, chosen by whether `photo` is set:**
  - **With photo** — circular/square avatar rendered via `next/image` using
    `cloudinaryUrl(photo, "w_…,c_fill,g_face,q_auto,f_auto")` and `blurUrl` placeholder
    (same approach as the About profile photo), placed beside the author line.
  - **Without photo** — quote-only; the avatar slot is omitted, author shown as a mono line.
  - Same card shell for both; only the avatar slot differs.

### Admin editor

Add a "Reference" (Testimonials) section to `modules/admin/components/ContentEditor.tsx`:

- Add / remove / reorder-free list of rows; each row edits `quote` (textarea), `author`,
  `role`, and an **optional photo upload**.
- Array editing reuses the existing add/remove row pattern already used for service
  `packages` in this file.
- Photo upload reuses the existing Cloudinary upload-signature flow already used for the
  profile photo / hero triptych (`/api/admin/upload-signature`). Clearing the photo →
  no-photo variant.

### Placement

Rendered in `app/[locale]/page.tsx` between the Services section (`#sluzby`, 02) and the
`LightTesterPromo`, wrapped in `AnimatedSection`. Data comes from the already-loaded
`content.testimonials`.

## 2. Sticky CTA after hero

- A small fixed "Kontakt →" / "Contact →" button, bottom-right, that appears once the hero
  has scrolled out of view.
- Reuses the **same IntersectionObserver signal** the navbar already computes inside
  `HeroSection` (`navbarVisible`). The sticky CTA shows when `navbarVisible` is true.
- Suppressed while the contact section is in view, so it never overlaps the form, via a
  second small IntersectionObserver on `#kontakt` (CTA hides when `#kontakt` is intersecting).
- Uses `visibility: hidden` (not just opacity) when inactive — same a11y rationale as the
  navbar, keeping it out of the tab order while hidden.
- Anchors to `#kontakt`.

## 3. Mid-page CTA band

- A full-width hatch band rendered after the Services section: short headline plus a
  "Kontakt →" anchor to `#kontakt`.
- New small section in `app/[locale]/page.tsx`, wrapped in `AnimatedSection`, text pulled
  from i18n messages.

## Section numbering

Existing numbered sections stay as-is (About 01, Services 02, Contact 03). Testimonials and
the mid-page CTA band are unnumbered interstitial bands — matching how `LightTesterPromo`
already sits between numbered sections without a number. This avoids renumbering churn.

## i18n

New keys in `messages/cs.json` and `messages/en.json`:

- Testimonials: eyebrow label + section title.
- Mid-page CTA: headline + button label.
- Sticky CTA: button label.

Testimonial content itself (quotes/authors) lives in KV content, not in message files.

## Testing

- `Testimonials.tsx`: renders `null` when the list is empty; renders quote/author when
  present; renders the avatar only when `photo` is set (vitest, in the style of the existing
  `modules/homepage/__tests__/visual-components.test.tsx`).
- Sticky CTA: visibility toggles correctly with the observer/visible state.
- `normalizeContent`: defaults `testimonials` to `[]` and backfills missing `id`s.

## Out of scope

- Performance work (mobile LCP) — tracked separately.
- `SelectedWork` strip, portfolio teaser, FAQ, Google-reviews import.
- Renumbering existing sections.
