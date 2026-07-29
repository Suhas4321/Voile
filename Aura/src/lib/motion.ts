import { useEffect, useRef, useState, type RefObject } from 'react';

/* ============================================================
 * Motion toolkit — lightweight spring/tilt/magnetic/reveal
 * hooks implemented with rAF + CSS. No external deps.
 * Tilt capped at 6° (luxury, not gimmicky). Magnetic within
 * 48px threshold (starting value — tune visually, not spec-exact).
 * Respects prefers-reduced-motion.
 * ============================================================ */

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------------- 3D parallax tilt toward cursor (max 6°) ---------------- */
export function useTilt<T extends HTMLElement>(maxDeg = 6, scale = 1.03) {
  const ref = useRef<T>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    if (REDUCED_MOTION) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-py * maxDeg}deg) rotateY(${px * maxDeg}deg) scale(${scale})`;
    el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  return { ref, onPointerMove, onPointerLeave } as {
    ref: RefObject<T>;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
  };
}

/* ---------------- Magnetic cursor attraction (48px threshold) ---------------- */
export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const active = useRef(false);

  function loop() {
    if (!active.current) return;
    current.current.x += (target.current.x - current.current.x) * 0.18;
    current.current.y += (target.current.y - current.current.y) * 0.18;
    const el = ref.current;
    if (el) el.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
    if (Math.abs(target.current.x - current.current.x) > 0.1 || Math.abs(target.current.y - current.current.y) > 0.1) {
      raf.current = requestAnimationFrame(loop);
    } else {
      active.current = false;
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (REDUCED_MOTION) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Only attract within threshold radius — 48px is a starting value to tune
    // visually, not a spec-exact number.
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 48) {
      target.current = { x: 0, y: 0 };
    } else {
      target.current = { x: dx * strength, y: dy * strength };
    }
    if (!active.current) {
      active.current = true;
      raf.current = requestAnimationFrame(loop);
    }
  };

  const onPointerLeave = () => {
    target.current = { x: 0, y: 0 };
    if (!active.current) {
      active.current = true;
      raf.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { ref, onPointerMove, onPointerLeave } as {
    ref: RefObject<T>;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
  };
}

/* ---------------- Scroll-triggered blur-in reveal ---------------- */
export function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView } as { ref: RefObject<T>; inView: boolean };
}
