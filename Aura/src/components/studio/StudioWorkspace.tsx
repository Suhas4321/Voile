import { type ReactNode } from 'react';
import { Camera, Shirt, Wand2, Eye, Check } from 'lucide-react';

/* ============================================================
 * StudioWorkspace — outer container for the 4-step pipeline
 * with step progress indicators.
 * Step 4 (Runway Showcase) renders OUTSIDE the glass wrapper
 * to achieve a true full-bleed viewport-edge layout.
 * Warm Gold Luxury aesthetic.
 * ============================================================ */

export type StepId = 1 | 2 | 3 | 4;

interface StudioWorkspaceProps {
  activeStep: StepId;
  onStepChange: (step: StepId) => void;
  reachableSteps: StepId[];
  /** Steps 1-3 content — rendered inside the glass wrapper */
  children: ReactNode;
  /** Step 4 content — rendered outside the glass wrapper for full-bleed */
  fullBleedContent?: ReactNode;
}

const STEPS: { id: StepId; label: string; sub: string; icon: typeof Camera }[] = [
  { id: 1, label: 'Model Studio', sub: 'Body Photo Manager', icon: Camera },
  { id: 2, label: 'Wardrobe Closet', sub: 'Garment Selection', icon: Shirt },
  { id: 3, label: 'Neural Fitting', sub: 'AI Synthesis', icon: Wand2 },
  { id: 4, label: 'Runway Showcase', sub: 'Result Viewer', icon: Eye },
];

export function StudioWorkspace({
  activeStep,
  onStepChange,
  reachableSteps,
  children,
  fullBleedContent,
}: StudioWorkspaceProps) {
  const isFullBleed = activeStep === 4;

  return (
    <section id="studio" className={isFullBleed ? 'pt-16 sm:pt-24' : 'mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24'}>
      {/* Step progress indicators */}
      <div className={`mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center ${isFullBleed ? 'mx-auto max-w-7xl px-4 sm:px-6' : ''}`}>
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isDone = activeStep > step.id;
          const reachable = reachableSteps.includes(step.id);
          return (
            <div key={step.id} className="flex flex-1 items-center">
              <button
                onClick={() => reachable && onStepChange(step.id)}
                disabled={!reachable}
                className={`group flex flex-1 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-500 sm:px-4 ${
                  isActive
                    ? 'border-gold-accent/60 bg-gold-accent/15 shadow-[0_0_28px_-8px_rgba(212,175,55,0.6)]'
                    : isDone
                      ? 'border-stone-800 bg-stone-900/60'
                      : 'border-stone-800/40 bg-stone-900/20'
                } ${reachable ? 'cursor-pointer hover:border-stone-700' : 'cursor-not-allowed opacity-45'}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                    isActive
                      ? 'bg-gradient-to-br from-gold-accent to-amber-500 text-stone-950 shadow-[0_0_18px_-2px_rgba(212,175,55,0.8)]'
                      : isDone
                        ? 'bg-gold-accent/20 text-gold-accent'
                        : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-xs font-semibold uppercase tracking-wide-luxe ${
                      isActive ? 'text-stone-100' : isDone ? 'text-stone-300' : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="hidden truncate text-[10px] text-stone-400 sm:block">
                    {step.sub}
                  </div>
                </div>
                <span className="hidden text-sm font-bold text-stone-600 sm:block">
                  0{step.id}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 hidden h-px w-6 shrink-0 transition-colors duration-500 sm:block ${
                    activeStep > step.id ? 'bg-gold-accent/50' : 'bg-stone-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Workspace body — glass-wrapped for Steps 1-3 */}
      {!isFullBleed && (
        <div className="glass shimmer-sweep glass-trace specular overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8 border-stone-800 bg-stone-900/80">
          {children}
        </div>
      )}

      {/* Full-bleed body — Step 4 renders here, outside any glass/padding */}
      {isFullBleed && fullBleedContent}
    </section>
  );
}
