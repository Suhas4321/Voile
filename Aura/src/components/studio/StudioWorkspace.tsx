import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Sparkles, UserCheck, Shirt, Cpu, ArrowLeft, CheckCircle2, Upload, Camera } from 'lucide-react';
import { GlassPanel, GlowButton } from '@/components/ui/GlassPrimitives';
import { SkeletonKeypoints } from '@/components/SkeletonKeypoints';

/* ============================================================
 * StudioWorkspace — High-End Split-Screen Configurator Shell
 * (Porsche / BMW Model Architecture).
 *
 * Left Column (~45-50%): Persistent Virtual Mirror (with full-body photo upload dropzone)
 * Right Column (~50-55%): Step Controls Panel (Internal Scroll)
 * Bottom: Pinned Action CTA Bar (Never drifts, locked to viewport)
 * ============================================================ */

export type StepId = 1 | 2 | 3 | 4;

interface StudioWorkspaceProps {
  activeStep: StepId;
  onStepChange: (step: StepId) => void;
  reachableSteps: StepId[];
  // Persistent Mirror Props
  modelImageUrl?: string | null;
  garmentImageUrl?: string | null;
  garmentName?: string;
  garmentBrand?: string;
  garmentPrice?: string | null;
  isFitting?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  onModelUpload?: (file: File) => void;
  children: ReactNode;
  fullBleedContent?: ReactNode;
}

