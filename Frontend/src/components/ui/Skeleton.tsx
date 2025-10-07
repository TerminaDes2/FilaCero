"use client";
import React from 'react';

// POS-styled skeletons with soft ring and shimmer, matching the sand/card aesthetic
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`pos-skeleton ${className}`}>
      <style jsx global>{`
        @keyframes pos-skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .pos-skeleton {
          position: relative;
          overflow: hidden;
          border-radius: 0.75rem; /* ~rounded-xl */
          box-shadow: inset 0 0 0 1px var(--pos-border-soft);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.58));
        }
        .pos-skeleton::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: pos-skeleton-shimmer 1.4s ease-in-out infinite;
        }
        @media (prefers-color-scheme: dark) {
          .pos-skeleton {
            background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
          }
          .pos-skeleton::after {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
          }
        }
      `}</style>
    </div>
  );
}

export function TextSkeleton({ width = 'w-24', className = '' }: { width?: string; className?: string }) {
  return <Skeleton className={`${width} h-3 ${className}`} />;
}

export function CircleSkeleton({ size = 'w-10 h-10', className = '' }: { size?: string; className?: string }) {
  return <div className={`pos-skeleton rounded-full ${size} ${className}`} />;
}
