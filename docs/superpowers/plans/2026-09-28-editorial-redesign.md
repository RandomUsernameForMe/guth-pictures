# Guth Pictures Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public homepage and three photography service pages as four distinct editorial compositions while preserving localization, admin-managed content, SEO, pricing, and contact flows.

**Architecture:** Keep a shared server-rendered shell for navigation, contact, localized links, and managed image data. Give the homepage, creative portrait, business portrait, and events/weddings pages separate React structures and page-scoped design tokens so their visual systems cannot leak into the rest of the application. Extend the existing KV-backed admin data additively and normalize legacy records at read time.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, next/font, Cloudinary, Vercel KV, Tailwind CSS 4, CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-28-editorial-redesign-design.md`

## Global Constraints

- Work only on `codex/editorial-redesign`; do not merge or push to `main`.
- Preserve `/[locale]/sluzby/portretni-foceni`, `/[locale]/firemni-portrety`, and `/[locale]/sluzby`; add `/[locale]/sluzby/eventy-a-svatby`.
- Keep CS and EN behavior; never hardcode `/cs` in shared components.
- Use only real author photographs listed in `REDESIGN-PLAN.md`; business and event images remain explicit placeholders until populated through admin.
- Preserve existing business prices, terms, FAQ, contact form behavior, package query parameters, and KV content.
- Do not import either 3D tool runtime into the homepage.
- Do not add automatic slideshows, scroll-jacking, cursor-driven motion, or animated font-size changes.
- Respect `prefers-reduced-motion`, visible keyboard focus, semantic headings, and server-rendered links.
- Add a `CHANGELOG.md` entry before each implementation commit; run `npx tsc --noEmit` before every TypeScript commit.
- Do not modify unrelated dirty files, including `tools/brand-shoot-prep/clients/index.html`.

## Review Focus

- Legacy KV records missing every new field must normalize without discarding existing profile, triptych, prices, testimonials, or service copy; Task 1 pins this with normalization tests.
- Admin image payloads containing malformed public IDs, alt text, focal points, unknown slot keys, or oversized arrays must return 400; Task 2 pins this with route validation tests.
- A missing image must render a labelled, layout-stable placeholder while a populated slot uses the correct localized alt and focal crop; Task 3 pins this with component tests.
- CS and EN service URLs, metadata, sitemap entries, navigation active state, and contact anchors must agree; Tasks 3, 5, 6, and 7 pin these paths.
- Widths 320–1440 px, long translated headings, reduced motion, missing tool previews, and keyboard mobile-menu use must not overflow or hide content; Task 8 owns visual and interaction verification.

---

### Task 1: Backward-compatible editorial content and image model

**Files:**
- Modify: `modules/admin/lib/content.ts`
- Modify: `modules/admin/lib/__tests__/content.test.ts`

**Interfaces:**
- Produces: `EditorialImage`, `EditorialImageSlot`, `EditorialImages`, `EditorialCopy`, `normalizeImages(data)`, and additive `ContentData.editorial` / `SiteImages.editorial` fields.
- Consumes: current `ContentData`, `SiteImages`, `normalizeContent`, `getContent`, and `getImages` behavior.

- [ ] **Step 1: Add failing legacy-normalization tests**

Add cases that call exported normalizers with legacy data and assert preservation plus defaults:

```ts
it("normalizes legacy images without losing profile and triptych", () => {
  const result = normalizeImages({ profile: "site/me", heroTriptych: [["a"], ["b"], ["c"]] });
  expect(result.profile).toBe("site/me");
  expect(result.heroTriptych).toEqual([["a"], ["b"], ["c"]]);
  expect(result.editorial.home.hero.publicId).toBe("portfolio/scppmskdespdikncpzhz");
  expect(result.editorial.business.hero.publicId).toBe("");
  expect(result.editorial.events.reportage).toHaveLength(4);
});

