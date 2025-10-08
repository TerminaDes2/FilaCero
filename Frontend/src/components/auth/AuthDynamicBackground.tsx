"use client";
import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  pathIndex: number;
  t: number; // 0..1 progress along path
  speed: number; // progress delta per frame
  phase: number; // 0 created,1 preparing,2 ready,3 collected
  size: number;
  offset: number; // phase drift
}

interface PathDef { c: [number,number,number,number,number,number,number,number]; length: number; }

const PHASE_COLORS = [
  'rgba(247,201,120,0.55)',      // created (amber soft)
  'rgba(213,93,123,0.60)',       // preparing (brand)
  'rgba(76,193,173,0.65)',       // ready (mint)
  'rgba(76,193,173,0.0)'         // collected (fade out)
];

export const AuthDynamicBackground: React.FC<{ showAmbientStats?: boolean }> = ({ showAmbientStats }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paths, setPaths] = useState<PathDef[]>([]);
  const [reduced, setReduced] = useState(false);

  // Detect reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Generate bezier paths (cubic) within viewport coordinates (0..1 normalized) -> we map to canvas size later
  useEffect(() => {
    function genPath(): PathDef {
      const sx = Math.random()*0.2 + 0.05;
      const sy = Math.random()*0.8 + 0.1;
      const ex = Math.random()*0.2 + 0.75;
      const ey = Math.random()*0.8 + 0.1;
      const cx1 = Math.random()*0.4 + 0.2;
      const cy1 = Math.random()*0.8 + 0.1;
      const cx2 = Math.random()*0.4 + 0.4;
      const cy2 = Math.random()*0.8 + 0.1;
      return { c: [sx,sy,cx1,cy1,cx2,cy2,ex,ey], length: 1 };
    }
    const arr: PathDef[] = Array.from({length:3}, genPath);
    setPaths(arr);
  }, []);

  // Particle engine
  useEffect(() => {
    if(!canvasRef.current || paths.length === 0) return;
    const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if(!ctx) return;
  // From here ctx is definitively non-null; helper to satisfy TS
  const draw = (fn: (c: CanvasRenderingContext2D) => void) => fn(ctx);

    const DPR = window.devicePixelRatio || 1;
    const particles: Particle[] = [];
    const COUNT = reduced ? 12 : 38;

    function resize() {
      draw(c => {
        canvas.width = canvas.clientWidth * DPR;
        canvas.height = canvas.clientHeight * DPR;
        c.setTransform(1,0,0,1,0,0); // reset before scaling
        c.scale(DPR,DPR);
      });
    }
    resize();
    window.addEventListener('resize', resize);

    function bezierPoint([sx,sy,cx1,cy1,cx2,cy2,ex,ey]: PathDef['c'], t: number) {
      const u = 1-t;
      const x = u*u*u*sx + 3*u*u*t*cx1 + 3*u*t*t*cx2 + t*t*t*ex;
      const y = u*u*u*sy + 3*u*u*t*cy1 + 3*u*t*t*cy2 + t*t*t*ey;
      return {x,y};
    }

    for(let i=0;i<COUNT;i++) {
      particles.push({
        pathIndex: Math.floor(Math.random()*paths.length),
        t: Math.random(),
        speed: (0.0008 + Math.random()*0.0016) * (reduced?0.4:1),
        phase: Math.floor(Math.random()*3),
        size: 2 + Math.random()*3.5,
        offset: Math.random()
      });
    }

    let running = true;
    let last = performance.now();

    function step(now: number){
      if(!running) return;
      const dt = now - last; last = now;
      const w = canvas.clientWidth; const h = canvas.clientHeight;
      draw(c => {
        c.clearRect(0,0,w,h);
        // Draw faint paths
        c.save();
        c.lineWidth = 1.2;
        c.globalAlpha = 0.18;
        paths.forEach(p => {
          const [sx,sy,cx1,cy1,cx2,cy2,ex,ey] = p.c;
          c.beginPath();
          c.moveTo(sx*w, sy*h);
          c.bezierCurveTo(cx1*w,cy1*h,cx2*w,cy2*h,ex*w,ey*h);
          const grad = c.createLinearGradient(sx*w,sy*h,ex*w,ey*h);
          grad.addColorStop(0,'#D55D7B');
          grad.addColorStop(1,'#4CC1AD');
          c.strokeStyle = grad;
          c.stroke();
        });
        c.restore();
      });

      draw(c => {
        particles.forEach(p => {
        p.t += p.speed * dt; // dt in ms, speeds tuned accordingly
        if(p.t > 1) {
          p.t = 0;
          p.phase = 0; // restart cycle
        }
        // Phase advancement
        const phaseProgress = p.t + p.offset*0.2;
        if(phaseProgress > 0.75) p.phase = 3; else if(phaseProgress > 0.5) p.phase = 2; else if(phaseProgress > 0.25) p.phase = 1; else p.phase = 0;

        const def = paths[p.pathIndex];
        const {x,y} = bezierPoint(def.c, p.t);
        const px = x*w; const py = y*h;
        const color = PHASE_COLORS[p.phase];
          c.beginPath();
          c.fillStyle = color;
          c.shadowColor = color.replace(/0\.[0-9]+\)/,'0.35)');
          c.shadowBlur = 12;
          c.arc(px,py,p.size,0,Math.PI*2);
          c.fill();
        });
      });

      if(!reduced) requestAnimationFrame(step);
    }
    if(!reduced) requestAnimationFrame(step); else step(performance.now());

    const visHandler = () => { if(document.hidden){ running=false; } else { if(!reduced){ running=true; last=performance.now(); requestAnimationFrame(step);} } };
    document.addEventListener('visibilitychange', visHandler);
    return () => { running=false; document.removeEventListener('visibilitychange', visHandler); window.removeEventListener('resize', resize); };
  }, [paths, reduced]);

  // Parallax + halo intensity
  useEffect(() => {
    const el = wrapperRef.current; if(!el) return;
    const handler = (e: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX/innerWidth - 0.5);
      const y = (e.clientY/innerHeight - 0.5);
      el.style.setProperty('--halo-x', (50 + x*8)+'%');
      el.style.setProperty('--halo-y', (50 + y*6)+'%');
      el.style.setProperty('--parallax', (x*10)+'px');
    };
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  // Ghost tickets
  const [tickets, setTickets] = useState<{id:number; x:number; y:number; rot:number; life:number; created:number;}[]>([]);
  useEffect(() => {
    if(reduced) return; // skip
    let id = 0;
    const spawn = () => {
      setTickets(t => {
        const now = Date.now();
        const filtered = t.filter(tt => now - tt.created < tt.life);
        if(filtered.length > 1) return filtered; // keep max 2
        filtered.push({ id: id++, x: Math.random()*70 + 15, y: Math.random()*70 + 15, rot: (Math.random()*6 -3), life: 6000, created: now });
        return filtered;
      });
    };
    const int = setInterval(spawn, 3200);
    return () => clearInterval(int);
  }, [reduced]);

  return (
    <div ref={wrapperRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base gradient & subtle texture */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(213,93,123,0.18),transparent_65%),radial-gradient(circle_at_75%_70%,rgba(76,193,173,0.18),transparent_60%),linear-gradient(120deg,#ffffff,#fffaf7,#f4fffb)]" />
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage:'linear-gradient(rgba(0,0,0,0.12) 1px,transparent 0),linear-gradient(90deg,rgba(0,0,0,0.12) 1px,transparent 0)', backgroundSize:'90px 90px' }} />

      {/* Canvas particles + paths */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Ghost tickets */}
      <div className="absolute inset-0">
        {tickets.map(t => {
          const age = Date.now() - t.created;
          const p = age / t.life; // 0..1
          const scale = 0.92 + 0.08*Math.min(1,p*2);
          const opacity = p < 0.8 ? 0.28 : 0.28 * (1 - (p-0.8)/0.2);
          return (
            <span key={t.id} style={{ left:t.x+'%', top:t.y+'%', transform:`translate(-50%, -50%) rotate(${t.rot}deg) scale(${scale})` }} className="absolute">
              <span style={{opacity}} className="block w-28 h-10 rounded-md bg-white/60 backdrop-blur-sm shadow-sm ring-1 ring-white/50" />
            </span>
          );
        })}
      </div>

      {/* Halo spotlight */}
  <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at var(--halo-x,50%) var(--halo-y,50%), rgba(255,255,255,0.0), rgba(255,255,255,0.55))' }} />

      {/* Peripheral ambient stats (optional) */}
      {showAmbientStats && !reduced && (
        <div className="absolute top-6 right-8 hidden md:flex flex-col gap-2 text-[10px] font-medium tracking-wide text-gray-600">
          <div className="px-2 py-1 rounded bg-white/60 backdrop-blur-sm shadow border border-white/50 animate-pulse">Pedidos en cola: <span className="text-brand-600">4</span></div>
          <div className="px-2 py-1 rounded bg-white/60 backdrop-blur-sm shadow border border-white/50">Tiempo medio prep: 6m</div>
        </div>
      )}

      {/* Subtle noise layer */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay" style={{ backgroundImage:'radial-gradient(rgba(0,0,0,0.18) 1px, transparent 0)', backgroundSize:'26px 26px' }} />
    </div>
  );
};
