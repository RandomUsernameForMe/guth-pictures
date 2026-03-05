import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.kontakt" });
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description") } };
}

export default function KontaktPage() {
  const t = useTranslations("kontakt");

  return (
    <main className="max-w-xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-gray-400 mb-10">{t("subtitle")}</p>
      <ContactForm />
    </main>
  );
}
