import { useEffect, useRef } from 'react';
import { type LightingPreset, LIGHTING_THEMES } from '@/lib/data';

/* ============================================================
 * ParticleField — a canvas layer of drifting luminous motes
 * that respond to the active lighting preset's accent colors.
 * Sits above the orbs but behind glass, adding depth.
 * ============================================================ */

interface ParticleFieldProps {
  preset: LightingPreset;
  density?: number;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  c: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return [0, 229, 255];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

export function ParticleField({ preset, density = 60 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const presetRef = useRef(preset);
  presetRef.current = preset;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let particles: P[] = [];

    const ACCENTS: Record<LightingPreset, string[]> = {
      obsidian: ['#D4AF37', '#E8C468', '#B45309'],
      golden: ['#E8C468', '#F59E0B', '#D4AF37'],
      neutral: ['#94A3B8', '#E2E8F0', '#64748B'],
      cyberpunk: ['#22D3EE', '#A78BFA', '#F472B6'],
    };

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      const count = Math.min(density, Math.floor((w * h) / 22000));
      const colors = ACCENTS[presetRef.current];
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.4,
        a: Math.random() * 0.5 + 0.1,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function tick() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        const [r, g, b] = hexToRgb(p.c);
        const flicker = 0.7 + Math.sin(Date.now() / 600 + p.x) * 0.3;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${p.a * flicker})`;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = p.c;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density, preset]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full opacity-60"
      aria-hidden
    />
  );
}
