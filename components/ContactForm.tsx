"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("kontakt");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch(`https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID}`, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      setStatus("success");
      form.reset();
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-950/30 border border-green-900/50 text-green-400 p-4">
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 font-medium mb-1">{t("name")}</label>
        <input
          type="text"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-300 font-medium mb-1">{t("email")}</label>
        <input
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-300 font-medium mb-1">{t("message")}</label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder={t("messagePlaceholder")}
          className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-colors resize-none"
        />
      </div>
      {status === "error" && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 text-sm">
          {t("error")}
        </div>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