it("adds localized editorial copy to legacy content", () => {
  const result = normalizeContent(legacyContent, "cs");
  expect(result.editorial.eventsTitle).toBe("Až budete u toho.");
  expect(result.sluzby.business.packages).toEqual(legacyContent.sluzby.business.packages);
});
```

- [ ] **Step 2: Run the focused test and confirm the missing interfaces fail**

Run: `npx vitest run modules/admin/lib/__tests__/content.test.ts`

Expected: FAIL because `normalizeImages` and `editorial` do not exist.

- [ ] **Step 3: Define the exact additive model and defaults**

Implement these exported shapes in `content.ts`:

```ts
export type FocalPoint = { desktop: string; mobile: string };
export type EditorialImage = {
  publicId: string;
  alt: { cs: string; en: string };
  focal: FocalPoint;
};
export type EditorialImageSlot = EditorialImage | EditorialImage[];
export type EditorialImages = {
  home: { hero: EditorialImage; stories: EditorialImage[]; photographer: EditorialImage; tools: { foceni101: EditorialImage; lightPlanner: EditorialImage } };
  portrait: { hero: EditorialImage; gallery: EditorialImage[] };
  business: { hero: EditorialImage; headshots: EditorialImage[]; atWork: EditorialImage[] };
  events: { hero: EditorialImage; reportage: EditorialImage[] };
};
export type EditorialCopy = { eventsTitle: string };
```

Use `portfolio/scppmskdespdikncpzhz` for homepage and portrait hero, `portfolio/z1tvyvvw0kg6tga3iwef` and `portfolio/p55ackdjary2vyt0dalj` in the creative defaults, and `site/fqny2o2ot6t7ab68muhc` for the photographer. Business and events default to empty public IDs. Default focal strings are `"50% 50%"`; defaults must be newly cloned rather than shared mutable arrays.

- [ ] **Step 4: Normalize reads without rewriting KV**

Make `getImages()` pass KV and fallback data through `normalizeImages`. Make `normalizeContent()` add `editorial.eventsTitle` using `"Až budete u toho."` for CS and `"When you are there."` for EN while keeping all current normalization.

- [ ] **Step 5: Run the focused tests**

Run: `npx vitest run modules/admin/lib/__tests__/content.test.ts`

Expected: PASS, including both legacy cases.

- [ ] **Step 6: Type-check and commit with changelog**

Run: `npx tsc --noEmit`

Add a changelog bullet describing the additive KV schema, then commit only Task 1 files:

```powershell
git add CHANGELOG.md modules/admin/lib/content.ts modules/admin/lib/__tests__/content.test.ts
git commit -m "feat(content): add editorial page data model"
```

### Task 2: Validate and persist editorial admin data

**Files:**
- Modify: `app/api/admin/images/route.ts`
- Create: `app/api/admin/images/__tests__/validation.test.ts`
- Modify: `app/api/admin/content/route.ts`
- Modify: `app/api/admin/content/__tests__/validation.test.ts`

**Interfaces:**
- Consumes: `EditorialImages`, `EditorialCopy`, `getImages`, `setImages`, `getContent`, and `setContent` from Task 1.
- Produces: exported `isValidEditorialImages(value): value is EditorialImages` and validation for optional legacy `ContentData.editorial`.

- [ ] **Step 1: Write image payload validation tests**

Cover a fully valid object, a legacy request containing only `profile`, an unknown slot key, `javascript:` and whitespace public IDs, alt text over 200 characters, malformed focal values, and gallery arrays longer than 12.

```ts
expect(isValidEditorialImages(validEditorialImages())).toBe(true);
expect(isValidEditorialImages({ ...validEditorialImages(), business: { ...business, hero: { ...hero, publicId: "javascript:x" } } })).toBe(false);
expect(isValidEditorialImages({ ...validEditorialImages(), events: { ...events, reportage: Array(13).fill(hero) } })).toBe(false);
```

- [ ] **Step 2: Extend content validation tests**

Assert legacy payloads without `editorial` remain valid, `{ eventsTitle: "Až budete u toho." }` is valid, empty and over-200-character titles are rejected, and unknown editorial keys are rejected.

- [ ] **Step 3: Run both validation suites and confirm failure**

Run: `npx vitest run app/api/admin/images/__tests__/validation.test.ts app/api/admin/content/__tests__/validation.test.ts`

Expected: FAIL because new validation is not implemented.

- [ ] **Step 4: Implement strict additive validation and merge**

Allow public IDs matching the existing Cloudinary regex, `""`, and no other strings. Accept focal points only as percentages matching `^(100|[0-9]{1,2})% (100|[0-9]{1,2})%$`. Limit alt/title fields to 200 characters and image arrays to 12 entries. In the images POST route, load current normalized data and merge only validated `profile`, `heroTriptych`, and complete `editorial` values so one admin save cannot erase another section.

- [ ] **Step 5: Revalidate every affected public route**

Add `/cs`, `/en`, portrait, business, and events/weddings paths to the image and content route revalidation calls.

- [ ] **Step 6: Run validation tests and TypeScript**

Run:

```powershell
npx vitest run app/api/admin/images/__tests__/validation.test.ts app/api/admin/content/__tests__/validation.test.ts
npx tsc --noEmit
```

Expected: all tests PASS; TypeScript exits 0.

- [ ] **Step 7: Update changelog and commit**

```powershell
git add CHANGELOG.md app/api/admin/images/route.ts app/api/admin/images/__tests__/validation.test.ts app/api/admin/content/route.ts app/api/admin/content/__tests__/validation.test.ts
git commit -m "feat(admin): validate editorial content slots"
```

### Task 3: Shared editorial image and navigation primitives

**Files:**
- Create: `modules/editorial/components/EditorialImage.tsx`
- Create: `modules/editorial/components/EditorialNav.tsx`
- Create: `modules/editorial/components/__tests__/EditorialImage.test.tsx`
- Create: `modules/editorial/components/__tests__/EditorialNav.test.tsx`
- Modify: `app/[locale]/layout.tsx`
- Modify: `components/Nav.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `EditorialImage` from Task 1 and locale-aware `Link` from `i18n/navigation.ts`.
- Produces: `EditorialImageView({ image, sizes, priority?, className?, placeholderLabel })` and `EditorialNav({ tone, active })` where `tone` is `"light" | "dark"` and `active` is `"home" | "portrait" | "business" | "events" | null`.

