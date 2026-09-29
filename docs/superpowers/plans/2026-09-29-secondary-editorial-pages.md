# Secondary Editorial Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Převést vedlejší veřejné stránky do stejného editorialového světa jako nový web, bez změny jejich obsahu, URL nebo administrace.

**Architecture:** Vznikne jeden lehký obal pro vedlejší editorialové stránky, který znovu použije `EditorialNav` a nastaví společné světlé tokeny. Jednotlivé stránky si ponechají vlastní serverová data a komponenty, ale dostanou stránkové třídy pro odlišné kompozice; právní stránky použijí samostatnou čtecí variantu stejného systému. Globální navigace zůstane pro nástroje, administraci a návrhy.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, společné CSS tokeny, Vitest, Testing Library.

**Spec:** `REDESIGN-PLAN.md` rozšířený uživatelským cílem převést i vedlejší stránky se starým designem.

## Global Constraints

- Zachovat existující texty, ceny, URL, metadata, formuláře, administrační zdroje a Cloudinary data.
- Nevytvářet nové fotografie, reference, klienty ani obchodní tvrzení.
- Blog, portfolio, nástroje a administrace si ponechají svou funkčnost; mění se jen veřejná prezentace vyjmenovaných stránek.
- Nepřidávat novou npm závislost.
- Čeština i angličtina musí dál fungovat ze stejných datových zdrojů.
- Všechny dotykové ovládací prvky musí mít alespoň 44 × 44 px a viditelný `:focus-visible`.
- Po větší změně aktualizovat `CHANGELOG.md`; před commitem spustit `npx tsc --noEmit`.

## Review Focus

- Prázdné portfolio nebo selhání Cloudinary musí zobrazit záměrný stav, ne nekonečný skeleton.
- Dlouhé české a anglické právní nadpisy se nesmí oříznout ani vytvořit horizontální scroll na 375 px.
- Přímý vstup na každou vedlejší URL musí mít právě jednu navigaci a jedno H1.
- Mobilní menu musí po zavření vrátit fokus na spouštěč a znovu povolit scroll stránky.
- Footer a kontaktní odkazy musí zůstat čitelné a ovladatelné na světlém obsahu i tmavém zakončení.

---

### Task 1: Společný obal a navigace vedlejších stránek

