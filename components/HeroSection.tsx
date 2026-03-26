"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

type Props = {
  title: string;
  subtitle: string;
  ctaPortfolio: string;
  ctaContact: string;
  heroPublicId?: string;
};

export function HeroSection({ title, subtitle, ctaPortfolio, ctaContact, heroPublicId }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="hero"
      className="relative -mt-16 min-h-screen flex items-end pb-20 px-6 overflow-hidden"
    >
      {/* Background — fixed, stays behind nav the whole time */}
      {heroPublicId ? (
        <div className="fixed inset-0 -z-10">
          <Image
            src={cloudinaryUrl(heroPublicId, "w_1920,c_fill,q_auto,f_auto")}
            alt=""
            fill
            priority
            placeholder="blur"
            blurDataURL={blurUrl(heroPublicId)}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ) : (
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-zinc-900 via-black to-zinc-950" />
      )}

      {/* Overlay — top gradient for nav readability */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--hero-scrim-top) 0%, transparent 100%)" }}
      />
      {/* Overlay — bottom gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{ background: "linear-gradient(to top, var(--color-bg) 0%, transparent 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none text-[var(--color-text)]"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="mt-6 text-xl text-[var(--color-text-muted)] max-w-xl"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mt-10 flex gap-4 flex-wrap"
        >
          <a
            href="#kontakt"
            className="px-8 py-4 bg-[var(--color-text)] text-[var(--color-bg)] font-medium rounded-xl hover:opacity-90 transition-opacity duration-200"
          >
            {ctaPortfolio}
          </a>
          <Link
            href="/portfolio"
            className="px-8 py-4 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text)] rounded-xl hover:bg-[var(--color-bg-overlay)] transition-all duration-200"
          >
            {ctaContact}
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={scrolled ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="animate-bounce w-6 h-10 border-2 border-[var(--color-text)]/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-[var(--color-text)]/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
