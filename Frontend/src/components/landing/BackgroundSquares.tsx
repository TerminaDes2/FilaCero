"use client";

import React, { useEffect, useRef } from "react";

// Decorative background with rotated squares in two pastel colors.
// Colors: #FFD9D9 and #FFF9D9
// Usage: Place this component near the top of the page and ensure the parent has position: relative.

const COLORS = ["#FFD9D9", "#FFF9D9"] as const;

type SquareSpec = {
  size: number; // px
  rotate: number; // deg
  top: string; // e.g., '10%'
  left: string; // e.g., '20%'
  color: typeof COLORS[number];
  opacity?: number; // 0..1
  blur?: number; // px
};

const SQUARES: SquareSpec[] = [
  { size: 220, rotate: -8, top: "6%", left: "5%", color: COLORS[0], opacity: 0.9 },
  { size: 140, rotate: 15, top: "16%", left: "28%", color: COLORS[1], opacity: 0.85 },
  { size: 260, rotate: -18, top: "28%", left: "-3%", color: COLORS[1], opacity: 0.7 },
  { size: 180, rotate: 12, top: "34%", left: "60%", color: COLORS[0], opacity: 0.8 },
  { size: 120, rotate: -28, top: "48%", left: "82%", color: COLORS[1], opacity: 0.75 },
  { size: 200, rotate: 24, top: "62%", left: "12%", color: COLORS[0], opacity: 0.8 },
  { size: 160, rotate: -10, top: "72%", left: "42%", color: COLORS[1], opacity: 0.85 },
  { size: 240, rotate: 18, top: "84%", left: "70%", color: COLORS[0], opacity: 0.75 },
];

export function BackgroundSquares() {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // no parallax if reduced motion

    const handlePointer = (e: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      // target shift range ~ 18px
      const shiftX = (e.clientX / innerWidth - 0.5) * 18;
      const shiftY = (e.clientY / innerHeight - 0.5) * 18;
      target.current.x = shiftX;
      target.current.y = shiftY;
      if (!frameRef.current) raf();
    };

    const raf = () => {
      frameRef.current = requestAnimationFrame(() => {
        // springy interpolation
        current.current.x += (target.current.x - current.current.x) * 0.06;
        current.current.y += (target.current.y - current.current.y) * 0.06;
        if (layerRef.current) {
          layerRef.current.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`;
        }
        const dx = Math.abs(target.current.x - current.current.x);
        const dy = Math.abs(target.current.y - current.current.y);
        if (dx < 0.2 && dy < 0.2) {
          frameRef.current = null;
          return;
        }
        raf();
      });
    };

    window.addEventListener('pointermove', handlePointer);
    return () => {
      window.removeEventListener('pointermove', handlePointer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent)",
      }}
    >
      {/* grid background subtle */}
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.02) 1px, transparent 0)", backgroundSize: "16px 16px" }} />

      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        {SQUARES.map((sq, i) => {
          const duration = 24 + (i % 5) * 4; // stagger
            const delay = -(i * 2); // negative for distributed phase
          return (
            <div
              key={i}
              className="absolute rounded-md"
              style={{
                width: sq.size,
                height: sq.size,
                top: sq.top,
                left: sq.left,
                opacity: sq.opacity ?? 1,
                transform: `rotate(${sq.rotate}deg)`,
              }}
            >
              <div
                className="absolute inset-0 rounded-md bg-[var(--sq-color)] border border-black/5 dark:border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.07)] sq-float"
                style={{
                  ['--sq-color' as any]: sq.color,
                  animation: `sqFloat ${duration}s ease-in-out ${delay}s infinite`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BackgroundSquares;
