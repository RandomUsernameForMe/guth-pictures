# Homepage Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-editable testimonials (with optional photo), a sticky post-hero contact CTA, and a mid-page CTA band to the homepage.

**Architecture:** Testimonials extend the existing Vercel-KV `ContentData` model and admin `ContentEditor`, rendered by a new server-safe `Testimonials` component that hides itself when empty. The sticky CTA is a standalone client component driven by two IntersectionObservers (`#hero`, `#kontakt`). The mid-page CTA band is an inline section in `page.tsx`. All styling reuses existing utility classes (`gp-hatch`, `hp-eyebrow`).

**Tech Stack:** Next.js App Router, TypeScript, next-intl, Tailwind v4 + custom CSS utilities, Vitest + Testing Library, Cloudinary.

---

## File Structure

- `modules/admin/lib/content.ts` — add `Testimonial` type, `testimonials` field, export + extend `normalizeContent`.
- `modules/admin/lib/__tests__/content.test.ts` — **new**, tests for `normalizeContent`.
- `app/api/admin/content/route.ts` — export + extend `isValidContentData` to accept/bound testimonials.
- `app/api/admin/content/__tests__/validation.test.ts` — **new**, tests for `isValidContentData`.
- `modules/homepage/components/Testimonials.tsx` — **new**, render component (server-safe).
- `modules/homepage/__tests__/Testimonials.test.tsx` — **new**.
- `modules/admin/components/ContentEditor.tsx` — add `TestimonialEditor` sub-component + photo upload.
- `modules/homepage/components/StickyContactCta.tsx` — **new**, client component.
- `modules/homepage/__tests__/StickyContactCta.test.tsx` — **new**.
- `app/[locale]/page.tsx` — render `Testimonials`, `StickyContactCta`, mid-page CTA band.
- `messages/cs.json`, `messages/en.json` — new `testimonials` + `midCta` keys.

---

## Task 1: Testimonial data model + normalize

**Files:**
- Modify: `modules/admin/lib/content.ts`
- Test: `modules/admin/lib/__tests__/content.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `modules/admin/lib/__tests__/content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeContent, type ContentData } from "@/modules/admin/lib/content";

function baseContent(): ContentData {
  return {
    home: { title: "", subtitle: "" },
    "o-mne": { title: "", subtitle: "", bio: "" },
    lightTesterPromo: { title: "", desc: "" },
    sluzby: {
      portraits: { title: "", desc: "", packages: [] },
      weddings: { title: "", desc: "", packages: [] },
    },
    testimonials: [],
  };
}

describe("normalizeContent — testimonials", () => {
  it("defaults missing testimonials to an empty array", () => {
    const input = baseContent();
    // @ts-expect-error simulate legacy KV data without the field
    delete input.testimonials;
    const out = normalizeContent(input);
    expect(out.testimonials).toEqual([]);
  });

  it("backfills a missing id on a testimonial", () => {
    const input = baseContent();
    // @ts-expect-error simulate legacy row without id
    input.testimonials = [{ quote: "Skvělé focení", author: "Jana" }];
    const out = normalizeContent(input);
    expect(out.testimonials[0].id).toMatch(/[0-9a-f-]{36}/);
    expect(out.testimonials[0].quote).toBe("Skvělé focení");
  });

  it("preserves an existing id", () => {
    const input = baseContent();
    input.testimonials = [{ id: "fixed-id", quote: "q", author: "a" }];
    const out = normalizeContent(input);
    expect(out.testimonials[0].id).toBe("fixed-id");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run modules/admin/lib/__tests__/content.test.ts`
Expected: FAIL — `normalizeContent` is not exported / `testimonials` not on type.

- [ ] **Step 3: Add the type and field**

In `modules/admin/lib/content.ts`, after the `ServiceContent` type (around line 12), add:

```ts
export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;   // optional — e.g. "Svatba, Praha" / job title
  photo?: string;  // optional — Cloudinary public ID
};
```

Add `testimonials` to `ContentData` (after `lightTesterPromo`):

```ts
export type ContentData = {
  home: { title: string; subtitle: string };
  "o-mne": { title: string; subtitle: string; bio: string };
  sluzby: {
    portraits: ServiceContent;
    weddings: ServiceContent;
  };
  lightTesterPromo: { title: string; desc: string };
  testimonials: Testimonial[];
};
```

- [ ] **Step 4: Add `testimonials: []` to both defaults**

In `modules/admin/lib/content.ts`, in `defaults.cs` add `testimonials: [],` as the last property of the `cs` object (after the `sluzby` block, before the closing `},`). Do the same in `defaults.en`. Example for `cs`:

```ts
      weddings: {
        // …existing…
      },
    },
    testimonials: [],
  },
