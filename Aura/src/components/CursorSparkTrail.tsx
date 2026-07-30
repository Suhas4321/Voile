import { useEffect, useRef } from 'react';

/* ============================================================
 * CursorSparkTrail — gaseous spark particles following the cursor.
 *
 * Renders a full-viewport <canvas> overlay (fixed, pointer-events: none)
 * that spawns 2-4 small glowing particles on each cursor movement.
 * Each particle fades and shrinks over ~600ms. Particle physics live
 * in a ref/array outside React's render cycle — no React state updates
 * per particle, only rAF.
 *
 * Performance guards:
 *  - Max 150 active particles; oldest dropped if exceeded
 *  - Spawn throttled by cursor movement distance (>4px since last spawn)
 *  - Respects prefers-reduced-motion: disables effect entirely
 *  - pointer-events: none — never intercepts clicks/hovers
 * ============================================================ */

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;        // radius
  life: number;     // 0..1 countdown
  decay: number;     // life decrement per frame
  color: string;     // rgba base
}

const PALETTE = [
  // Warm gold & amber luxury family
  { r: 232, g: 196, b: 104 },
  { r: 212, g: 175, b: 55 },
  { r: 245, g: 158, b: 11 },
  { r: 250, g: 250, b: 249 },
];

const MAX_PARTICLES = 150;
const SPAWN_DISTANCE_THRESHOLD = 4; // px — skip spawn if cursor hasn't moved this far
const PARTICLE_LIFETIME_MS = 650;   // ~600-800ms
const PARTICLES_PER_MOVE = 3;       // 2-4 spawned

export function CursorSparkTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const particles: Spark[] = [];
    let lastX = -999;
    let lastY = -999;
    let raf = 0;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function onMouseMove(e: MouseEvent) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Throttle: only spawn if cursor moved enough
      if (dist < SPAWN_DISTANCE_THRESHOLD) return;
      lastX = e.clientX;
      lastY = e.clientY;

      // Spawn 2-4 particles with random velocity/spread
      const count = PARTICLES_PER_MOVE + (Math.random() > 0.5 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.2 + 0.3;
        const spark: Spark = {
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.3, // slight upward bias
          r: Math.random() * 2.5 + 1,
          life: 1,
          // ~60fps → 650ms = ~39 frames → decay ≈ 0.026
          decay: 1 / (PARTICLE_LIFETIME_MS / 16.67),
          color: `${color.r},${color.g},${color.b}`,
        };
        particles.push(spark);
      }

      // Cap at MAX_PARTICLES — drop oldest
      while (particles.length > MAX_PARTICLES) {
        particles.shift();
      }
    }

    function tick() {
      ctx!.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        // Slight gravity
        p.vy += 0.015;

        const alpha = p.life * 0.7;
        const radius = p.r * p.life;

        // Radial gradient glow
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3);
        grad.addColorStop(0, `rgba(${p.color},${alpha})`);
        grad.addColorStop(0.4, `rgba(${p.color},${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${p.color},0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius * 3, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Core bright dot
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color},${alpha * 1.2})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden
    />
  );
}
