import { type ReactNode } from 'react';
import { useTilt, useMagnetic, useInView } from '@/lib/motion';

/* ============================================================
 * Motion wrapper components built on the motion toolkit.
 * Compose tilt / magnetic / reveal effects with glass styling.
 * ============================================================ */

export function TiltCard({
  children,
  className = '',
  maxDeg = 6,
  scale = 1.03,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  maxDeg?: number;
  scale?: number;
  onClick?: () => void;
}) {
  const { ref, onPointerMove, onPointerLeave } = useTilt<HTMLDivElement>(maxDeg, scale);
  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}

export function MagneticButton({
  children,
  onClick,
  className = '',
  strength = 0.35,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
  title?: string;
}) {
  const { ref, onPointerMove, onPointerLeave } = useMagnetic<HTMLButtonElement>(strength);
  return (
    <button
      ref={ref}
      title={title}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={className}
    >
      {children}
    </button>
  );
}

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
        filter: inView ? 'blur(0px)' : 'blur(10px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s, filter 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
