"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

export function ProposalFeedbackForm({
  slug,
  concepts,
}: {
  slug: string;
  concepts: { id: string; title: string }[];
}) {
  const t = useTranslations("brand-shoot");
  const [conceptId, setConceptId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`/api/proposal/${slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: conceptId ?? undefined, message }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="bsp-fb-success" role="alert" aria-live="polite">
        {t("feedbackSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bsp-fb">
      {concepts.length > 0 && (
        <div className="bsp-fb-pills" role="group" aria-label={t("feedbackPrompt")}>
          <span className="gp-label">{t("feedbackPrompt")}</span>
          <div>
            {concepts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConceptId(conceptId === c.id ? null : c.id)}
                className={`bsp-fb-pill${conceptId === c.id ? " is-active" : ""}`}
                aria-pressed={conceptId === c.id}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <label htmlFor="bsp-fb-message" className="gp-label">
        {t("feedbackLabel")}
      </label>
      <textarea
        id="bsp-fb-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
        maxLength={2000}
        placeholder={t("feedbackPlaceholder")}
        className="bsp-fb-text"
      />
      {status === "error" && (
        <p className="bsp-error" role="alert">
          {t("feedbackError")}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        className="bsp-ed-cta"
      >
        {status === "sending" ? t("feedbackSending") : t("feedbackSend")} →
      </button>
    </form>
  );
}
