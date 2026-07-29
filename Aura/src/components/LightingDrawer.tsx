import { Sun, Check, X, RotateCw, Lock } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPrimitives';
import { LIGHTING_THEMES, type LightingPreset } from '@/lib/data';

/* ============================================================
 * LightingDrawer — slide-over that lets the user change the
 * background atmosphere / lighting preset in real time.
 * Supports auto-rotating between the 3 lighting themes every 7s
 * or freezing/locking a single selected preset.
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
  neutral: 'linear-gradient(135deg, #1a1d28, #2a2f3e)',
  golden: 'linear-gradient(135deg, #b8732a, #e8c468 60%, #f6e27a)',
  cyberpunk: 'linear-gradient(135deg, #00e5ff, #8b3fe0 55%, #ff00aa)',
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
        className={`fixed inset-0 z-50 bg-obsidian/60 backdrop-blur-sm transition-opacity duration-400 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col p-4 transition-transform duration-500 ease-out sm:p-6 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <GlassPanel className="flex h-full flex-col p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-gold-aura" />
              <h3 className="font-serif text-lg font-bold uppercase tracking-wide-luxe text-white">
                Studio Lighting
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-silver-muted transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-4 text-sm text-silver-muted">
            Change the studio atmosphere. Switch between lighting themes manually or let them auto-rotate every 7 seconds.
          </p>

          {/* 7-SECOND AUTO-ROTATE TOGGLE CARD */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/14 bg-white/[0.04] p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                autoRotate ? 'bg-cyan-aura/15 text-cyan-aura' : 'bg-white/10 text-silver-muted'
              }`}>
                {autoRotate ? <RotateCw className="h-4 w-4 animate-spin-slow" /> : <Lock className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide-luxe text-white">
                  7s Lighting Rotation
                </div>
                <div className="text-[11px] text-silver-muted">
                  {autoRotate ? 'Auto-cycling every 7 seconds' : 'Single preset locked'}
                </div>
              </div>
            </div>

            <button
              onClick={onToggleAutoRotate}
              className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                autoRotate ? 'bg-cyan-aura' : 'bg-white/20'
              }`}
              title={autoRotate ? 'Lock current lighting' : 'Enable 7s auto-rotation'}
            >
              <span
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-obsidian transition-transform duration-300 ${
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
                      ? 'border-cyan-aura/60 bg-cyan-aura/[0.07] shadow-[0_0_22px_-6px_rgba(0,242,254,0.7)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                  }`}
                >
                  <span
                    className="h-14 w-14 shrink-0 rounded-xl border border-white/10"
                    style={{ background: SWATCH[t.id] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide-luxe text-white">
                        {t.label}
                      </span>
                    </div>
                    <div className="text-xs text-silver-muted">{t.description}</div>
                  </div>
                  {active && <Check className="h-5 w-5 text-cyan-aura" />}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-5">
            <p className="text-center text-[11px] uppercase tracking-wide-luxe text-silver-muted/70">
              Lighting affects background mood only — fit accuracy is preserved.
            </p>
          </div>
        </GlassPanel>
      </aside>
    </>
  );
}
