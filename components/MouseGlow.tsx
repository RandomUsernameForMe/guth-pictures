"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export function MouseGlow() {
  const prefersReduced = useReducedMotion();

  const rawX = useMotionValue(-1000);
  const rawY = useMotionValue(-1000);

  const x1 = useSpring(rawX, { damping: 25, stiffness: 150 });
  const y1 = useSpring(rawY, { damping: 25, stiffness: 150 });

  const x2 = useSpring(rawX, { damping: 45, stiffness: 80 });
  const y2 = useSpring(rawY, { damping: 45, stiffness: 80 });

  const initialized = useRef(false);

  useEffect(() => {
    if (prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      if (!initialized.current) initialized.current = true;
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReduced, rawX, rawY]);

  if (prefersReduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Primární — rychlý, větší */}
      <motion.div
        style={{
          x: x1,
          y: y1,
          translateX: "-50%",
          translateY: "-50%",
          willChange: "transform",
        }}
        className="absolute w-[600px] h-[600px] rounded-full"
      >
        <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 70%)" }} />
      </motion.div>

      {/* Sekundární — zpožděný, menší */}
      <motion.div
        style={{
          x: x2,
          y: y2,
          translateX: "calc(-50% + 80px)",
          translateY: "calc(-50% + 60px)",
          willChange: "transform",
        }}
        className="absolute w-[300px] h-[300px] rounded-full"
      >
        <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 70%)" }} />
      </motion.div>
    </div>
  );
}
