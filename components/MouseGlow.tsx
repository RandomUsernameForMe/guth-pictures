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
  { id: 1, homeXPct: 0.15, homeYPct: 0.25, size: 500, opacity: 4 },
  { id: 2, homeXPct: 0.78, homeYPct: 0.12, size: 420, opacity: 3 },
  { id: 3, homeXPct: 0.88, homeYPct: 0.68, size: 380, opacity: 4 },
  { id: 4, homeXPct: 0.22, homeYPct: 0.82, size: 450, opacity: 3 },
  { id: 5, homeXPct: 0.55, homeYPct: 0.48, size: 350, opacity: 2 },
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
      y: window.innerHeight * homeYPct,
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

  const rawX = useMotionValue(-1000);
  const rawY = useMotionValue(-1000);

  const x1 = useSpring(rawX, { damping: 25, stiffness: 150 });
  const y1 = useSpring(rawY, { damping: 25, stiffness: 150 });

  const x2 = useSpring(rawX, { damping: 45, stiffness: 80 });
  const y2 = useSpring(rawY, { damping: 45, stiffness: 80 });

  useEffect(() => {
    if (prefersReduced) return;
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReduced, rawX, rawY]);

  if (prefersReduced) return null;

  return (
    <>
      {/* Ambient fleeing glows — za vším obsahem */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {AMBIENT_GLOWS.map((g) => (
          <FleeingGlow key={g.id} {...g} mouseX={rawX} mouseY={rawY} />
        ))}
      </div>

      {/* Kurzor-following glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <motion.div
          style={{ x: x1, y: y1, translateX: "-50%", translateY: "-50%", willChange: "transform" }}
          className="absolute w-[600px] h-[600px]"
        >
          <div
            className="w-full h-full rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 7%, transparent) 0%, transparent 70%)" }}
          />
        </motion.div>
        <motion.div
          style={{ x: x2, y: y2, translateX: "calc(-50% + 80px)", translateY: "calc(-50% + 60px)", willChange: "transform" }}
          className="absolute w-[300px] h-[300px]"
        >
          <div
            className="w-full h-full rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 3%, transparent) 0%, transparent 70%)" }}
          />
        </motion.div>
      </div>
    </>
  );
}