**Files:**
- Create: `modules/editorial/components/EditorialSubpage.tsx`
- Create: `modules/editorial/components/__tests__/EditorialSubpage.test.tsx`
- Modify: `modules/editorial/components/EditorialNav.tsx`
- Modify: `modules/editorial/components/__tests__/EditorialNav.test.tsx`
- Modify: `components/Nav.tsx`
- Modify: `components/Footer.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `EditorialSubpage({ active, mode, children })`, kde `active` je `"services" | "portfolio" | "about" | "blog" | "legal"` a `mode` je `"index" | "reading"`.
- Produces: `EditorialNav` přijímající rozšířené `active` a vykreslující sekundární sadu odkazů pro tyto hodnoty.
- Consumes: stávající `EditorialNav`, lokalizované `Link` a editorialové fontové proměnné z locale layoutu.

- [ ] **Step 1: Napsat selhávající test obalu**

```tsx
it("renders one editorial navigation and the requested page mode", () => {
  render(<EditorialSubpage active="portfolio" mode="index"><h1>Portfolio</h1></EditorialSubpage>);
  expect(screen.getByRole("main")).toHaveClass("editorial-secondary", "editorial-secondary--index");
  expect(screen.getByRole("navigation", { name: "Hlavní navigace" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Portfolio");
});
```

- [ ] **Step 2: Spustit test a ověřit očekávané selhání**

Run: `npx vitest run modules/editorial/components/__tests__/EditorialSubpage.test.tsx`

Expected: FAIL, protože `EditorialSubpage` zatím neexistuje.

- [ ] **Step 3: Implementovat minimální obal**

```tsx
type SecondaryPage = "services" | "portfolio" | "about" | "blog" | "legal";

export function EditorialSubpage({ active, mode, children }: {
  active: SecondaryPage;
  mode: "index" | "reading";
  children: React.ReactNode;
}) {
  return (
    <main className={`editorial-secondary editorial-secondary--${mode}`}>
      <EditorialNav tone="light" active={active} />
      {children}
    </main>
  );
}
```

- [ ] **Step 4: Rozšířit sekundární navigaci a skrýt starou globální navigaci jen na převedených trasách**

Sekundární sada odkazů musí být přesně: služby, portfolio, o mně, blog a kontakt. `Nav` vrátí `null` také pro `/sluzby`, `/portfolio`, `/o-mne`, `/blog`, `/vop` a `/privacy`; dynamické blogové články zůstanou pod `/blog`.

- [ ] **Step 5: Zvětšit mobilní spouštěče a footer odkazy**

Použít minimální výšku a šířku `2.75rem` u obou menu tlačítek. Footer odkazy dostanou vertikální padding tak, aby měly dotykovou výšku alespoň 44 px bez změny textu.

- [ ] **Step 6: Přidat společné tokeny a focus pravidla**

```css
.editorial-secondary {
  --editorial-ink: #11100e;
  --editorial-paper: #f4f1ea;
  --editorial-accent: #c93a2b;
  --color-bg: var(--editorial-paper);
  --color-text: var(--editorial-ink);
  color: var(--editorial-ink);
  background: var(--editorial-paper);
  min-height: 100vh;
}

.editorial-secondary :focus-visible {
  outline: 2px solid var(--editorial-accent);
  outline-offset: 4px;
}
```

Odvozené muted, ghost, border a elevated tokeny použít stejným poměrem jako opravené formuláře redesignu.

- [ ] **Step 7: Spustit komponentové testy**

Run: `npx vitest run modules/editorial/components/__tests__/EditorialNav.test.tsx modules/editorial/components/__tests__/EditorialSubpage.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add modules/editorial/components components/Nav.tsx components/Footer.tsx app/globals.css
git commit -m "feat: add secondary editorial shell"
```

### Task 2: Služby a O mně

**Files:**
- Create: `modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`
- Modify: `app/[locale]/sluzby/page.tsx`
- Modify: `app/[locale]/o-mne/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `EditorialSubpage` z Task 1.
- Preserves: `getContent`, `getImages`, `ServiceCards`, `ServiceLinks`, `ContactForm` a existující metadata.

- [ ] **Step 1: Napsat testy kořenových tříd a obsahu**

```tsx
expect(services.querySelector("main.editorial-secondary")).not.toBeNull();
expect(services.querySelectorAll("h1")).toHaveLength(1);
expect(services.querySelector("#kontakt form")).not.toBeNull();
expect(about.querySelector("main.editorial-secondary")).not.toBeNull();
expect(about.querySelectorAll("h1")).toHaveLength(1);
```

Mocky musí vracet skutečný tvar `getContent` a `getImages`; assertions nevymýšlet bez přečtení implementace.

- [ ] **Step 2: Spustit test a ověřit selhání**

Run: `npx vitest run modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`

Expected: FAIL na chybějícím editorialovém obalu.

- [ ] **Step 3: Převést stránku služeb**

Obalit obsah `EditorialSubpage active="services" mode="index"`. Úvod použije velký serifový H1, služby číslovaný dvousloupcový seznam na desktopu a jeden sloupec na mobilu. FAQ a formulář zůstanou funkčně stejné; staré `ServiceCards` se restylují přes stránkový kontext místo duplikace dat.

- [ ] **Step 4: Převést stránku O mně**

Obalit obsah `EditorialSubpage active="about" mode="index"`. Pokud existuje profilová fotografie, použít asymetrický poměr přibližně 5:7; bez fotografie vykreslit typografický blok přes celou šířku bez prázdného rámu. Zachovat oba odkazy i administrační texty.

- [ ] **Step 5: Přidat responzivní CSS**

Desktop: maximální šířka 76rem, asymetrický grid. Mobil: H1 přes `clamp`, první obsah v první obrazovce, bez horizontálního scrollu.

- [ ] **Step 6: Spustit testy**

Run: `npx vitest run modules/editorial/components/__tests__/SecondaryContentPages.test.tsx components/__tests__/ContactForm.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/sluzby/page.tsx app/[locale]/o-mne/page.tsx app/globals.css modules/editorial/components/__tests__/SecondaryContentPages.test.tsx
git commit -m "feat: redesign services and about pages"
```

### Task 3: Portfolio a blog

**Files:**
- Modify: `app/[locale]/portfolio/page.tsx`
- Modify: `app/[locale]/blog/page.tsx`
- Modify: `modules/homepage/components/PortfolioFilter.tsx`
- Modify: `modules/blog/components/BlogPostCard.tsx`
- Modify: `modules/blog/components/BlogPostHero.tsx`
- Modify: `modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `EditorialSubpage` z Task 1.
- Preserves: `getGalleryPhotos`, filtry kategorií, `getBlogPosts`, lokalizované routování a metadata.

- [ ] **Step 1: Doplnit selhávající test prázdných stavů**

```tsx
expect(portfolioHtml).toContain("Galerii se nepodařilo načíst");
expect(blogHtml).toContain("Zatím žádné příspěvky");
expect(portfolio.querySelector("main.editorial-secondary")).not.toBeNull();
expect(blog.querySelector("main.editorial-secondary")).not.toBeNull();
```

- [ ] **Step 2: Spustit test a ověřit selhání editorialového obalu**

Run: `npx vitest run modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Převést portfolio**

Použít `active="portfolio"`. Zachovat filtrování a fotografie; grid dostane rozdílné vertikální rytmy pouze z existujících rozměrů obrázků. Chybový a prázdný stav musí být hotový typografický blok s odkazem zpět na služby, ne nekonečný loading skeleton.

- [ ] **Step 4: Převést blogový index**

Použít `active="blog"`. Hlavní článek ponechat jako výrazný hero; ostatní jako čistý editorialový seznam. Prázdný blog zobrazí stručný stav a odkazy na portfolio a Focení 101, bez vymyšlených článků.

- [ ] **Step 5: Sjednotit kartové komponenty**

Odstranit staré zaoblené tmavé karty pouze v editorialovém kontextu. Zachovat stávající komponenty a přidat jim stránkové třídy; nevytvářet paralelní datovou vrstvu.

- [ ] **Step 6: Spustit testy blogu a sekundárních stránek**

Run: `npx vitest run modules/blog/__tests__ modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/portfolio/page.tsx app/[locale]/blog/page.tsx modules/homepage/components/PortfolioFilter.tsx modules/blog/components app/globals.css modules/editorial/components/__tests__/SecondaryContentPages.test.tsx
git commit -m "feat: redesign portfolio and blog indexes"
```

### Task 4: Čtecí styl právních stránek

**Files:**
- Modify: `app/[locale]/vop/page.tsx`
- Modify: `app/[locale]/privacy/page.tsx`
- Modify: `modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `EditorialSubpage active="legal" mode="reading"`.
- Preserves: veškerý český a anglický právní text přesně beze změny.

- [ ] **Step 1: Doplnit testy právního obsahu**

```tsx
expect(vop.querySelector("main.editorial-secondary--reading")).not.toBeNull();
expect(privacy.querySelector("main.editorial-secondary--reading")).not.toBeNull();
expect(vop.textContent).toContain("Všeobecné obchodní podmínky");
expect(privacy.textContent).toContain("Zásady zpracování osobních údajů");
```

- [ ] **Step 2: Spustit test a ověřit selhání**

Run: `npx vitest run modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`

Expected: FAIL na čtecí variantě.

- [ ] **Step 3: Obalit oba dokumenty čtecí variantou**

Zachovat strukturu sekcí a text. H1 použije editorialový serif, metadata malý sans/mono řez a tělo maximální šířku přibližně 44rem.

- [ ] **Step 4: Přidat čtecí rytmus a mobilní pravidla**

```css
.editorial-secondary--reading .editorial-reading__body {
  max-width: 44rem;
  margin-inline: auto;
  font-size: clamp(1rem, .96rem + .18vw, 1.125rem);
  line-height: 1.75;
}
```

Nadpisy se mohou zalomit libovolně; žádné `white-space: nowrap` ani pevné výšky.

- [ ] **Step 5: Spustit testy**

Run: `npx vitest run modules/editorial/components/__tests__/SecondaryContentPages.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/vop/page.tsx app/[locale]/privacy/page.tsx app/globals.css modules/editorial/components/__tests__/SecondaryContentPages.test.tsx
git commit -m "feat: add editorial reading pages"
```

### Task 5: Kompletní ověření a lokální sloučení

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/redesign-verification.md`

**Interfaces:**
- Consumes: všechny stránky a testy z Tasks 1–4.
- Produces: ověřenou lokální větev `dev` a běžící lokální web.

- [ ] **Step 1: Spustit relevantní testy**

Run: `npx vitest run modules/editorial components/__tests__/ContactForm.test.tsx modules/blog/__tests__ --exclude ".codex/**"`

Expected: PASS.

- [ ] **Step 2: Spustit typovou a produkční kontrolu**

Run: `npx tsc --noEmit`

Expected: bez výstupu a exit code 0.

Run: `npm run build`

Expected: úspěšný Next.js build.

- [ ] **Step 3: Spustit mechanický Impeccable detector jednou nad změněnými cíli**

Run: `C:\Users\TGJ\.codex\plugins\cache\impeccable\impeccable\4.3.1\skills\impeccable\scripts\impeccable.cmd detect --json app/globals.css components/Nav.tsx components/Footer.tsx modules/editorial/components app/[locale]/sluzby/page.tsx app/[locale]/portfolio/page.tsx app/[locale]/o-mne/page.tsx app/[locale]/blog app/[locale]/vop/page.tsx app/[locale]/privacy/page.tsx`

Expected: žádný ověřený P0/P1 nález; falešné pozitivní nálezy popsat ve verifikaci.

- [ ] **Step 4: Vizuálně ověřit desktop a mobil**

Otevřít českou i anglickou variantu `/sluzby`, `/portfolio`, `/o-mne`, `/blog`, `/vop` a `/privacy` v šířkách 1440 a 390 px. Ověřit kontrast, jedno H1, jednu navigaci, focus, 44px dotykové cíle, prázdné stavy a nulový horizontální overflow. Provést jednu opravnou dávku a nejvýše jednu potvrzovací dávku.

- [ ] **Step 5: Aktualizovat dokumentaci před commitem**

Přidat do `CHANGELOG.md` sekci `## [2026-09-29] - Editorialový redesign vedlejších stránek`. Do `docs/redesign-verification.md` zapsat příkazy, otestované URL, šířky a případná omezení lokálního Cloudinary připojení.

- [ ] **Step 6: Commit a fast-forward do lokálního dev**

```bash
git add CHANGELOG.md docs/redesign-verification.md
git commit -m "docs: record secondary page redesign"
git -C .codex/seo-work merge --ff-only codex/editorial-redesign
```

- [ ] **Step 7: Spustit lokální server z výsledného commitu**

Run: `npm run dev`

Expected: web odpovídá na `http://localhost:3000/cs` a všechny auditované URL vracejí 200.

