import { Sparkles } from 'lucide-react';

interface FitMirrorsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function FitMirrorsLogo({ className = '', size = 'md', onClick }: FitMirrorsLogoProps) {
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex shrink-0 items-center gap-2 py-0.5 text-left select-none transition-all duration-300 ${className}`}
      title="FitMirrors — AI Virtual Fitting Studio"
    >
      {/* ── Geometric Reflection Mirror SVG Icon ── */}
      <div className={`relative flex shrink-0 items-center justify-center ${iconSizes[size]}`}>
        {/* Glow halo behind icon */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-gold-aura via-amber-500 to-amber-200 opacity-25 blur-sm transition-opacity duration-500 group-hover:opacity-60" />
        
        {/* Mirror Frame SVG */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-full w-full drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-500 group-hover:scale-105"
        >
          {/* Back mirror layer (depth perspective) */}
          <rect
            x="14"
            y="6"
            width="20"
            height="28"
            rx="5"
            stroke="url(#mirror-gradient-back)"
            strokeWidth="1.8"
            fill="rgba(28, 25, 23, 0.7)"
          />
          {/* Front mirror layer (overlapping mirror plane) */}
          <rect
            x="6"
            y="10"
            width="20"
            height="28"
            rx="5"
            stroke="url(#mirror-gradient-front)"
            strokeWidth="2"
            fill="rgba(12, 10, 9, 0.9)"
          />
          {/* Glass sheen highlight line */}
          <line
            x1="10"
            y1="14"
            x2="22"
            y2="34"
            stroke="#FAFAF9"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          
          <defs>
            <linearGradient id="mirror-gradient-front" x1="6" y1="10" x2="26" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8C468" />
              <stop offset="0.5" stopColor="#D4AF37" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="mirror-gradient-back" x1="14" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAFAF9" stopOpacity="0.8" />
              <stop offset="1" stopColor="#D4AF37" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Sparkle on Mirror Corner */}
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold-accent animate-glow-pulse" />
      </div>

      {/* ── Brand Wordmark ── */}
      <div className="flex flex-col">
        <div className={`font-sans font-extrabold tracking-[0.14em] uppercase text-stone-100 ${textSizes[size]} flex items-center leading-none`}>
          <span>FIT</span>
          <span className="bg-gradient-to-r from-gold-accent via-amber-200 to-gold-aura bg-clip-text text-transparent ml-1 font-bold">
            MIRRORS
          </span>
        </div>
        <span className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-stone-400 mt-0.5 group-hover:text-gold-accent transition-colors duration-300">
          AI Fitting Studio
        </span>
      </div>

      {/* Signature gold underline */}
      <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-50 bg-gradient-to-r from-gold-accent via-amber-400 to-gold-aura transition-transform duration-500 group-hover:scale-x-100 shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
    </button>
  );
}