- [ ] **Step 1: Write component tests before implementation**

Assert a populated image renders a Cloudinary URL, localized alt, `object-position` from desktop/mobile CSS variables, and priority only when requested. Assert an empty image renders a stable placeholder with `role="img"` and the supplied localized label. Assert navigation contains locale-aware links to all three services, `#kontakt`, a language switcher, and `aria-current="page"` only on the active service.

- [ ] **Step 2: Run tests and confirm missing modules fail**

Run: `npx vitest run modules/editorial/components/__tests__`

Expected: FAIL because both components are missing.

- [ ] **Step 3: Implement the image primitive**

Use `next/image`, `cloudinaryUrl`, and `blurUrl`. Set CSS custom properties `--focus-desktop` and `--focus-mobile`; a media query switches `object-position`. Keep the aspect ratio controlled by the parent so placeholder and image occupy identical geometry.

- [ ] **Step 4: Implement the shared editorial navigation**

Render semantic `<nav>` and normal links. Desktop links: Portréty, Business, Eventy a svatby, Kontakt. Mobile menu may use the existing client state pattern but must close on navigation, lock body scroll only while open, return focus to the trigger, and use a plain overlay transition disabled by reduced motion.

- [ ] **Step 5: Load deliberate fonts in the locale layout**

Add `Bodoni_Moda`, `Manrope`, and `Oswald` from `next/font/google`, all with `latin-ext` and `display: "swap"`. Expose `--font-editorial-serif`, `--font-editorial-sans`, and `--font-editorial-condensed`. Do not replace DM Sans/Mono globally for admin or existing tools.

- [ ] **Step 6: Isolate page themes in CSS**

Add `.editorial-home`, `.editorial-portrait`, `.editorial-business`, and `.editorial-events` token scopes plus shared focus styles. Add `@media (prefers-reduced-motion: reduce)` rules that disable new transitions. Avoid selectors that target all `main`, `section`, or `a` elements outside these scopes.

- [ ] **Step 7: Make the legacy Nav defer only on editorial routes**

Keep existing navigation for blog, portfolio, tools, and other pages. The four redesigned pages render `EditorialNav` themselves and pass a layout marker or route check so two navs are never visible.

- [ ] **Step 8: Run tests, TypeScript, changelog, and commit**

Run:

```powershell
npx vitest run modules/editorial/components/__tests__
npx tsc --noEmit
```

Then commit Task 3 files with message `feat(ui): add shared editorial primitives`.

### Task 4: Rebuild the editorial homepage and tool previews

