"use client";

import React from "react";

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

      {SQUARES.map((sq, i) => (
        <div
          key={i}
          className="absolute rounded-md shadow-sm"
          style={{
            width: sq.size,
            height: sq.size,
            top: sq.top,
            left: sq.left,
            backgroundColor: sq.color,
            opacity: sq.opacity ?? 1,
            transform: `rotate(${sq.rotate}deg)`
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              boxShadow: "0 10px 25px rgba(0,0,0,0.07)",
              filter: sq.blur ? `blur(${sq.blur}px)` : undefined,
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default BackgroundSquares;
