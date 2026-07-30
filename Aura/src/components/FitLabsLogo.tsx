/* ============================================================
 * FitLabs brand mark — monogram lab icon + wordmark
 * Gold-on-charcoal, works at sm / md / lg.
 * ============================================================ */

interface FitLabsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function FitLabsLogo({ className = '', size = 'md', onClick }: FitLabsLogoProps) {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  const uid = size; // unique gradient ids per size instance

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex shrink-0 items-center gap-2.5 py-0.5 text-left select-none transition-all duration-300 cursor-pointer ${className}`}
      title="FitLabs — AI Virtual Fitting Studio"
    >
      {/* Icon — geometric F + lab facet */}
      <div className={`relative flex shrink-0 items-center justify-center ${iconSizes[size]}`}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-gold-aura/40 via-amber-500/20 to-gold-accent/30 opacity-40 blur-md transition-opacity duration-500 group-hover:opacity-70" />
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-full w-full drop-shadow-[0_0_10px_rgba(212,175,55,0.35)] transition-transform duration-500 group-hover:scale-105"
          aria-hidden
        >
          {/* Rounded square plate */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="10"
            fill="rgba(12, 10, 9, 0.95)"
            stroke={`url(#fl-border-${uid})`}
            strokeWidth="1.5"
          />
          {/* Abstract lab flask / F monogram */}
          <path
            d="M14 11h12M20 11v18M14 29h12"
            stroke={`url(#fl-stroke-${uid})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 18.5h8.5c2.2 0 3.5 1.2 3.5 3s-1.3 3-3.5 3H14"
            stroke={`url(#fl-stroke-${uid})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Micro spark — AI / precision */}
          <circle cx="29" cy="12" r="1.6" fill="#E8C468" className="animate-glow-pulse" />
          <defs>
            <linearGradient id={`fl-border-${uid}`} x1="2" y1="2" x2="38" y2="38">
              <stop stopColor="#E8C468" />
              <stop offset="0.55" stopColor="#D4AF37" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id={`fl-stroke-${uid}`} x1="12" y1="10" x2="30" y2="30">
              <stop stopColor="#FAFAF9" />
              <stop offset="0.45" stopColor="#E8C468" />
              <stop offset="1" stopColor="#D4AF37" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div
          className={`flex items-center font-sans font-extrabold uppercase leading-none tracking-[0.12em] text-stone-100 ${textSizes[size]}`}
        >
          <span>FIT</span>
          <span className="ml-1 bg-gradient-to-r from-gold-accent via-amber-200 to-gold-aura bg-clip-text font-bold text-transparent">
            LABS
          </span>
        </div>
        <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors duration-300 group-hover:text-gold-accent">
          AI Fitting Studio
        </span>
      </div>

      <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-50 bg-gradient-to-r from-gold-accent via-amber-400 to-gold-aura shadow-[0_0_8px_rgba(212,175,55,0.5)] transition-transform duration-500 group-hover:scale-x-100" />
    </button>
  );
}

/** @deprecated Use FitLabsLogo — kept so old imports do not break mid-refactor */
export { FitLabsLogo as FitMirrorsLogo };
