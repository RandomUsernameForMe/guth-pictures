"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-11 h-11" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-11 h-11 flex items-center justify-center rounded-full
                 text-[var(--color-text-muted)] hover:text-[var(--color-text)]
                 hover:bg-[var(--nav-active-bg)] transition-colors duration-200"
      aria-label={isDark ? "Přepnout na světlý mód" : "Přepnout na tmavý mód"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute"
          >
            <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: -30 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute"
          >
            <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
