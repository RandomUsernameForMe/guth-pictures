import type { Metadata } from "next";
import { Bodoni_Moda, DM_Sans, DM_Mono, Manrope, Oswald } from "next/font/google";
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

const editorialSerif = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  variable: "--font-editorial-serif",
  display: "swap",
});

const editorialSans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-editorial-sans",
  display: "swap",
});

const editorialCondensed = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-editorial-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: "%s | Guth Pictures", default: "Guth Pictures" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
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

  const cs = locale === "cs";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: "Guth Pictures",
    description: cs
      ? "Profesionální fotograf v Praze: kreativní portréty, svatby, eventy a larpy"
      : "Professional photographer in Prague: creative portraits, weddings, events and larps",
    url: siteUrl,
    email,
    image: `${siteUrl}${ogImage.url}`,
    address: { "@type": "PostalAddress", addressLocality: "Praha", addressCountry: "CZ" },
    sameAs: ["https://www.instagram.com/guth_pictures/"],
    areaServed: cs ? "Česká republika" : "Czech Republic",
    founder: { "@type": "Person", name: "Tomáš Guth Jarkovský" },
    knowsAbout: cs
      ? ["portrétní fotografie", "svatební fotografie", "eventová fotografie", "larpová fotografie"]
      : ["portrait photography", "wedding photography", "event photography", "larp photography"],
    makesOffer: (cs
      ? ["Portrétní focení", "Svatební fotografie", "Focení eventů a larpů"]
      : ["Portrait sessions", "Wedding photography", "Event & larp photography"]
    ).map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  };

  return (
    <html lang={locale} className="dark">
      <head>
        {/* Hero photos load from Cloudinary — warm the connection before the parser reaches them. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} ${editorialSerif.variable} ${editorialSans.variable} ${editorialCondensed.variable} font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text)]`}>
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
