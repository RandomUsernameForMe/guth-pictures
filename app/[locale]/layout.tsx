import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://guthpictures.cz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: "%s | Guth Pictures", default: "Guth Pictures" },
  alternates: {
    languages: { cs: "/cs", en: "/en" },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "cs" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Guth Pictures",
    description: locale === "cs"
      ? "Profesionální fotograf Praha — portréty, svatby, larpy"
      : "Professional photographer Prague — portraits, weddings, larps",
    address: { "@type": "PostalAddress", addressLocality: "Praha", addressCountry: "CZ" },
    url: siteUrl,
  };

  return (
    <html lang={locale}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${geist.variable} font-sans antialiased bg-black text-white`}>
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <div className="pt-16 min-h-screen flex flex-col">
            {children}
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
