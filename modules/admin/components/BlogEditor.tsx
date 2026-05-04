"use client";

import { useState, useEffect, useMemo } from "react";
import type { BlogPost } from "@/modules/blog/lib/blog";

type Locale = "cs" | "en";

const emptyLocale = () => ({ title: "", excerpt: "", content: "" });

const emptyForm = (): Omit<BlogPost, "id" | "publishedAt" | "updatedAt"> => ({
  slug: "",
  coverImage: "",
  published: false,
  cs: emptyLocale(),
  en: emptyLocale(),
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [locale, setLocale] = useState<Locale>("cs");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  function startNew() {
    setEditing(null);
    setForm(emptyForm());
    setStatus("idle");
  }

  function startEdit(post: BlogPost) {
    setEditing(post);
    setForm({
      slug: post.slug,
      coverImage: post.coverImage,
      published: post.published,
      cs: { ...post.cs },
      en: { ...post.en },
    });
    setStatus("idle");
  }

  function setLocaleField(field: keyof BlogPost["cs"], value: string) {
    setForm((f) => ({ ...f, [locale]: { ...f[locale], [field]: value } }));
  }

  function handleTitleChange(value: string) {
    if (!editing && locale === "cs") {
      // Auto-generate slug from CS title when creating new post
      setForm((f) => ({ ...f, [locale]: { ...f[locale], title: value }, slug: slugify(value) }));
    } else {
      setLocaleField("title", value);
    }
  }

  async function handleSave() {
    if (!form.cs.title && !form.en.title) return;
    setStatus("saving");
    const now = new Date().toISOString();
    const post: BlogPost = {
      id: editing?.id ?? crypto.randomUUID(),
      slug: form.slug || slugify(form.cs.title || form.en.title),
      coverImage: form.coverImage,
      published: form.published,
      publishedAt: editing?.publishedAt ?? now,
      updatedAt: now,
      cs: form.cs,
      en: form.en,
    };
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (!res.ok) throw new Error();
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === post.id);
        return idx >= 0 ? prev.map((p) => (p.id === post.id ? post : p)) : [...prev, post];
      });
      setEditing(post);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tento příspěvek?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editing?.id === id) {
        setEditing(null);
        setForm(emptyForm());
      }
    } catch {
      alert("Smazání se nezdařilo.");
    } finally {
      setDeleting(null);
    }
  }

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [posts]
  );

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Blog</h2>
        <button
          onClick={startNew}
          className="text-sm px-4 py-2 border border-white/20 rounded hover:border-white/50 transition-colors"
        >
          + Nový příspěvek
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Post list */}
        <div className="space-y-2">
          {sorted.length === 0 && (
            <p className="text-gray-500 text-sm">Zatím žádné příspěvky.</p>
          )}
          {sorted.map((post) => (
            <div
              key={post.id}
              className={`flex items-center justify-between px-4 py-3 border rounded cursor-pointer transition-colors ${
                editing?.id === post.id
                  ? "border-white/40 bg-white/5"
                  : "border-white/10 hover:border-white/25"
              }`}
              onClick={() => startEdit(post)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{post.cs.title || post.en.title || "(bez názvu)"}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(post.publishedAt).toLocaleDateString("cs-CZ")}
                  <span className={`ml-2 ${post.published ? "text-green-400" : "text-yellow-500"}`}>
                    {post.published ? "Publikováno" : "Draft"}
                  </span>
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                disabled={deleting === post.id}
                className="ml-3 text-xs text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
              >
                {deleting === post.id ? "…" : "Smazat"}
              </button>
            </div>
          ))}
        </div>

        {/* Editor form */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["cs", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1 text-sm border rounded transition-colors ${
                  locale === l ? "border-white text-white" : "border-white/20 text-gray-400 hover:border-white/40"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Název ({locale.toUpperCase()})</label>
            <input
              type="text"
              value={form[locale].title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
              placeholder="Název příspěvku"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40 font-mono"
              placeholder="url-prispevku"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Perex ({locale.toUpperCase()})</label>
            <textarea
              value={form[locale].excerpt}
              onChange={(e) => setLocaleField("excerpt", e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40 resize-none"
              placeholder="Krátký úvodní text"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Obsah — Markdown ({locale.toUpperCase()})</label>
            <textarea
              value={form[locale].content}
              onChange={(e) => setLocaleField("content", e.target.value)}
              rows={12}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40 resize-y font-mono"
              placeholder="Text v Markdownu…"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Cover obrázek (Cloudinary public ID)</label>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40 font-mono"
              placeholder="folder/image-name"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="accent-white w-4 h-4"
              />
              <span className="text-sm">Publikovat</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={status === "saving"}
              className="px-5 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {status === "saving" ? "Ukládám…" : editing ? "Uložit změny" : "Vytvořit příspěvek"}
            </button>
            {status === "saved" && <span className="text-sm text-green-400">Uloženo</span>}
            {status === "error" && <span className="text-sm text-red-400">Chyba při ukládání</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
