"use client";

import { useState, useEffect, useRef } from "react";

function saveErrorMessage(status: number) {
  if (status === 409) return "Výběr je potvrzen a zamknut";
  if (status === 400) return "Překročen limit výběru";
  if (status === 410) return "Galerie vypršela, výběr nelze uložit";
  if (status === 401) return "Přihlášení vypršelo, načtěte stránku znovu";
  return "Výběr se nepodařilo uložit";
}

function sameSelection(sent: string[], current: Set<string>) {
  return sent.length === current.size && sent.every((id) => current.has(id));
}

export function useGallerySelection(slug: string, maxSelection: number | null = null) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;
  const [note, setNoteState] = useState("");
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const noteRef = useRef(note);
  noteRef.current = note;

  // Load existing selection
  useEffect(() => {
    fetch(`/api/gallery/${slug}/selection`)
      .then((r) => r.json())
      .then((data) => {
        if (data.selection?.favorites) {
          setFavorites(new Set(data.selection.favorites));
        }
        if (typeof data.selection?.note === "string") {
          setNoteState(data.selection.note);
        }
        if (typeof data.selection?.confirmedAt === "string") {
          setConfirmedAt(data.selection.confirmedAt);
        }
      })
      .catch(() => {});
  }, [slug]);

  function toggle(lrId: string) {
    if (confirmedAt) return;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(lrId)) next.delete(lrId);
      else if (maxSelection === null || next.size < maxSelection) next.add(lrId);
      return next;
    });
    setSaved(false);
  }

  function setNote(value: string) {
    if (confirmedAt) return;
    setNoteState(value);
    setSaved(false);
  }

  async function save(): Promise<boolean> {
    const sent = Array.from(favorites);
    const sentNote = note;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/gallery/${slug}/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: sent, note: sentNote }),
      });
      if (!res.ok) {
        setError(saveErrorMessage(res.status));
        return false;
      }
      if (sentNote === noteRef.current && sameSelection(sent, favoritesRef.current)) setSaved(true);
      return true;
    } catch {
      setError("Chyba sítě, zkuste to znovu");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function confirmSelection() {
    if (!(await save())) return;
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/gallery/${slug}/selection/confirm`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 400 ? "Nejdřív vyberte a uložte alespoň jednu fotku" : saveErrorMessage(res.status));
        return;
      }
      setConfirmedAt(data.confirmedAt);
    } catch {
      setError("Chyba sítě, zkuste to znovu");
    } finally {
      setConfirming(false);
    }
  }

  return { favorites, note, setNote, toggle, save, saving, saved, error, confirmedAt, confirming, confirmSelection };
}
