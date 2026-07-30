import { useMemo } from 'react';
import { Sparkles, Shirt, Layers, ArrowDown } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPrimitives';

/* ============================================================
 * HeroHeader — Warm Golden Hour Luxury Edition
 * Kinetic-type headline, animated subheadline, and floating
 * metrics bar with warm stone surface backing.
 * ============================================================ */

const METRICS = [
  { icon: Sparkles, value: 'Instant', label: 'AI-Powered Fit Preview' },
  { icon: Layers, value: '99.4%', label: 'Drape Realism Score' },
  { icon: Shirt, value: '4K', label: 'Photorealistic Resolution' },
];

function KineticText({
  text,
  className,
  delay = 0,
  /** Solid gold line — avoids bg-clip-text which hides nested kinetic chars */
  gold = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  gold?: boolean;
}) {
  const chars = useMemo(() => text.split(''), [text]);
  return (
    <span className={className} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className={`kinetic-char ${gold ? 'text-gold-accent' : ''}`}
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
  function scrollToHow() {
    const el = document.getElementById('how');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-12 text-center sm:px-6 sm:pt-16">
      {/* Eyebrow */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-accent/30 bg-stone-900/80 px-4 py-1.5 backdrop-blur-xl animate-fade-in-up">
        <span className="h-1.5 w-1.5 rounded-full bg-gold-accent animate-glow-pulse" />
        <span className="text-[11px] uppercase tracking-luxe text-stone-300">
          Photorealistic Virtual Try-On · FitMirrors AI
        </span>
      </div>

      {/* Kinetic headline — clear pre-purchase virtual try-on promise */}
      <h1
        className="font-serif text-4xl font-bold uppercase leading-[1.08] tracking-wide-luxe text-stone-100 sm:text-6xl lg:text-7xl"
        style={{ textShadow: '0 0 40px rgba(212,175,55,0.2)' }}
      >
        <KineticText text="Try It On." delay={0.1} />
        <br />
        <KineticText text="Then Decide." delay={0.45} gold />
      </h1>

      {/* Subheadline */}
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-400 animate-fade-in-up animate-delay-200 sm:text-lg">
        Virtually try on clothes before you buy. Upload your photo, drape real garments, and preview
        how they fit and look — so you decide with confidence.
      </p>

      {/* Metrics bar */}
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
              className="flex items-center justify-center gap-3 px-5 py-4 border-stone-800 bg-stone-900/80"
            >
              <Icon className="h-5 w-5 shrink-0 text-gold-accent" />
              <div className="text-left">
                <div className="text-lg font-bold text-stone-100">{m.value}</div>
                <div className="text-[11px] uppercase tracking-wide-luxe text-stone-400">
                  {m.label}
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {/* Secondary action only — primary "Launch Fitting Studio" stays in sticky nav */}
      <button
        onClick={scrollToHow}
        className="group relative mx-auto mt-10 flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide-luxe text-stone-300 backdrop-blur-md transition-all duration-300 hover:border-gold-accent/40 hover:text-gold-accent animate-fade-in-up animate-delay-500 cursor-pointer"
      >
        See How It Works
        <ArrowDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
      </button>
    </section>
  );
}
