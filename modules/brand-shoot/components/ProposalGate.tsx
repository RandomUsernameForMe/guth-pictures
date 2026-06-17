"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function ProposalGate({ slug, clientName }: { slug: string; clientName: string }) {
  const t = useTranslations("brand-shoot");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proposal/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) {
        setError(t("wrongPassword"));
        return;
      }
      if (res.status === 410) {
        setError(t("expiredTitle"));
        return;
      }
      if (!res.ok) {
        setError(t("serverError"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bsp-gate">
        <p className="gp-label">{t("gateLabel")}</p>
        <h1 className="gp-h2">{clientName}</h1>
        <p className="gp-body-md">{t("gatePrompt")}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          autoFocus
          required
          className="bsp-input"
        />
        {error && <p className="bsp-error">{error}</p>}
        <button type="submit" disabled={loading || !password} className="bsp-btn-primary">
          {loading ? "…" : t("gateSubmit")}
        </button>
      </form>
    </main>
  );
}
