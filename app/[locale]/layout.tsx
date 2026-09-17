import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl, ogImage } from "@/lib/config";
import { getThemeColors, buildThemeStyle } from "@/lib/theme";
import { getContent, getContactEmail } from "@/modules/admin/lib/content";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Mono is used only for small uppercase labels — one weight, no italic.
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: "%s | Guth Pictures", default: "Guth Pictures" },
  openGraph: {
    siteName: "Guth Pictures",
    images: [{ url: ogImage.url, width: ogImage.width, height: ogImage.height }],
  },
  twitter: { card: "summary_large_image" },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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

  // Enables static rendering — without it next-intl reads the locale from
  // request headers and every page under [locale] becomes dynamic.
  setRequestLocale(locale);

  const [messages, themeColors, content, email] = await Promise.all([
    getMessages({ locale }),
    getThemeColors(),
    getContent(locale),
    getContactEmail(),
  ]);
  const themeStyle = buildThemeStyle(themeColors);

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
    <html lang={locale} className="dark">
      <head>
        {/* Hero photos load from Cloudinary — warm the connection before the parser reaches them. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text)]`}>
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <div className="relative pt-16 min-h-screen flex flex-col">
            {children}
            <Footer title={content.home.title} subtitle={content.home.subtitle} email={email} />
          </div>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
