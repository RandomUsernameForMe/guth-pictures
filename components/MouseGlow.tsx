"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

const FLEE_THRESHOLD = 500;
const FLEE_REPULSION = 360;

type GlowConfig = { id: number; homeXPct: number; homeYPct: number; size: number; opacity: number };

function generateGlows(count: number): GlowConfig[] {
  const sizes = [600, 680, 560, 720, 640, 590, 660, 610];
  const opacities = [5, 4, 6, 4, 5, 6, 4, 5];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    homeXPct: 0.05 + Math.random() * 0.90,
    homeYPct: 0.05 + Math.random() * 0.90,
    size: sizes[i % sizes.length],
    opacity: opacities[i % opacities.length],
  }));
}

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
  const springX = useSpring(targetX, { damping: 50, stiffness: 22 });
  const springY = useSpring(targetY, { damping: 50, stiffness: 22 });

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
  const [glows, setGlows] = useState<GlowConfig[]>([]);

  const rawX = useMotionValue(-9999);
  const rawY = useMotionValue(-9999);

  useEffect(() => {
    setGlows(generateGlows(8));
  }, []);

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
      {glows.map((g) => (
        <FleeingGlow key={g.id} {...g} mouseX={rawX} mouseY={rawY} />
      ))}
    </div>
  );
}
