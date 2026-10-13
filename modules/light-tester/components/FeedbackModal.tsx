"use client";

import { useState, useEffect } from "react";

const FORMSPREE_URL = `https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_LT_FORM_ID}`;

type FeedbackType = "bug" | "navrh" | "jine";

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<FeedbackType>("navrh");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setStatus("sending");
    const typeLabels: Record<FeedbackType, string> = { bug: "Bug", navrh: "Návrh", jine: "Jiné" };
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ type: typeLabels[type], message: text }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className={`lt-feedback-overlay${visible ? " lt-feedback-overlay--in" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="lt-feedback-modal" role="dialog" aria-modal="true" aria-label="Feedback">
        <div className="lt-feedback-header">
          <span className="lt-feedback-title">Feedback</span>
          <button className="lt-feedback-close" onClick={close} aria-label="Zavřít">×</button>
        </div>

        {status === "sent" ? (
          <>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 20px" }}>
              Díky za feedback, pomůže mi Light Tester zlepšovat.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="lt-btn lt-btn-primary" onClick={close}>Zavřít</button>
            </div>
          </>
        ) : (
          <>
            <div className="lt-feedback-types">
              {([["navrh", "💡 Návrh"], ["bug", "🐛 Bug"], ["jine", "💬 Jiné"]] as [FeedbackType, string][]).map(([id, label]) => (
                <button
                  key={id}
                  className={`lt-feedback-type${type === id ? " lt-feedback-type--active" : ""}`}
                  onClick={() => setType(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              className="lt-feedback-textarea"
              placeholder={type === "bug" ? "Co se stalo? Jak to reprodukovat?" : type === "navrh" ? "Co by šlo zlepšit nebo přidat?" : "Napiš cokoliv…"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="lt-feedback-footer">
              <span className="lt-feedback-status">
                {status === "error" && "Odeslání selhalo, zkus to znovu."}
              </span>
              <button className="lt-btn lt-btn-ghost" onClick={close}>Zrušit</button>
              <button
                className="lt-btn lt-btn-primary"
                disabled={!text.trim() || status === "sending"}
                onClick={submit}
              >
                {status === "sending" ? "Odesílám…" : "Odeslat"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
