"use client";

import { useState, useEffect, useRef } from "react";

function saveErrorMessage(status: number) {
  if (status === 410) return "Galerie vypršela, výběr nelze uložit";
  if (status === 401) return "Přihlášení vypršelo, načtěte stránku znovu";
  return "Výběr se nepodařilo uložit";
}

function sameSelection(sent: string[], current: Set<string>) {
  return sent.length === current.size && sent.every((id) => current.has(id));
}

export function useGallerySelection(slug: string) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  // Load existing selection
  useEffect(() => {
    fetch(`/api/gallery/${slug}/selection`)
      .then((r) => r.json())
      .then((data) => {
        if (data.selection?.favorites) {
          setFavorites(new Set(data.selection.favorites));
        }
      })
      .catch(() => {});
  }, [slug]);

  function toggle(lrId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(lrId)) next.delete(lrId);
      else next.add(lrId);
      return next;
    });
    setSaved(false);
  }

  async function save() {
    const sent = Array.from(favorites);
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/gallery/${slug}/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: sent }),
      });
      if (!res.ok) {
        setError(saveErrorMessage(res.status));
        return;
      }
      if (sameSelection(sent, favoritesRef.current)) setSaved(true);
    } catch {
      setError("Chyba sítě, zkuste to znovu");
    } finally {
      setSaving(false);
    }
  }

  return { favorites, toggle, save, saving, saved, error };
}