```

- [ ] **Step 5: Export and extend `normalizeContent`**

Change the signature from `function normalizeContent` to `export function normalizeContent`, and add testimonial normalization. Replace the `return { … }` block with:

```ts
export function normalizeContent(data: ContentData): ContentData {
  const normalizeService = (svc: ServiceContent): ServiceContent => ({
    ...svc,
    packages: (svc.packages ?? []).map((pkg) => ({
      ...pkg,
      id: pkg.id ?? crypto.randomUUID(),
    })),
  });
  return {
    ...data,
    lightTesterPromo: data.lightTesterPromo ?? { title: "", desc: "" },
    sluzby: {
      portraits: normalizeService(data.sluzby.portraits),
      weddings: normalizeService(data.sluzby.weddings),
    },
    testimonials: (data.testimonials ?? []).map((t) => ({
      ...t,
      id: t.id ?? crypto.randomUUID(),
    })),
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run modules/admin/lib/__tests__/content.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add modules/admin/lib/content.ts modules/admin/lib/__tests__/content.test.ts
git commit -m "feat(content): add testimonials to content model + normalize"
```

---

## Task 2: API validation for testimonials

**Files:**
- Modify: `app/api/admin/content/route.ts`
- Test: `app/api/admin/content/__tests__/validation.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `app/api/admin/content/__tests__/validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isValidContentData } from "@/app/api/admin/content/route";

function valid(): unknown {
  return {
    home: { title: "t", subtitle: "s" },
    "o-mne": { title: "t", subtitle: "s", bio: "b" },
    sluzby: {
      portraits: { title: "t", desc: "d", packages: [] },
      weddings: { title: "t", desc: "d", packages: [] },
    },
    lightTesterPromo: { title: "t", desc: "d" },
    testimonials: [],
  };
}

describe("isValidContentData — testimonials", () => {
  it("accepts data with no testimonials field (legacy)", () => {
    const d = valid() as Record<string, unknown>;
    delete d.testimonials;
    expect(isValidContentData(d)).toBe(true);
  });

  it("accepts a valid testimonial", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "1", quote: "Skvělé", author: "Jana", role: "Svatba", photo: "site/x" }];
    expect(isValidContentData(d)).toBe(true);
  });

  it("rejects a testimonial without a quote", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "1", author: "Jana" }];
    expect(isValidContentData(d)).toBe(false);
  });

  it("rejects when testimonials is not an array", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = "nope";
    expect(isValidContentData(d)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/admin/content/__tests__/validation.test.ts`
Expected: FAIL — `isValidContentData` is not exported.

- [ ] **Step 3: Add a testimonials validator and export the function**

In `app/api/admin/content/route.ts`, add a `MAX_TESTIMONIALS` constant beside the other limits:

```ts
const MAX_TESTIMONIALS = 30;
```

Add this helper above `isValidContentData`:

```ts
function isTestimonials(v: unknown): boolean {
  if (v === undefined) return true; // optional for legacy KV data
  if (!Array.isArray(v) || v.length > MAX_TESTIMONIALS) return false;
  return v.every((t) => {
    if (!t || typeof t !== "object" || Array.isArray(t)) return false;
    const o = t as Record<string, unknown>;
    if (typeof o.quote !== "string" || o.quote.length === 0 || o.quote.length > MAX_LONG) return false;
    if (typeof o.author !== "string" || o.author.length === 0 || o.author.length > MAX_SHORT) return false;
    if (o.id !== undefined && typeof o.id !== "string") return false;
    if (o.role !== undefined && (typeof o.role !== "string" || o.role.length > MAX_SHORT)) return false;
    if (o.photo !== undefined && (typeof o.photo !== "string" || o.photo.length > MAX_SHORT)) return false;
    return true;
  });
}
```

Change `function isValidContentData` to `export function isValidContentData` and add the testimonials check to its final return:

```ts
export function isValidContentData(d: unknown): d is ContentData {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  const o = d as Record<string, unknown>;
  if (!o.home || typeof o.home !== "object") return false;
  if (!o["o-mne"] || typeof o["o-mne"] !== "object") return false;
  if (!o.sluzby || typeof o.sluzby !== "object" || Array.isArray(o.sluzby)) return false;
  if (!isTestimonials(o.testimonials)) return false;
  const s = o.sluzby as Record<string, unknown>;
  return isServiceContent(s.portraits) && isServiceContent(s.weddings);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/admin/content/__tests__/validation.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/content/route.ts app/api/admin/content/__tests__/validation.test.ts
git commit -m "feat(content-api): validate testimonials on save"
```

---

## Task 3: Testimonials render component

**Files:**
- Create: `modules/homepage/components/Testimonials.tsx`
- Test: `modules/homepage/__tests__/Testimonials.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `modules/homepage/__tests__/Testimonials.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, sizes, placeholder, blurDataURL, ...rest }: {
    src: string; alt: string; fill?: boolean; sizes?: string;
    placeholder?: string; blurDataURL?: string; [key: string]: unknown;
  }) => <img src={src} alt={alt} {...rest} />,
}));

