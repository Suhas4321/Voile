import { type ReactNode, type CSSProperties } from 'react';
import { useMagnetic } from '@/lib/motion';

/* ============================================================
 * Shared liquid-glass design primitives for FitMirrors.
 * Chrome-only glass — never placed behind product imagery.
 * ============================================================ */

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  shimmer?: boolean;
  trace?: boolean;
  specular?: boolean;
  surface?: boolean;
  style?: CSSProperties;
}

export function GlassPanel({
  children,
  className = '',
  hover = false,
  shimmer = false,
  trace = false,
  specular = false,
  surface = false,
  style,
}: GlassPanelProps) {
  return (
    <div
      style={style}
      className={`${surface ? 'surface' : 'glass'} ${hover ? 'glass-hover' : ''} ${shimmer ? 'shimmer-sweep' : ''} ${trace ? 'glass-trace' : ''} ${specular ? 'specular' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- Iridescent gradient button ---------------- */

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'cyan' | 'gold' | 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  magnetic?: boolean;
}

export function GlowButton({
  children,
  onClick,
  variant = 'gold',
  className = '',
  disabled = false,
  type = 'button',
  title,
  magnetic = true,
}: GlowButtonProps) {
  const variants: Record<string, string> = {
    cyan:
      'text-stone-950 bg-gradient-to-r from-gold-accent via-amber-300 to-gold-aura shadow-[0_0_24px_-4px_rgba(212,175,55,0.6)] hover:shadow-[0_0_32px_-2px_rgba(232,196,104,0.85)]',
    gold:
      'text-stone-950 bg-gradient-to-r from-gold-accent via-amber-200 to-gold-aura shadow-[0_0_24px_-4px_rgba(232,196,104,0.6)] hover:shadow-[0_0_32px_-2px_rgba(232,196,104,0.85)]',
    ghost:
      'text-stone-100 bg-white/[0.06] border border-white/[0.14] hover:bg-white/[0.12] hover:border-gold-accent/40',
    outline:
      'text-stone-100 bg-stone-900/50 border border-gold-accent/40 hover:border-gold-accent/80 shadow-[inset_0_0_18px_-8px_rgba(212,175,55,0.4)] hover:shadow-[0_0_22px_-6px_rgba(232,196,104,0.6)]',
  };

  const mag = useMagnetic<HTMLButtonElement>(disabled ? 0 : 0.3);

  return (
    <button
      ref={mag.ref}
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={magnetic ? mag.onPointerMove : undefined}
      onPointerLeave={magnetic ? mag.onPointerLeave : undefined}
      className={`btn-glow shimmer-sweep glass-trace px-5 py-2.5 text-sm font-semibold tracking-wide-luxe uppercase ${
        variants[variant] || variants.gold
      } ${disabled ? 'opacity-40 cursor-not-allowed hover:scale-100 active:scale-100' : 'cursor-pointer'} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

/* ---------------- Circular progress ring ---------------- */

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 132,
  stroke = 9,
  label = 'Fit Precision',
  sublabel = 'Accuracy',
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8C468" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)',
            filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.55))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-3xl font-bold text-white">{value.toFixed(1)}%</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-luxe text-silver-muted">{sublabel}</span>
      </div>
      <span className="mt-2 text-[11px] uppercase tracking-wide-luxe text-silver-muted">{label}</span>
    </div>
  );
}

/* ---------------- Section heading helper ---------------- */

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span className={`text-[11px] uppercase tracking-luxe text-gold-accent ${className}`}>
      {children}
    </span>
  );
}
