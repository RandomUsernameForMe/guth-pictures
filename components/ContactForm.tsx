"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { contactEmail } from "@/lib/config";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("kontakt");
  return (
    <Suspense fallback={<p><a href={`mailto:${contactEmail}`} className="underline">{t("email")}: {contactEmail}</a></p>}>
      <ContactFormFields />
    </Suspense>
  );
}

function ContactFormFields() {
  const t = useTranslations("kontakt");
  const [status, setStatus] = useState<Status>("idle");
  const searchParams = useSearchParams();
  const packageName = searchParams.get("package");
  const serviceName = searchParams.get("service");
  const defaultMessage = packageName && serviceName
    ? t("packagePreset", { package: packageName, service: serviceName })
    : undefined;

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

  if (!process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID) {
    return <p className="text-[var(--color-text-muted)]">{t("notConfigured")}</p>;
  }

  if (status === "success") {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="p-4"
        style={{
          background: "var(--color-success-bg)",
          border: "1px solid var(--color-success-border)",
          color: "var(--color-success-fg)",
        }}
      >
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("name")}</label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("email")}</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("message")}</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          defaultValue={defaultMessage}
          placeholder={t("messagePlaceholder")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors resize-none"
        />
      </div>
      {status === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 text-sm"
          style={{
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            color: "var(--color-error-fg)",
          }}
        >
          {t.rich("error", {
            email: contactEmail,
            link: (chunks) => (
              <a href={`mailto:${contactEmail}`} className="underline hover:opacity-80 transition-opacity">
                {chunks}
              </a>
            ),
          })}
        </div>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] font-medium hover:opacity-85 transition-opacity disabled:opacity-50"
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
