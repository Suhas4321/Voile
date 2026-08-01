import { CheckCircle2, Wand2, Sparkles, ShieldCheck } from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { MODEL_PRESETS, type AnglePhoto } from '@/lib/data';

/* ============================================================
 * Step1ModelStudio — Right Panel Controls for Split-Screen Configurator
 * Preset Model Selection & Photo Guidelines (Upload relocated to left mirror).
 * ============================================================ */

interface Step1ModelStudioProps {
  angles: AnglePhoto[];
  setAngles: (next: AnglePhoto[]) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string | null) => void;
  onContinue: () => void;
}

export function Step1ModelStudio({
  angles,
  setAngles,
  selectedPresetId,
  setSelectedPresetId,
}: Step1ModelStudioProps) {
  function applyPreset(presetId: string) {
    const preset = MODEL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setAngles(angles.map((a) => ({ ...a, url: preset.angles.front })));
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Step 01 · Setup Model</SectionLabel>
          <h2 className="mt-1 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-white sm:text-3xl">
            Model Studio
          </h2>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-300">
            Select an editorial model preset or click the Virtual Mirror on the left to upload your custom photo.
          </p>
        </div>
        <GlowButton
          variant="gold"
          onClick={() => applyPreset(MODEL_PRESETS[0].id)}
          className="py-2 px-4 text-xs font-bold shrink-0"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Use Sample Model
        </GlowButton>
      </div>

      {/* Preset Models Selection */}
      <GlassPanel className="p-4 border-stone-800 bg-stone-900/90 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
          <Sparkles className="h-4 w-4" />
          Sample Studio Editorial Presets
        </div>
        <p className="text-xs text-stone-300 mb-3">
          Select one of our verified fashion models for instant zero-setup virtual try-on:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MODEL_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/15 text-white shadow-[0_0_16px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50'
                    : 'border-stone-800 bg-stone-950/70 text-stone-300 hover:border-stone-700 hover:bg-stone-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={p.angles.front}
                    alt={p.name}
                    className="h-11 w-11 shrink-0 rounded-lg object-cover object-top border border-stone-700 bg-stone-900"
                  />
                  <div className="min-w-0">
                    <div className="font-bold uppercase tracking-wider text-white truncate text-[11px]">
                      {p.name}
                    </div>
                    <div className="text-[9px] text-stone-400 truncate">
                      Full-body standing
                    </div>
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Guidelines */}
      <GlassPanel className="p-4 border-stone-800 bg-stone-900/90 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-2">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          Photo Guidelines for Best AI Drape
        </div>

        <ul className="space-y-2 text-xs text-stone-300">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span><strong className="text-white">Standing upright facing front</strong> — natural posture with legs visible down to feet or mid-thigh.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span><strong className="text-white">Plain background</strong> — simple wall or studio backdrop for precise silhouette extraction.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span><strong className="text-white">Clear lighting</strong> — unobstructed torso and shoulders for accurate fabric wrapping.</span>
          </li>
        </ul>
      </GlassPanel>
    </div>
  );
}