**Files:**
- Create: `modules/editorial/components/HomeEditorial.tsx`
- Create: `modules/editorial/components/ToolPreview.tsx`
- Create: `modules/editorial/components/__tests__/HomeEditorial.test.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `app/globals.css`
- Create: `public/editorial/foceni-101-preview.webp`
- Create: `public/editorial/light-planner-preview.webp`

**Interfaces:**
- Consumes: `EditorialImages.home`, normalized content, `EditorialNav`, `EditorialImageView`, `ContactForm`, locale-aware links, and the existing profile copy.
- Produces: server component `HomeEditorial({ locale, content, images })` and presentational `ToolPreview` that never imports either 3D module.

- [ ] **Step 1: Write semantic homepage tests**

Render with populated defaults and assert exactly one H1, service links to portrait/business/events, ordered section IDs `tvorba`, `o-mne`, `foto-nastroje`, `kontakt`, real tool links, an explicit large-screen notice for Light planner, and no imports or markup from `LightTesterApp`/`Foceni101App`. Render with empty tool slots and assert local screenshot fallbacks remain visible.

- [ ] **Step 2: Run the test and confirm failure**

Run: `npx vitest run modules/editorial/components/__tests__/HomeEditorial.test.tsx`

Expected: FAIL because `HomeEditorial` is missing.

- [ ] **Step 3: Capture real lightweight tool previews**

Run the existing development app, open `/cs/foceni-101` and `/cs/light-tester` at 1440 px, wait for fonts and the 3D scene, capture representative screenshots, crop them to 1600×1000, and save optimized WebP files at the exact paths above. Verify both files show the real tools rather than fabricated controls.

- [ ] **Step 4: Implement the homepage composition**

Build the reference order and layout: wordmark/nav; split editorial hero with `Jiný pohled.` and service index; selected stories mosaic; photographer split; two tool previews; large closing contact prompt and `ContactForm`. Use `EditorialImageView` for all managed slots and avoid the old triptych slideshow, `HomeAurora`, `AnimatedSection`, `ServiceCards`, `Testimonials`, and `StickyContactCta` on this page.

- [ ] **Step 5: Implement responsive CSS**

At desktop use the reference asymmetry; at 768 px collapse to a reading order; at 390/320 px keep the H1, short introduction, and beginning of the hero image within the first viewport. Set text measures below 80 characters and prevent `Jiný pohled.` from overflowing with `clamp()` plus a 320 px override.

- [ ] **Step 6: Run homepage tests and TypeScript**

Run:

```powershell
npx vitest run modules/editorial/components/__tests__/HomeEditorial.test.tsx modules/homepage/__tests__/seo-rendering.test.tsx
npx tsc --noEmit
```

- [ ] **Step 7: Update changelog and commit**

Commit Task 4 files with message `feat(home): build editorial homepage`.

### Task 5: Rebuild creative portrait as a dark exhibition

**Files:**
- Create: `modules/editorial/components/PortraitEditorial.tsx`
- Create: `modules/editorial/components/__tests__/PortraitEditorial.test.tsx`
- Modify: `app/[locale]/sluzby/[service]/page.tsx`
- Modify: `modules/homepage/lib/service-pages.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `EditorialImages.portrait`, `EditorialNav`, `EditorialImageView`, existing portrait service copy and packages, `ContactForm`.
- Produces: `PortraitEditorial({ locale, copy, content, images })`; the generic brand-photography rendering remains available for `brandove-foceni`.

- [ ] **Step 1: Add failing portrait routing and rendering tests**

Extend `service-pages.test.tsx` to assert portrait renders `data-editorial-theme="portrait"`, `Tvoje tvář. Jinak.`, creative gallery images/placeholders, a link to `/foceni-101`, current package prices, and the contact form. Assert `brandove-foceni` still renders its current semantic service content.

- [ ] **Step 2: Run the service test and confirm failure**

Run: `npx vitest run modules/homepage/__tests__/service-pages.test.tsx`

- [ ] **Step 3: Split portrait rendering at the route boundary**

Keep metadata and structured data in the route. When `service === "portretni-foceni"`, fetch normalized editorial images and render `PortraitEditorial`; otherwise retain the existing generic brand page. Do not create a new portrait URL.

- [ ] **Step 4: Build the dark exhibition composition**

Use a nearly full-viewport hero, `Tvoje tvář. Jinak.`, `Domluvit portrét`, asymmetric detail/full-body gallery, minimal captions, a short three-step process, current pricing, Focení 101 context link, and contact. Do not use business grids or light homepage surfaces.

- [ ] **Step 5: Add responsive and crop behavior**

Place hero text only over the dark portion; use separate focal positions from the image model at mobile. At 320 px, prevent overlay collisions by moving copy below the image if available dark space is insufficient.