import { Testimonials } from "@/modules/homepage/components/Testimonials";
import type { Testimonial } from "@/modules/admin/lib/content";

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
});

const withPhoto: Testimonial = { id: "1", quote: "Skvělé focení", author: "Jana", role: "Svatba", photo: "site/jana" };
const noPhoto: Testimonial = { id: "2", quote: "Doporučuji", author: "Petr" };

describe("Testimonials", () => {
  it("renders nothing when the list is empty", () => {
    const { container } = render(
      <Testimonials testimonials={[]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders quote and author", () => {
    render(
      <Testimonials testimonials={[noPhoto]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    expect(screen.getByText("Doporučuji")).toBeInTheDocument();
    expect(screen.getByText("Petr")).toBeInTheDocument();
  });

  it("renders an avatar image only when photo is set", () => {
    render(
      <Testimonials testimonials={[withPhoto, noPhoto]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("alt", "Jana");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run modules/homepage/__tests__/Testimonials.test.tsx`
Expected: FAIL — cannot find module `Testimonials`.

- [ ] **Step 3: Write the component**

Create `modules/homepage/components/Testimonials.tsx`:

```tsx
import Image from "next/image";
import { cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";
import type { Testimonial } from "@/modules/admin/lib/content";

type Props = {
  testimonials: Testimonial[];
  locale: string;
  eyebrow: string;
  title: string;
};

export function Testimonials({ testimonials, locale, eyebrow, title }: Props) {
  void locale; // reserved for future localized fields; keeps API consistent with siblings
  if (testimonials.length === 0) return null;

  return (
    <section id="reference" className="max-w-4xl mx-auto px-6 py-32">
      <div className="hp-eyebrow">{eyebrow}</div>
      <h2 className="text-4xl font-bold">{title}</h2>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="relative border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 flex flex-col"
          >
            <blockquote className="text-[var(--color-text-muted)] text-lg leading-relaxed">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-4">
              {t.photo && (
                <div className="w-12 h-12 relative overflow-hidden rounded-full shrink-0">
                  <Image
                    src={cloudinaryUrl(t.photo, "w_96,h_96,c_fill,g_face,q_auto,f_auto")}
                    alt={t.author}
                    fill
                    placeholder="blur"
                    blurDataURL={blurUrl(t.photo)}
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div>
                <div className="text-[var(--color-text)] font-semibold text-sm">{t.author}</div>
                {t.role && (
                  <div className="font-mono text-xs text-[var(--color-text-ghost)] tracking-wider mt-0.5">
                    {t.role}
                  </div>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run modules/homepage/__tests__/Testimonials.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/homepage/components/Testimonials.tsx modules/homepage/__tests__/Testimonials.test.tsx
git commit -m "feat(homepage): testimonials render component"
```

---

## Task 4: i18n keys for testimonials + mid-page CTA

**Files:**
- Modify: `messages/cs.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add the `cs.json` keys**

In `messages/cs.json`, add two top-level namespaces (place after the `"o-mne"` block):

```json
  "testimonials": {
    "eyebrow": "Reference",
    "title": "Co říkají klienti"
  },
  "midCta": {
    "title": "Máte v hlavě focení?",
    "cta": "Ozvěte se"
  },
```

- [ ] **Step 2: Add the `en.json` keys**

In `messages/en.json`, add the parallel namespaces:

```json
  "testimonials": {
    "eyebrow": "References",
    "title": "What clients say"
  },
  "midCta": {
    "title": "Got a shoot in mind?",
    "cta": "Get in touch"
  },
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./messages/cs.json'); require('./messages/en.json'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add messages/cs.json messages/en.json
git commit -m "i18n: testimonials + mid-page CTA strings"
```

---

## Task 5: Sticky contact CTA component

**Files:**
- Create: `modules/homepage/components/StickyContactCta.tsx`
- Test: `modules/homepage/__tests__/StickyContactCta.test.tsx` (create)

The component shows a fixed bottom-right anchor to `#kontakt`. It is hidden while the hero is in view and hidden while the contact section is in view. We track two booleans via IntersectionObserver and expose them so the test can drive visibility through a small pure helper.

- [ ] **Step 1: Write the failing test**

Create `modules/homepage/__tests__/StickyContactCta.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { ctaVisible } from "@/modules/homepage/components/StickyContactCta";

describe("ctaVisible", () => {
  it("hidden while hero is visible", () => {
    expect(ctaVisible({ heroVisible: true, contactVisible: false })).toBe(false);
  });
  it("hidden while contact is visible", () => {
    expect(ctaVisible({ heroVisible: false, contactVisible: true })).toBe(false);
  });
  it("visible when neither hero nor contact is in view", () => {
    expect(ctaVisible({ heroVisible: false, contactVisible: false })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run modules/homepage/__tests__/StickyContactCta.test.tsx`
Expected: FAIL — cannot find module `StickyContactCta`.

- [ ] **Step 3: Write the component**

Create `modules/homepage/components/StickyContactCta.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export function ctaVisible({ heroVisible, contactVisible }: { heroVisible: boolean; contactVisible: boolean }): boolean {
  return !heroVisible && !contactVisible;
}

function useElementInView(id: string, initial: boolean): boolean {
  const [inView, setInView] = useState(initial);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);
  return inView;
}

export function StickyContactCta({ label }: { label: string }) {
  const heroVisible = useElementInView("hero", true);
  const contactVisible = useElementInView("kontakt", false);
  const visible = ctaVisible({ heroVisible, contactVisible });

  return (
    <a
      href="#kontakt"
      aria-label={label}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 49,
        padding: "12px 20px",
        background: "var(--color-text)",
        color: "var(--color-bg)",
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease, visibility 0.3s",
      }}
    >
      {label} →
    </a>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run modules/homepage/__tests__/StickyContactCta.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/homepage/components/StickyContactCta.tsx modules/homepage/__tests__/StickyContactCta.test.tsx
git commit -m "feat(homepage): sticky contact CTA component"
```

---

## Task 6: Wire Testimonials, mid-page CTA band, and sticky CTA into the homepage

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Add imports**

In `app/[locale]/page.tsx`, add to the import block:

```tsx
import { Testimonials } from "@/modules/homepage/components/Testimonials";
import { StickyContactCta } from "@/modules/homepage/components/StickyContactCta";
```

- [ ] **Step 2: Render Testimonials after the Services section**

Immediately after the closing `</AnimatedSection>` of the `#sluzby` section (the one ending at the `</section>` for services) and before the `LightTesterPromo` `AnimatedSection`, insert:

```tsx
      <AnimatedSection>
        <Testimonials
          testimonials={content.testimonials}
          locale={locale}
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
        />
      </AnimatedSection>
```

- [ ] **Step 3: Add the mid-page CTA band after the LightTesterPromo**

After the `LightTesterPromo` `AnimatedSection` and before the `#kontakt` `AnimatedSection`, insert:

```tsx
      <AnimatedSection>
        <section className="gp-hatch gp-hatch-accent border-y border-[var(--color-border-sub)]">
          <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl md:text-4xl font-bold">{t("midCta.title")}</h2>
            <a
              href="#kontakt"
              className="px-7 py-3.5 bg-[var(--color-text)] text-[var(--color-bg)] font-medium text-sm rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              {t("midCta.cta")} <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </AnimatedSection>
```

- [ ] **Step 4: Render the sticky CTA at the end of `<main>`**

Just before the closing `</main>` tag, add:

```tsx
      <StickyContactCta label={t("home.cta")} />
```

- [ ] **Step 5: Type-check the page**

Run: `npx tsc --noEmit`
Expected: no errors. (`content.testimonials` is now typed; all `t(...)` keys exist.)

- [ ] **Step 6: Run the full homepage test suite**

Run: `npx vitest run modules/homepage`
Expected: PASS (existing + new tests).

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat(homepage): mount testimonials, mid-page CTA band, sticky CTA"
```

---

## Task 7: Admin editor for testimonials

**Files:**
- Modify: `modules/admin/components/ContentEditor.tsx`

This adds a `TestimonialEditor` sub-component (add/remove rows; edit quote/author/role; optional photo upload reusing the `/api/admin/upload` flow used by the profile photo), and renders it inside the existing localized content form. It also fixes `emptyContent()` to include `testimonials: []`.

- [ ] **Step 1: Add the type import and fix `emptyContent`**

In `modules/admin/components/ContentEditor.tsx`, update the content type import:

```tsx
import type { ContentData, SiteImages, Testimonial } from "@/modules/admin/lib/content";
```

Add `testimonials: []` to `emptyContent()`:

```tsx
const emptyContent = (): ContentData => ({
  home: { title: "", subtitle: "" },
  "o-mne": { title: "", subtitle: "", bio: "" },
  lightTesterPromo: { title: "", desc: "" },
  sluzby: {
    portraits: { title: "", desc: "", packages: [], note: "" },
    weddings: { title: "", desc: "", packages: [], note: "" },
  },
  testimonials: [],
});
```

Add an empty-testimonial factory beside `emptyPackage`:

```tsx
const emptyTestimonial = (): Testimonial => ({ id: crypto.randomUUID(), quote: "", author: "", role: "", photo: "" });
```

- [ ] **Step 2: Render the editor inside the form**

In the localized form, after the `<Section title="Svatby">…</Section>` block and before the submit `<div className="flex items-center gap-4">`, add:

```tsx
        <Section title="Reference (testimonials)">
          <TestimonialEditor
            testimonials={current.testimonials ?? []}
            onChange={(items) => patch((d) => { d.testimonials = items; })}
          />
        </Section>
```

- [ ] **Step 3: Add the `TestimonialEditor` sub-component**

At the bottom of `modules/admin/components/ContentEditor.tsx` (after `PackageEditor`), add:

```tsx
function TestimonialEditor({
  testimonials,
  onChange,
}: {
  testimonials: Testimonial[];
  onChange: (items: Testimonial[]) => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function update(i: number, updater: (t: Testimonial) => void) {
    const next = testimonials.map((t, idx) => {
      if (idx !== i) return t;
      const copy = structuredClone(t);
      updater(copy);
      return copy;
    });
    onChange(next);
  }

  function add() { onChange([...testimonials, emptyTestimonial()]); }
  function remove(i: number) { onChange(testimonials.filter((_, idx) => idx !== i)); }

  async function uploadPhoto(i: number, file: File, id: string) {
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { publicId } = await res.json();
      update(i, (t) => { t.photo = publicId; });
    } catch {
      // leave photo unchanged on failure
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Reference se na webu zobrazí jen pokud existuje alespoň jedna.</p>
      {testimonials.map((t, i) => (
        <div key={t.id ?? String(i)} className="border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Reference {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Odebrat
            </button>
          </div>
          <textarea
            placeholder="Citace / co klient řekl"
            value={t.quote}
            onChange={(e) => update(i, (x) => { x.quote = e.target.value; })}
            rows={3}
            className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Jméno (autor)"
              value={t.author}
              onChange={(e) => update(i, (x) => { x.author = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
            <input
              type="text"
              placeholder="Role / popis (volitelné)"
              value={t.role ?? ""}
              onChange={(e) => update(i, (x) => { x.role = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </div>
          <div className="flex items-center gap-4">
            {t.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cloudinaryUrl(t.photo, "w_64,h_64,c_fill,g_face,q_auto,f_auto")}
                alt={t.author || "Foto reference"}
                className="w-12 h-12 object-cover rounded-full"
              />
            ) : (
              <span className="text-xs text-gray-500">Bez fotky</span>
            )}
            <label className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30 cursor-pointer">
              {uploadingId === (t.id ?? String(i)) ? "Nahrávám…" : "Vybrat fotku"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(i, file, t.id ?? String(i));
                  e.target.value = "";
                }}
              />
            </label>
            {t.photo && (
              <button
                type="button"
                onClick={() => update(i, (x) => { x.photo = ""; })}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Odebrat fotku
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30"
      >
        + Přidat referenci
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the admin test suite (regression)**

Run: `npx vitest run modules/admin`
Expected: PASS (no admin tests broken; if none exist, command reports no tests in that path — acceptable).

- [ ] **Step 6: Commit**

```bash
git add modules/admin/components/ContentEditor.tsx
git commit -m "feat(admin): testimonials editor with optional photo upload"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npx vitest run`
Expected: PASS (all suites).

- [ ] **Step 2: Type-check the project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors in the touched files.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run: `npm run dev`, then:
- Visit `/cs` — confirm no testimonials section appears (empty list), mid-page CTA band shows after the Light Tester promo, sticky CTA appears after scrolling past the hero and disappears over the contact form.
- Visit `/admin/obsah` — add a reference with and without a photo, save, reload `/cs`, confirm both render (avatar only on the one with a photo).

---

## Self-Review Notes

- **Spec coverage:** testimonials data model (T1), API validation (T2), render with photo/no-photo variants (T3), admin editor with optional upload (T7), hidden-when-empty (T3 test), sticky CTA via `#hero`/`#kontakt` observers (T5–T6), mid-page CTA band (T6), i18n (T4), no section renumbering (T6 placement). All covered.
- **Type consistency:** `Testimonial` shape `{ id, quote, author, role?, photo? }` is identical across `content.ts`, the validator, the render component, and the admin editor. `normalizeContent` and `isValidContentData` are exported exactly as the tests import them.
- **Upload flow:** uses `/api/admin/upload` with `FormData` (`file` + `folder`) returning `{ publicId }` — the same call the existing profile-photo uploader uses (not the signature endpoint mentioned loosely in the spec).
