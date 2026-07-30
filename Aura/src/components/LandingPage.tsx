import { ArrowRight } from 'lucide-react';
import { HeroHeader } from '@/components/HeroHeader';
import { FitLabsLogo } from '@/components/FitLabsLogo';
import { StoreLogoMarquee } from '@/components/StoreLogoMarquee';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { Reveal, TiltCard } from '@/components/ui/MotionWrappers';
import { MODEL_PRESETS, INITIAL_SAVED_FITS } from '@/lib/data';

/* ============================================================
 * Marketing landing — clean hierarchy, early proof strip.
 * Studio lives on a separate view.
 * ============================================================ */

interface LandingPageProps {
  onLaunchStudio: () => void;
}

const HOW_STEPS = [
  {
    num: '01',
    title: 'Upload your photo',
    text: 'A clear full-body shot works best — or start with a sample model.',
  },
  {
    num: '02',
    title: 'Choose a garment',
    text: 'Browse the closet, upload your own, or paste a product link from major stores.',
  },
  {
    num: '03',
    title: 'See the try-on',
    text: 'AI drapes the piece on your body. Save the look or try another piece.',
  },
];

export function LandingPage({ onLaunchStudio }: LandingPageProps) {
  return (
    <>
      <HeroHeader onLaunchStudio={onLaunchStudio} />

      {/* Early social proof — thin strip under hero (no heavy section chrome) */}
      <div className="mt-14 sm:mt-20">
        <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-wide-luxe text-stone-500">
          Import garments from
        </p>
        <StoreLogoMarquee />
      </div>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mb-12 text-center">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-2 font-serif text-3xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-4xl">
              Three steps to a <span className="text-gold-accent">real fit</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {HOW_STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.08}>
              <TiltCard maxDeg={5}>
                <GlassPanel
                  hover
                  className="flex h-full flex-col border-stone-800 bg-stone-900/70 p-6"
                >
                  <span className="font-serif text-3xl font-bold text-gold-accent/35">{step.num}</span>
                  <h3 className="mt-3 text-sm font-bold uppercase tracking-wide-luxe text-stone-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-stone-400">{step.text}</p>
                </GlassPanel>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Single Proof Section — Photorealistic try-on result */}
      <section id="result" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left text block */}
            <div className="lg:col-span-5">
              <SectionLabel>The Result</SectionLabel>
              <h2 className="mt-3 font-serif text-3xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-4xl">
                Photorealistic try-on in <span className="text-gold-accent">one studio</span>
              </h2>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-stone-400">
                Experience high-fidelity drape, texture, and fit synthesis. Whether uploading personal photos or pasting live product links from top fashion retailers, evaluate fit with precision before buying.
              </p>
              <div className="mt-6">
                <button
                  onClick={onLaunchStudio}
                  className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-accent transition-colors hover:text-gold-accent/80"
                >
                  <span>Launch Studio</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right side before/after framed visual */}
            <div className="lg:col-span-7">
              <GlassPanel className="relative overflow-hidden border-stone-800/80 bg-stone-900/40 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Before Frame */}
                  <div className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-950">
                    <img
                      src={MODEL_PRESETS[0].angles.front}
                      alt="Original model input"
                      className="h-64 sm:h-80 w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-md border border-stone-800 bg-stone-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-300 backdrop-blur-md">
                      01 · Photo Input
                    </span>
                  </div>

                  {/* After Frame */}
                  <div className="group relative overflow-hidden rounded-xl border border-gold-accent/30 bg-stone-950 shadow-lg shadow-gold-accent/5">
                    <img
                      src={INITIAL_SAVED_FITS[0].thumbnail}
                      alt="AI Virtual Try-On Result"
                      className="h-64 sm:h-80 w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-md border border-gold-accent/40 bg-gold-accent/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-accent backdrop-blur-md">
                      02 · AI Try-On
                    </span>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Slim Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-stone-800/80 bg-stone-900/50 p-6 sm:p-8 sm:flex-row">
            <div>
              <h2 className="font-serif text-2xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-3xl">
                Ready to try something on?
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-stone-400">
                Open the studio — photo, garment, instant neural fit.
              </p>
            </div>
            <GlowButton
              variant="gold"
              onClick={onLaunchStudio}
              className="shrink-0 px-8 py-3.5 text-xs font-bold uppercase tracking-wider"
            >
              Launch Studio
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </div>
        </Reveal>
      </section>

      {/* Quiet Footer */}
      <footer className="mx-auto max-w-7xl border-t border-stone-800/60 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <FitLabsLogo size="sm" />
          <p className="text-center font-medium text-stone-400">
            FitLabs — Photorealistic AI try-on
          </p>
          <p className="text-stone-600">© 2026 FitLabs</p>
        </div>
      </footer>
    </>
  );
}