- [ ] **Step 6: Test, type-check, changelog, and commit**

Run focused tests plus `npx tsc --noEmit`; commit with `feat(portraits): create dark exhibition page`.

### Task 6: Rebuild business portraits as a precise light grid

**Files:**
- Create: `modules/editorial/components/BusinessEditorial.tsx`
- Create: `modules/editorial/components/__tests__/BusinessEditorial.test.tsx`
- Modify: `app/[locale]/firemni-portrety/page.tsx`
- Modify: `modules/business-portraits/copy.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `EditorialImages.business`, existing `COPY`, current admin `sluzby.business` packages/extras/note, `EditorialNav`, `EditorialImageView`, and `ContactForm`.
- Produces: `BusinessEditorial({ locale, copy, business, images })`.

- [ ] **Step 1: Write preservation and placeholder tests**

Assert one H1 with `Tvoje práce. Tvoje tvář.`, current price strings and package links, FAQ structured data, a hero placeholder when empty, all headshot/at-work slots, and contact copy. Assert no invented client references are rendered.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx vitest run modules/editorial/components/__tests__/BusinessEditorial.test.tsx`

- [ ] **Step 3: Replace page composition without changing commercial data**

Move rendering into `BusinessEditorial`, but continue reading `COPY` and `getContent(locale).sluzby.business`. Do not change prices, delivery statements, cancellation terms, FAQ answers, or query-string package selection.

- [ ] **Step 4: Implement the visual grid**

Build the split hero, headshot row, use-case text, process, packages, extras, FAQ, and contact with Manrope and business tokens. Empty admin slots render labelled neutral placeholders at fixed ratios.

- [ ] **Step 5: Test, type-check, changelog, and commit**

Run the new test, existing business/service tests, and `npx tsc --noEmit`; commit with `feat(business): build precise portrait landing page`.

### Task 7: Add the events and weddings reportage page and discovery

**Files:**
- Create: `app/[locale]/sluzby/eventy-a-svatby/page.tsx`
- Create: `modules/editorial/components/EventsEditorial.tsx`
- Create: `modules/editorial/components/__tests__/EventsEditorial.test.tsx`
- Modify: `modules/homepage/components/ServiceLinks.tsx`
- Modify: `modules/homepage/lib/service-pages.ts`
- Modify: `modules/homepage/__tests__/service-discovery.test.ts`
- Modify: `app/sitemap.ts`
- Modify: `messages/cs.json`
- Modify: `messages/en.json`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `ContentData.editorial.eventsTitle`, `EditorialImages.events`, wedding packages/note, `EditorialNav`, `EditorialImageView`, `ContactForm`.
- Produces: localized metadata and server-rendered `EventsEditorial({ locale, title, weddings, images })` at the approved URL.

- [ ] **Step 1: Write page, metadata, and sitemap tests**

Assert the CS page renders the admin title, visible words `Eventy a svatby`, current wedding prices, four reportage slots, `Poptat termín`, a secondary larp link, and a contact form. Assert EN metadata/canonical/hreflang, sitemap entries for both locales, and service discovery links use the approved URL.

- [ ] **Step 2: Run focused tests and confirm failure**

Run:

```powershell
npx vitest run modules/editorial/components/__tests__/EventsEditorial.test.tsx modules/homepage/__tests__/service-discovery.test.ts
```

- [ ] **Step 3: Implement the route and metadata**

Create the approved route with localized title/description, canonical and language alternatives, Service JSON-LD, normalized content/images, and one H1. Keep the admin title as the display H1 while metadata remains descriptive.

- [ ] **Step 4: Build the reportage composition**

Render condensed title, explicit `Eventy a svatby` descriptor, wide hero, three-detail sequence, large documentary slot, type-of-events text, current wedding packages/note, secondary larp portfolio link, CTA, and contact. All empty photo positions remain intentional placeholders.

- [ ] **Step 5: Add all discovery paths**

Add the route to `ServiceLinks`, homepage service links, nav, `/sluzby`, sitemap, and CS/EN messages. Do not add the new path to dynamic `serviceSlugs`; it has its own static route.

- [ ] **Step 6: Test, type-check, changelog, and commit**

Run focused tests, full service discovery tests, and `npx tsc --noEmit`; commit with `feat(events): add reportage service page`.

### Task 8: Build the editorial admin editor

