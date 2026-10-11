"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./FormParts";

export function ContactEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  useEffect(() => {
    fetch("/api/admin/email")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (d) setEmail(d.email ?? ""); })
      .catch(() => {
        // fetch failed, state stays at empty default
      });
  }, [router]);

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("saving");
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEmailStatus("ok");
        setTimeout(() => setEmailStatus("idle"), 3000);
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Kontaktní email</h2>
      <form onSubmit={handleEmailSave} className="space-y-4 max-w-2xl">
        <div className="border border-white/10 p-6 space-y-4">
          <Field
            label="Email (zobrazuje se v patičce a slouží pro kontaktní formulář)"
            value={email}
            onChange={setEmail}
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={emailStatus === "saving"}
            className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {emailStatus === "saving" ? "Ukládám…" : "Uložit email"}
          </button>
          {emailStatus === "ok" && <span className="text-green-400 text-sm">Uloženo</span>}
          {emailStatus === "error" && <span className="text-red-400 text-sm">Chyba při ukládání</span>}
        </div>
      </form>
    </div>
  );
}
