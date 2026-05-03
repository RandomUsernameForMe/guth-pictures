# Module: Blog

Blogové články — čtení, správa přes admin, automatizované publikování skriptem.

## Co dělá

- Zobrazuje seznam článků (`/[locale]/blog`) a detail (`/[locale]/blog/[slug]`)
- CRUD článků přes admin panel (`/admin/blog`)
- Generování cover fotek přes Claude API
- Hromadné publikování článků ze JSON souboru

## Struktura

```
modules/blog/
├── components/
│   ├── BlogPostCard.tsx     # karta článku v seznamu
│   └── BlogPostHero.tsx     # hero sekce na stránce článku
├── lib/
│   ├── blog.ts              # CRUD článků v Vercel KV (getBlogPosts, getBlogPost, saveBlogPost…)
│   └── blog-topics.ts       # předdefinované kategorie/témata článků
├── scripts/
│   ├── post-article.ts      # CLI: publikuje jeden článek (spustit: npx tsx scripts/post-article.ts)
│   ├── batch-post.ts        # CLI: hromadná publikace ze posts.json
│   ├── generate-cover.ts    # CLI: generuje cover fotku přes Claude API
│   ├── posts.json           # fronta článků k publikaci
│   └── posts.example.json   # příklad formátu posts.json
└── __tests__/
    ├── blog.test.ts         # unit testy pro blog.ts
    └── blog-route.test.ts   # integration testy pro API routes
```

## API Routes

| Route | Účel |
|-------|------|
| `GET /api/admin/blog` | Seznam článků (admin) |
| `POST /api/admin/blog` | Vytvoření článku |
| `PUT /api/admin/blog/[id]` | Update článku |
| `DELETE /api/admin/blog/[id]` | Smazání článku |

## Závislosti

**Vyžaduje (shared lib):**
- `@/lib/kv` — Vercel KV store (persistence článků)
- `@/lib/config` — siteUrl (sitemap, OG)
- `@/lib/cloudinary-utils` — typy pro cover fotky

**Importován z:**
- `app/[locale]/blog/` — public blog pages
- `app/api/admin/blog/` — API routes
- `app/sitemap.ts` — SEO sitemap
- `modules/admin/components/BlogEditor.tsx`

## Datový model článku (BlogPost)

```ts
{
  id: string           // slug
  title: string
  excerpt: string
  content: string      // Markdown
  coverImage: string   // Cloudinary URL
  publishedAt: string  // ISO date
  topic: string        // z blog-topics.ts
  locale: "cs" | "en"
}
```

## Publikační skripty

```bash
# Generovat cover pro článek
npx tsx modules/blog/scripts/generate-cover.ts <article-json>

# Publikovat jeden článek
npx tsx modules/blog/scripts/post-article.ts <article-json>

# Hromadná publikace (čte posts.json)
npx tsx modules/blog/scripts/batch-post.ts
```
