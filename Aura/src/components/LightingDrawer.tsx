import { Sun, Check, X, RotateCw, Lock } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPrimitives';
import { LIGHTING_THEMES, type LightingPreset } from '@/lib/data';

/* ============================================================
 * LightingDrawer — slide-over that lets the user change the
 * background atmosphere / lighting preset in real time.
 * Supports auto-rotating between lighting themes every 7s
 * or freezing/locking a single selected preset.
 * Warm Gold Luxury aesthetic.
 * ============================================================ */

interface LightingDrawerProps {
  open: boolean;
  onClose: () => void;
  preset: LightingPreset;
  onPresetChange: (p: LightingPreset) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

const SWATCH: Record<LightingPreset, string> = {
  obsidian: 'linear-gradient(135deg, #0C0A09 0%, #1C1917 40%, #D4AF37 100%)',
  golden: 'linear-gradient(135deg, #b45309, #d4af37 55%, #e8c468)',
  neutral: 'linear-gradient(135deg, #0f172a, #64748b 55%, #e2e8f0)',
  cyberpunk: 'linear-gradient(135deg, #22d3ee, #8b5cf6 50%, #ec4899)',
};

export function LightingDrawer({
  open,
  onClose,
  preset,
  onPresetChange,
  autoRotate,
  onToggleAutoRotate,
}: LightingDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm transition-opacity duration-400 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col p-4 transition-transform duration-500 ease-out sm:p-6 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <GlassPanel className="flex h-full flex-col p-5 border-stone-800 bg-stone-900/90">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-gold-accent" />
              <h3 className="font-serif text-lg font-bold uppercase tracking-wide-luxe text-stone-100">
                Theme
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-800 text-stone-400 transition-colors hover:text-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-4 text-sm text-stone-400">
            Pick the page atmosphere. <strong className="text-stone-200">Black &amp; Gold</strong> is
            the classic charcoal look. Switch anytime, or auto-rotate every 7 seconds.
          </p>

          {/* 7-SECOND AUTO-ROTATE TOGGLE CARD */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                autoRotate ? 'bg-gold-accent/15 text-gold-accent' : 'bg-stone-800 text-stone-400'
              }`}>
                {autoRotate ? <RotateCw className="h-4 w-4 animate-spin-slow" /> : <Lock className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide-luxe text-stone-100">
                  7s Lighting Rotation
                </div>
                <div className="text-[11px] text-stone-400">
                  {autoRotate ? 'Auto-cycling every 7 seconds' : 'Single preset locked'}
                </div>
              </div>
            </div>

            <button
              onClick={onToggleAutoRotate}
              className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                autoRotate ? 'bg-gold-accent' : 'bg-stone-800'
              }`}
              title={autoRotate ? 'Lock current lighting' : 'Enable 7s auto-rotation'}
            >
              <span
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-stone-950 transition-transform duration-300 ${
                  autoRotate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* PRESET SELECTOR LIST */}
          <div className="space-y-3">
            {LIGHTING_THEMES.map((t) => {
              const active = preset === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onPresetChange(t.id);
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-300 ${
                    active
                      ? 'border-gold-accent/60 bg-gold-accent/[0.08] shadow-[0_0_22px_-6px_rgba(212,175,55,0.4)]'
                      : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                  }`}
                >
                  <span
                    className="h-14 w-14 shrink-0 rounded-xl border border-stone-700"
                    style={{ background: SWATCH[t.id] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide-luxe text-stone-100">
                        {t.label}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400">{t.description}</div>
                  </div>
                  {active && <Check className="h-5 w-5 text-gold-accent" />}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-5">
            <p className="text-center text-[11px] uppercase tracking-wide-luxe text-stone-400/80">
              Lighting affects background mood only — fit accuracy is preserved.
            </p>
          </div>
        </GlassPanel>
      </aside>
    </>
  );
}
