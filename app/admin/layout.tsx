import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Admin — Guth Pictures",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${geist.variable} font-sans antialiased bg-zinc-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
