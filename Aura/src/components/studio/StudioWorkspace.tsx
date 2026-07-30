import { type ReactNode } from 'react';

/* ============================================================
 * StudioWorkspace — content shell only.
 * Step navigation lives in TopGlassNav (app bar) to avoid
 * double chrome and sticky collision.
 * ============================================================ */

export type StepId = 1 | 2 | 3 | 4;

interface StudioWorkspaceProps {
  activeStep: StepId;
  onStepChange: (step: StepId) => void;
  reachableSteps: StepId[];
  children: ReactNode;
  fullBleedContent?: ReactNode;
}

export function StudioWorkspace({
  activeStep,
  children,
  fullBleedContent,
}: StudioWorkspaceProps) {
  const isFullBleed = activeStep === 4;

  return (
    <section
      id="studio-workspace"
      className={
        isFullBleed
          ? 'min-h-[calc(100vh-4rem)]'
          : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8'
      }
    >
      {!isFullBleed && (
        /* overflow-visible so sticky/fixed step CTAs can pin to the viewport */
        <div className="glass overflow-visible rounded-2xl border border-stone-800 bg-stone-900/75 p-4 sm:rounded-3xl sm:p-6 lg:p-8">
          {children}
        </div>
      )}

      {isFullBleed && fullBleedContent}
    </section>
  );
}
