"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

const FLEE_THRESHOLD = 350;
const FLEE_REPULSION = 200;

const AMBIENT_GLOWS = [
  { id: 1, homeXPct: 0.12, homeYPct: 0.08, size: 520, opacity: 4 },
  { id: 2, homeXPct: 0.80, homeYPct: 0.14, size: 440, opacity: 3 },
  { id: 3, homeXPct: 0.90, homeYPct: 0.32, size: 380, opacity: 4 },
  { id: 4, homeXPct: 0.18, homeYPct: 0.45, size: 460, opacity: 3 },
  { id: 5, homeXPct: 0.60, homeYPct: 0.52, size: 350, opacity: 2 },
  { id: 6, homeXPct: 0.85, homeYPct: 0.68, size: 400, opacity: 3 },
  { id: 7, homeXPct: 0.25, homeYPct: 0.75, size: 480, opacity: 4 },
  { id: 8, homeXPct: 0.50, homeYPct: 0.90, size: 420, opacity: 3 },
];

type FleeProps = {
  homeXPct: number;
  homeYPct: number;
  size: number;
  opacity: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
};

function FleeingGlow({ homeXPct, homeYPct, size, opacity, mouseX, mouseY }: FleeProps) {
  const homeRef = useRef({ x: 0, y: 0, ready: false });

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, { damping: 35, stiffness: 45 });
  const springY = useSpring(targetY, { damping: 35, stiffness: 45 });

  useEffect(() => {
    homeRef.current = {
      x: window.innerWidth * homeXPct,
      y: document.documentElement.scrollHeight * homeYPct,
      ready: true,
    };
    targetX.set(homeRef.current.x);
    targetY.set(homeRef.current.y);
  }, [homeXPct, homeYPct, targetX, targetY]);

  useMotionValueEvent(mouseX, "change", (mx) => {
    if (!homeRef.current.ready) return;
    const { x: hx, y: hy } = homeRef.current;
    const my = mouseY.get();
    const dx = hx - mx;
    const dy = hy - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FLEE_THRESHOLD && dist > 0) {
      const factor = (1 - dist / FLEE_THRESHOLD) * FLEE_REPULSION;
      targetX.set(hx + (dx / dist) * factor);
      targetY.set(hy + (dy / dist) * factor);
    } else {
      targetX.set(hx);
      targetY.set(hy);
    }
  });

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        width: size,
        height: size,
        willChange: "transform",
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, var(--color-accent) ${opacity}%, transparent) 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}

export function MouseGlow() {
  const prefersReduced = useReducedMotion();

  // Mouse position in document coordinates (clientY + scrollY)
  const rawX = useMotionValue(-1000);
  const rawY = useMotionValue(-1000);

  useEffect(() => {
    if (prefersReduced) return;
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX + window.scrollX);
      rawY.set(e.clientY + window.scrollY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReduced, rawX, rawY]);

  if (prefersReduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {AMBIENT_GLOWS.map((g) => (
        <FleeingGlow key={g.id} {...g} mouseX={rawX} mouseY={rawY} />
      ))}
    </div>
  );
}