export function StudioWorkspace({
  activeStep,
  onStepChange,
  reachableSteps: _reachableSteps,
  modelImageUrl,
  garmentImageUrl,
  garmentName = 'No garment selected',
  garmentBrand = 'FitLabs Studio',
  garmentPrice,
  isFitting = false,
  onBack,
  onContinue,
  canContinue = true,
  continueLabel,
  onModelUpload,
  children,
  fullBleedContent,
}: StudioWorkspaceProps) {
  const isFullBleed = activeStep === 4;
  const [scanPos, setScanPos] = useState(0);
  const mirrorFileRef = useRef<HTMLInputElement | null>(null);

  // Sweeping scan line animation for Step 3
  useEffect(() => {
    if (activeStep !== 3) return;
    const interval = setInterval(() => {
      setScanPos((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 40);
    return () => clearInterval(interval);
  }, [activeStep]);

  const defaultCtaLabel =
    activeStep === 1
      ? 'Continue to Wardrobe →'
      : activeStep === 2
        ? 'Continue to Neural Fitting ✨'
        : activeStep === 3
          ? 'Fitting in Progress…'
          : 'Complete';

  const defaultBackHandler = () => {
    if (onBack) return onBack();
    if (activeStep > 1) onStepChange((activeStep - 1) as StepId);
  };

  const defaultNextHandler = () => {
    if (onContinue) return onContinue();
    if (activeStep < 4 && canContinue) onStepChange((activeStep + 1) as StepId);
  };

  function handleMirrorFileChange(files: FileList | null) {
    if (files && files[0] && onModelUpload) {
      onModelUpload(files[0]);
    }
  }

  return (
    <div className="flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-stone-950 text-white">
      {/* ─── FULL BLEED SHOWCASE (STEP 4) ─── */}
      {isFullBleed ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {fullBleedContent}
        </div>
      ) : (
        /* ─── SPLIT-SCREEN CONFIGURATOR LAYOUT (STEPS 1, 2, 3) ─── */
        <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-4 py-3 sm:px-6 sm:py-4 flex flex-col lg:flex-row gap-5 sm:gap-6 overflow-hidden">
          
          {/* LEFT COLUMN: Persistent Virtual Mirror (~45% - 48% width) */}
          <div className="w-full lg:w-[46%] flex flex-col min-h-0 shrink-0">
            {/* Glassmorphic Ambient Frame Container */}
            <div className="relative flex flex-col justify-between h-full p-3 sm:p-4 border border-white/10 bg-stone-900/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl overflow-hidden rounded-2xl">
              
              {/* Hidden File Input for Direct Mirror Upload */}
              <input
                ref={mirrorFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleMirrorFileChange(e.target.files)}
              />

              {/* Header Status Bar */}
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
                    Persistent Virtual Mirror
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {activeStep === 1
                    ? 'Step 01 · Model Active'
                    : activeStep === 2
                      ? 'Step 02 · Wardrobe Selection'
                      : 'Step 03 · AI Drape Synthesis'}
                </span>
              </div>

              {/* 3:4 Aspect Ratio Mirror Frame */}
              <div
                onClick={() => mirrorFileRef.current?.click()}
                className="relative flex-1 min-h-0 w-full overflow-hidden rounded-xl bg-stone-950 border border-white/10 flex items-center justify-center group shadow-inner cursor-pointer"
              >
                {modelImageUrl ? (
                  <>
                    <img
                      src={modelImageUrl}
                      alt="Active Model Preview"
                      className="h-full w-full object-contain drop-shadow-md"
                    />

                    {/* Pose skeleton keypoint overlay on hover */}
                    <SkeletonKeypoints className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Interactive Hover / Click Direct Upload Button Overlay */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-950/60 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-full border border-amber-400/80 bg-amber-400/20 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-amber-400 backdrop-blur-md shadow-lg">
                        <Upload className="h-4 w-4" />
                        Click to Change Photo
                      </div>
                    </div>

                    {/* Laser scan animation line on Step 3 */}
                    {activeStep === 3 && (
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div
                          className="absolute left-0 right-0 h-0.5"
                          style={{
                            top: `${scanPos}%`,
                            background: 'linear-gradient(90deg, transparent, #FBBF24 50%, transparent)',
                            boxShadow:
                              '0 0 20px 3px rgba(251,191,36,0.9), 0 0 50px 8px rgba(251,191,36,0.4)',
                            transition: 'top 0.1s linear',
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-stone-300 space-y-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                      <Upload className="h-7 w-7 text-amber-400" />
                    </div>

                    <div>
                      <div className="text-sm font-extrabold uppercase tracking-wider text-white">
                        Upload your full-body photo
                      </div>
                      <div className="mt-1 text-xs text-stone-400">
                        High-resolution JPG, PNG, or WebP (up to 10MB)
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Camera className="h-3.5 w-3.5 text-amber-400" />
                      Single Full-Body Photo Required
                    </div>
                  </div>
                )}

                {/* HUD Corner Brackets */}
                {[
                  'left-2 top-2 border-l-2 border-t-2',
                  'right-2 top-2 border-r-2 border-t-2',
                  'left-2 bottom-2 border-l-2 border-b-2',
                  'right-2 bottom-2 border-r-2 border-b-2',
                ].map((c) => (
                  <span
                    key={c}
                    className={`pointer-events-none absolute h-4 w-4 rounded-[2px] border-amber-400/50 opacity-70 ${c}`}
                  />
                ))}

                {/* Live Model Badge */}
                {modelImageUrl && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-stone-950/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-200 backdrop-blur-md border border-stone-700 pointer-events-none">
                    <CheckCircle2 className="h-3 w-3 text-amber-400" />
                    Full-Body Pose Detected
                  </div>
                )}
              </div>

              {/* Persistent Selected Garment Overlay Pill (Lower Bar inside Mirror) */}
              <div className="mt-2.5 rounded-xl border border-stone-800 bg-stone-950/90 p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {garmentImageUrl ? (
                    <img
                      src={garmentImageUrl}
                      alt={garmentName}
                      className="h-10 w-10 shrink-0 rounded-lg border border-amber-400/30 bg-stone-900 object-contain p-1 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-800 bg-stone-900 text-stone-500">
                      <Shirt className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">
                      {garmentImageUrl ? garmentBrand : 'Garment Selection'}
                    </div>
                    <div className="truncate text-xs font-bold text-white leading-snug">
                      {garmentImageUrl ? garmentName : 'Select a garment in Step 2'}
                    </div>
                  </div>
                </div>

                {garmentPrice && (
                  <span className="shrink-0 text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                    {garmentPrice}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Step Controls Panel (~52% - 55% width) */}
          <div className="w-full lg:w-[54%] flex flex-col min-h-0 flex-1">
            <GlassPanel className="flex flex-col h-full p-4 sm:p-5 border-stone-800 bg-stone-900/80 shadow-2xl overflow-hidden rounded-2xl">
              {/* Internal vertical scroll container for controls */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {children}
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* ─── PINNED BOTTOM ACTION CTA BAR (ALWAYS LOCKED TO VIEWPORT BOTTOM) ─── */}
      {!isFullBleed && (
        <div className="flex-shrink-0 w-full border-t border-stone-800/90 bg-stone-950/95 backdrop-blur-xl px-4 py-3 sm:px-6 sm:py-3.5 z-40">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            
            {/* Back Button */}
            {activeStep > 1 ? (
              <button
                onClick={defaultBackHandler}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-300 hover:text-white transition-colors cursor-pointer px-3 py-2 rounded-xl hover:bg-stone-900 border border-transparent hover:border-stone-800"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-xs text-stone-500 font-medium">
                Step 01 of 03 · Model Setup
              </span>
            )}

            {/* Middle Quick Summary Badge */}
            <div className="hidden md:flex items-center gap-2 text-xs text-stone-300">
              <span className="font-semibold text-white">Active Step:</span>
              <span className="text-amber-400 font-bold">
                {activeStep === 1
                  ? '01. Select Model'
                  : activeStep === 2
                    ? '02. Curate Wardrobe'
                    : '03. Neural Fitting'}
              </span>
            </div>

            {/* Primary Action CTA */}
            <GlowButton
              variant="gold"
              onClick={defaultNextHandler}
              disabled={!canContinue || (activeStep === 3 && isFitting)}
              className="px-6 py-2.5 text-xs font-bold uppercase shadow-[0_0_20px_-4px_rgba(251,191,36,0.6)]"
            >
              {continueLabel || defaultCtaLabel}
            </GlowButton>
          </div>
        </div>
      )}
    </div>
  );
}
