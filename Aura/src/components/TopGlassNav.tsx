import { useEffect, useState, type ReactNode } from 'react';
import { Sparkles, Sun, Heart, Zap } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlassPrimitives';

/* ============================================================
 * TopGlassNav — sticky glass header with brand identity,
 * central navigation pill, and right action group.
 * ============================================================ */

interface TopGlassNavProps {
  savedCount: number;
  onOpenLighting: () => void;
  onOpenSaved: () => void;
  onLaunch: () => void;
  activeNav: string;
  onNavChange: (id: string) => void;
  ambientToggle?: ReactNode;
  /** When Step 4 is active, nav shrinks to stay out of the full-bleed showcase */
  activeStep?: number;
}

const NAV_ITEMS = [
  { id: 'studio', label: 'Virtual Studio' },
  { id: 'lookbook', label: 'Lookbook & Presets' },
  { id: 'lighting', label: 'Studio Lighting' },
  { id: 'how', label: 'How AI Works' },
];

export function TopGlassNav({
  savedCount,
  onOpenLighting,
  onOpenSaved,
  onLaunch,
  activeNav,
  onNavChange,
  ambientToggle,
  activeStep,
}: TopGlassNavProps) {
  const isShowcase = activeStep === 4;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ease-out ${
        scrolled ? 'py-2.5' : 'py-4'
      } ${isShowcase ? 'opacity-80' : 'opacity-100'}`}
      style={isShowcase ? { transform: 'scaleY(0.6)', transformOrigin: 'top' } : undefined}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={`glass shimmer-sweep glass-trace flex items-center justify-between gap-3 px-4 py-3 sm:px-6 ${
            scrolled ? 'rounded-2xl' : 'rounded-3xl'
          }`}
        >
          {/* Brand identity — simplified VOILE luxury wordmark */}
          <button
            onClick={() => onNavChange('studio')}
            className="group relative flex shrink-0 items-center gap-2 py-1"
            title="VOILE Virtual Studio Home"
          >
            <span className="font-serif text-xl font-bold tracking-[0.25em] text-white transition-colors duration-300 group-hover:text-cyan-aura sm:text-2xl">
              VOILE
            </span>
            {/* Signature animated accent underline */}
            <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-75 bg-gradient-to-r from-cyan-aura via-cyan-400 to-gold-aura transition-transform duration-500 group-hover:scale-x-100 shadow-[0_0_10px_rgba(0,229,255,0.7)]" />
            <Sparkles className="h-4 w-4 text-cyan-aura animate-glow-pulse ml-0.5" />
          </button>

          {/* Central nav pill — hidden on small screens */}
          <div className="hidden items-center rounded-full border border-white/[0.1] bg-white/[0.03] p-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide-luxe uppercase transition-all duration-300 ${
                  activeNav === item.id
                    ? 'bg-white/[0.1] text-white shadow-[inset_0_0_12px_-4px_rgba(0,242,254,0.6)]'
                    : 'text-silver-muted hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right action group */}
          <div className="flex shrink-0 items-center gap-2">
            {ambientToggle}
            <button
              onClick={onOpenLighting}
              title="Studio Atmosphere"
              className="glass glass-hover hidden h-9 w-9 items-center justify-center rounded-full text-silver-muted hover:text-cyan-aura sm:flex"
            >
              <Sun className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenSaved}
              title="Saved Fits"
              className="glass glass-hover relative flex h-9 items-center gap-1.5 rounded-full px-3 text-silver-muted hover:text-white"
            >
              <Heart className="h-4 w-4" />
              <span className="text-xs font-semibold text-white">{savedCount}</span>
            </button>

            <GlowButton variant="outline" onClick={onLaunch} className="hidden sm:flex">
              <Zap className="h-4 w-4" />
              <span className="hidden md:inline">Launch Fitting Studio</span>
              <span className="md:hidden">Launch</span>
            </GlowButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
