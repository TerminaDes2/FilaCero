"use client";
import { useEffect, useRef } from "react";

interface RevealProps {
  as?: any; // simplificado para evitar complejidad de tipo
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function Reveal({ as: Tag = 'div', className = '', children, delay = 0 }: RevealProps) {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
