"use client";

import { useState } from "react";

function authErrorMessage(status: number) {
  if (status === 401) return "Špatné heslo";
  if (status === 410) return "Galerie vypršela";
  if (status === 429) return "Příliš mnoho pokusů, zkuste to později";
  return "Chyba serveru";
}

export function PasswordGate({
  slug,
  onSuccess,
}: {
  slug: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/gallery/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(authErrorMessage(res.status));
        return;
      }
      onSuccess();
    } catch {
      setError("Chyba sítě");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Vaše galerie</h1>
        <p className="text-sm text-gray-400">Zadejte heslo, které jste obdrželi od fotografa.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Heslo"
          autoFocus
          required
          className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm focus:outline-none focus:border-white"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          {loading ? "…" : "Zobrazit galerii"}
        </button>
      </form>
    </div>
  );
}
