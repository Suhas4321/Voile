import { useEffect, useState } from 'react';
import { Sun, Heart, X, Camera, Shirt, Wand2, Eye, Check } from 'lucide-react';
import { FitLabsLogo } from '@/components/FitLabsLogo';
import type { StepId } from '@/components/studio/StudioWorkspace';

/* ============================================================
 * TopGlassNav
 * - Landing: marketing anchors + Launch Studio
 * - Studio: true app shell — logo · slim steps · tools · exit
 * ============================================================ */

export type AppView = 'landing' | 'studio';

const STUDIO_STEPS: {
  id: StepId;
  label: string;
  short: string;
  icon: typeof Camera;
}[] = [
  { id: 1, label: 'Model', short: '01', icon: Camera },
  { id: 2, label: 'Wardrobe', short: '02', icon: Shirt },
  { id: 3, label: 'Fitting', short: '03', icon: Wand2 },
  { id: 4, label: 'Result', short: '04', icon: Eye },
];

interface TopGlassNavProps {
  view: AppView;
  savedCount: number;
  onOpenLighting: () => void;
  onOpenSaved: () => void;
  activeNav: string;
  onNavChange: (id: string) => void;
  onLaunchStudio: () => void;
  onBackToLanding: () => void;
  activeStep?: StepId;
  reachableSteps?: StepId[];
  onStepChange?: (step: StepId) => void;
}

const LANDING_NAV = [
  { id: 'how', label: 'How it works' },
  { id: 'benefits', label: 'Benefits' },
];

export function TopGlassNav({
  view,
  savedCount,
  onOpenLighting,
  onOpenSaved,
  activeNav,
  onNavChange,
  onLaunchStudio,
  onBackToLanding,
  activeStep = 1,
  reachableSteps = [1],
  onStepChange,
}: TopGlassNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- Studio: fixed app shell (no double chrome) ---------- */
  if (view === 'studio') {
    return (
      <header className="sticky top-0 z-50 border-b border-stone-800/80 bg-obsidian-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-5">
          <FitLabsLogo size="sm" onClick={onBackToLanding} className="shrink-0" />

          {/* Slim step progress — primary studio navigation */}
          <nav
            className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:gap-1"
            aria-label="Studio steps"
          >
            {STUDIO_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isDone = activeStep > step.id;
              const reachable = reachableSteps.includes(step.id);
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => reachable && onStepChange?.(step.id)}
                    title={step.label}
                    className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide-luxe transition-all sm:px-3 sm:text-[11px] ${
                      isActive
                        ? 'bg-gold-accent/15 text-gold-accent ring-1 ring-gold-accent/40'
                        : isDone
                          ? 'text-stone-300 hover:bg-stone-800/80'
                          : 'text-stone-500'
                    } ${reachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        isActive
                          ? 'bg-gold-accent text-stone-950'
                          : isDone
                            ? 'bg-gold-accent/20 text-gold-accent'
                            : 'bg-stone-800 text-stone-500'
                      }`}
                    >
                      {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <span className="hidden md:inline">{step.label}</span>
                    <span className="md:hidden">{step.short}</span>
                  </button>
                  {i < STUDIO_STEPS.length - 1 && (
                    <span
                      className={`mx-0.5 hidden h-px w-4 sm:block sm:w-6 ${
                        activeStep > step.id ? 'bg-gold-accent/40' : 'bg-stone-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onOpenLighting}
              title="Change theme"
              className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-gold-accent cursor-pointer sm:px-3"
            >
              <Sun className="h-4 w-4" />
              <span className="hidden text-[10px] font-semibold uppercase tracking-wide-luxe sm:inline">
                Theme
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenSaved}
              title="Saved fits"
              className="relative flex h-9 items-center gap-1 rounded-full px-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-100 cursor-pointer"
            >
              <Heart className="h-4 w-4" />
              <span className="text-xs font-semibold text-stone-200">{savedCount}</span>
            </button>
            <button
              type="button"
              onClick={onBackToLanding}
              title="Exit studio"
              className="ml-0.5 flex h-9 items-center gap-1 rounded-full border border-stone-700 px-2.5 text-[10px] font-semibold uppercase tracking-wide-luxe text-stone-400 transition-colors hover:border-gold-accent/40 hover:text-gold-accent sm:px-3 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  /* ---------- Landing marketing nav ---------- */
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
        scrolled ? 'py-2.5' : 'py-4'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={`glass shimmer-sweep flex items-center justify-between gap-3 px-4 py-3 sm:px-6 ${
            scrolled ? 'rounded-2xl' : 'rounded-3xl'
          }`}
        >
          <FitLabsLogo onClick={() => onNavChange('home')} />

          <div className="hidden items-center gap-1 md:flex">
            {LANDING_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavChange(item.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wide-luxe transition-colors cursor-pointer ${
                  activeNav === item.id
                    ? 'text-gold-accent'
                    : 'text-stone-400 hover:text-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onOpenLighting}
              title="Change theme"
              className="glass glass-hover flex h-9 items-center gap-1.5 rounded-full px-3 text-stone-400 transition-colors hover:text-gold-accent cursor-pointer"
            >
              <Sun className="h-4 w-4" />
              <span className="hidden text-[10px] font-semibold uppercase tracking-wide-luxe sm:inline">
                Theme
              </span>
            </button>
            <button
              type="button"
              onClick={onLaunchStudio}
              className="btn-glow shrink-0 rounded-full bg-gradient-to-r from-gold-accent via-amber-300 to-gold-aura px-4 py-2 text-[11px] font-bold uppercase tracking-wide-luxe text-stone-950 sm:px-5 sm:text-xs cursor-pointer"
            >
              Launch Studio
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