**Files:**
- Create: `modules/admin/components/EditorialImageEditor.tsx`
- Create: `modules/admin/components/__tests__/EditorialImageEditor.test.tsx`
- Modify: `modules/admin/components/AdminDashboard.tsx`
- Modify: `modules/admin/components/ContentEditor.tsx`
- Modify: `app/admin/fotky/page.tsx`

**Interfaces:**
- Consumes: `EditorialImages`, gallery `photos`, image POST route from Task 2, and `ContentData.editorial.eventsTitle` through the current content editor save flow.
- Produces: editor UI for every named image slot, localized alt, desktop/mobile focal point, reorder/remove, and event-title fields in both locales.

- [ ] **Step 1: Write admin interaction tests**

Render with one selected photo and assert: selecting a slot then a gallery photo assigns its public ID; editing alt/focal fields updates the payload; removing restores an empty slot; array slots reorder; save POSTs the complete normalized editorial object without deleting profile/triptych; failed save keeps edits and announces an error.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npx vitest run modules/admin/components/__tests__/EditorialImageEditor.test.tsx`

- [ ] **Step 3: Implement a focused editor separate from upload logic**

Keep `AdminDashboard` responsible for upload/gallery and render `EditorialImageEditor` as a child. Group slots by Homepage, Kreativní portrét, Business, and Eventy a svatby. Use existing gallery photos as choices, visible empty states, and explicit save status with `aria-live="polite"`.

- [ ] **Step 4: Add editable event titles to ContentEditor**

Add a single `editorial.eventsTitle` input in each locale tab and keep all existing fields. Initialize legacy editor state through normalized server data, not client-only fallback values.

- [ ] **Step 5: Test, type-check, changelog, and commit**

Run the admin component test, content validation tests, existing admin tests, and `npx tsc --noEmit`; commit with `feat(admin): manage editorial page assets`.

### Task 9: Full verification and visual correction loop

**Files:**
- Modify if defects are found: only files created or changed in Tasks 1–8
- Modify: `CHANGELOG.md`
- Create: `docs/redesign-verification.md`

**Interfaces:**
- Consumes: the complete branch from Tasks 1–8.
- Produces: verified build, screenshot matrix, defect log, and final changelog record.

- [ ] **Step 1: Run static and behavioral checks**

Run:

```powershell
npx tsc --noEmit
npx vitest run
npm run build
```

Expected: all commands exit 0. If the same command fails twice with the same cause, stop retrying and diagnose the root cause.

- [ ] **Step 2: Start the production build and verify routes**

Run `npm run start` and directly open CS and EN versions of homepage, portrait, business, events/weddings, Focení 101, Light Tester, blog, portfolio, and admin login. Verify back/forward navigation, URL, H1, focus, contact anchors, and no double navigation.

- [ ] **Step 3: Capture the required screenshot matrix**

For homepage, creative portrait, business, and events/weddings, capture full page and first viewport at 1440, 1024, 768, 390, and 320 px after `document.fonts.ready` and image decoding. Save outside the repository or under an ignored temporary verification directory.

- [ ] **Step 4: Compare against approved references and correct defects**

Check composition, first-viewport strength, service-world distinction, face crops, placeholder stability, Czech diacritics, long EN headings, whitespace, text measure, focus visibility, and horizontal overflow. Fix only concrete defects and repeat the affected screenshot sizes.

- [ ] **Step 5: Verify reduced motion and keyboard behavior**

Emulate `prefers-reduced-motion: reduce`; ensure no entrance or layout animation remains. Navigate desktop and mobile menus, contact form, FAQ, package links, locale switcher, and admin editor by keyboard only; focus must stay visible and return from the closed mobile menu.

- [ ] **Step 6: Record evidence**

Write `docs/redesign-verification.md` with command results, tested routes/sizes, remaining content placeholders, and the exact business/event slots still awaiting photographs. Do not claim those placeholders are completed portfolio content.

- [ ] **Step 7: Final TypeScript check, changelog, and commit**

Run `npx tsc --noEmit` once more. Add the final verification entry to `CHANGELOG.md`, then commit verification and any visual corrections with `test(redesign): verify responsive editorial pages`.

- [ ] **Step 8: Review the whole branch**

Review `git diff` from the branch base for accidental unrelated edits, duplicate routes, untracked generated screenshots, and missing changelog entries. Confirm the pre-existing modified `tools/brand-shoot-prep/clients/index.html` was not staged or altered by this work.

