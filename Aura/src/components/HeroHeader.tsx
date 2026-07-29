import { useMemo } from 'react';
import { Zap, Shirt, Layers, Sparkles, ArrowDown } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPrimitives';

/* ============================================================
 * HeroHeader — kinetic-type headline (char-by-char blur-in),
 * animated subheadline, and floating metrics bar with solid
 * surface backing (glass is chrome-only, never behind content).
 * ============================================================ */

const METRICS = [
  { icon: Sparkles, value: 'Instant', label: 'AI-Powered Fit Preview' },
  { icon: Layers, value: '99.4%', label: 'Drape Realism Score' },
  { icon: Shirt, value: '4K', label: 'Photorealistic Resolution' },
];

function KineticText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const chars = useMemo(() => text.split(''), [text]);
  return (
    <span className={className} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="kinetic-char"
          style={{ animationDelay: `${delay + i * 0.02}s` }}
          aria-hidden
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

export function HeroHeader() {
  function scrollToStudio() {
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-14 text-center sm:px-6 sm:pt-20">
      {/* Eyebrow */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 backdrop-blur-xl animate-fade-in-up">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-aura animate-glow-pulse" />
        <span className="text-[11px] uppercase tracking-luxe text-silver-muted">
          Generative Virtual Try-On · Atelier Edition
        </span>
      </div>

      {/* Kinetic headline */}
      <h1
        className="font-serif text-4xl font-bold uppercase leading-[1.08] tracking-wide-luxe text-white sm:text-6xl lg:text-7xl"
        style={{ textShadow: '0 0 40px rgba(0,229,255,0.18)' }}
      >
        <KineticText text="Haute Couture" delay={0.1} />
        <br />
        <span className="text-gradient-cyan">
          <KineticText text="Meets Generative AI" delay={0.5} />
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-silver-muted animate-fade-in-up animate-delay-200 sm:text-lg">
        Experience millimeter-precision virtual fitting. Upload body angles, drape luxury
        garments, and render high-fidelity photorealistic try-ons in seconds.
      </p>

      {/* Metrics bar — solid surface backing per §1.2 glass rule */}
      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3 animate-fade-in-up animate-delay-300">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <GlassPanel
              key={m.label}
              hover
              shimmer
              specular
              surface
              className="flex items-center justify-center gap-3 px-5 py-4"
            >
              <Icon className="h-5 w-5 shrink-0 text-cyan-aura" />
              <div className="text-left">
                <div className="text-lg font-bold text-white">{m.value}</div>
                <div className="text-[11px] uppercase tracking-wide-luxe text-silver-muted">
                  {m.label}
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {/* Primary CTA — prominent entry point into the fitting studio */}
      <button
        onClick={scrollToStudio}
        className="group relative mx-auto mt-12 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-aura via-cyan-400 to-gold-aura px-8 py-4 text-sm font-semibold uppercase tracking-wide-luxe text-obsidian shadow-[0_0_40px_-4px_rgba(0,229,255,0.4)] transition-all duration-500 hover:shadow-[0_0_55px_-4px_rgba(0,229,255,0.6)] hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up animate-delay-500"
      >
        <Sparkles className="h-4 w-4" />
        Launch Fitting Studio
        <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
      </button>
    </section>
  );
}
