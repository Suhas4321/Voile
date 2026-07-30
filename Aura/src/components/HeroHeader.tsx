import { ArrowRight } from 'lucide-react';

/* ============================================================
 * HeroHeader — clean landing hero (single idea, single CTA)
 * ============================================================ */

interface HeroHeaderProps {
  onLaunchStudio?: () => void;
}

export function HeroHeader({ onLaunchStudio }: HeroHeaderProps) {
  function scrollToHow() {
    document.getElementById('how')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="relative mx-auto max-w-4xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
      <p className="mb-6 text-[11px] font-medium uppercase tracking-luxe text-gold-accent/90 animate-fade-in-up">
        AI Virtual Try-On
      </p>

      <h1 className="font-serif text-4xl font-bold uppercase leading-[1.1] tracking-wide-luxe text-stone-100 sm:text-6xl lg:text-7xl animate-fade-in-up">
        See yourself in
        <br />
        <span className="text-gold-accent">any outfit.</span>
      </h1>

      <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-stone-400 animate-fade-in-up animate-delay-200 sm:text-lg">
        Upload your photo, pick a garment — or paste a store link — and get a realistic AI try-on.
      </p>

      <div className="mt-9 flex flex-col items-center justify-center gap-3 animate-fade-in-up animate-delay-300 sm:flex-row">
        <button
          onClick={onLaunchStudio}
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-accent via-amber-300 to-gold-aura px-8 py-3.5 text-xs font-bold uppercase tracking-wide-luxe text-stone-950 shadow-[0_0_24px_-4px_rgba(212,175,55,0.55)] cursor-pointer"
        >
          Launch Studio
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={scrollToHow}
          className="text-xs font-medium uppercase tracking-wide-luxe text-stone-400 transition-colors hover:text-gold-accent cursor-pointer"
        >
          How it works
        </button>
      </div>
    </section>
  );
}
