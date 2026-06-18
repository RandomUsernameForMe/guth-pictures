"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { GlowField } from "./GlowField";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  glow?: boolean;
};

export function AnimatedSection({ children, className, delay = 0, glow = false }: Props) {
  return (
    <div className={`${className ?? ""}${glow ? " relative isolate overflow-hidden" : ""}`}>
      {glow && <GlowField />}
      <motion.div
        className={glow ? "relative z-10" : undefined}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}
