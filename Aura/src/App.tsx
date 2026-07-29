import { useEffect, useMemo, useState } from 'react';
import { AmbientBackground } from '@/components/AmbientBackground';
import { ParticleField } from '@/components/ParticleField';
import { CursorSparkTrail } from '@/components/CursorSparkTrail';
import { ScrollProgressBar } from '@/components/ScrollProgressBar';
import { AmbientAudioToggle } from '@/components/AmbientAudioToggle';
import { TopGlassNav } from '@/components/TopGlassNav';
import { HeroHeader } from '@/components/HeroHeader';
import { LightingDrawer } from '@/components/LightingDrawer';
import { SavedFitsDrawer } from '@/components/SavedFitsDrawer';
import { AuraStylist } from '@/components/AuraStylist';
import { StudioWorkspace, type StepId } from '@/components/studio/StudioWorkspace';
import { Step1ModelStudio } from '@/components/studio/Step1ModelStudio';
import { Step2WardrobeCloset } from '@/components/studio/Step2WardrobeCloset';
import { Step3NeuralFitting } from '@/components/studio/Step3NeuralFitting';
import { Step4RunwayShowcase } from '@/components/studio/Step4RunwayShowcase';
import { GlassPanel, SectionLabel } from '@/components/ui/GlassPrimitives';
import { Reveal, TiltCard } from '@/components/ui/MotionWrappers';
import {
  ANGLE_DEFS,
  GARMENTS,
  MODEL_PRESETS,
  RESULT_IMAGES,
  INITIAL_SAVED_FITS,
  type AnglePhoto,
  type Garment,
  type LightingPreset,
  type SavedFit,
} from '@/lib/data';
import { Sparkles, Layers, Cpu, Wand2, Eye } from 'lucide-react';

function App() {
  /* ----------------------------- App state ----------------------------- */
  const [activeNav, setActiveNav] = useState('studio');
  const [activeStep, setActiveStep] = useState<StepId>(1);

  // Step 1 — model
  const [angles, setAngles] = useState<AnglePhoto[]>(
    ANGLE_DEFS.map((d) => ({ id: d.id, label: d.label, hint: d.hint })),
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Step 2 — wardrobe (default to GARMENTS[0] so garment is never null)
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(GARMENTS[0]);
  const [uploadedGarmentUrl, setUploadedGarmentUrl] = useState<string | null>(null);
  const [bgRemoval, setBgRemoval] = useState(true);

  // Step 3 & 4 — fitting, cache & real result
  const [fitting, setFitting] = useState(false);
  const [tryonResultUrl, setTryonResultUrl] = useState<string | null>(null);
  const [resultCache, setResultCache] = useState<Record<string, string>>({});
  const [isRegeneration, setIsRegeneration] = useState(false);

  // Step 4 — showcase
  const [savedFits, setSavedFits] = useState<SavedFit[]>(INITIAL_SAVED_FITS);
  const [justSaved, setJustSaved] = useState(false);

  // Drawers / theme
  const [lightingOpen, setLightingOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [lighting, setLighting] = useState<LightingPreset>('neutral');
  const [lightingAutoRotate, setLightingAutoRotate] = useState(true);

  // Auto-rotate studio lighting every 7 seconds if enabled
  useEffect(() => {
    if (!lightingAutoRotate) return;
    const presets: LightingPreset[] = ['neutral', 'golden', 'cyberpunk'];
    const timer = setInterval(() => {
      setLighting((prev) => {
        const nextIndex = (presets.indexOf(prev) + 1) % presets.length;
        return presets[nextIndex];
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [lightingAutoRotate]);

  /* --------------------------- Derived values -------------------------- */
  const modelFrontUrl = useMemo(
    () => angles.find((a) => a.id === 'front')?.url,
    [angles],
  );
  const garmentImageUrl = useMemo(
    () => uploadedGarmentUrl ?? selectedGarment?.url,
    [uploadedGarmentUrl, selectedGarment],
  );
  const activePreset = selectedPresetId ?? MODEL_PRESETS[0].id;
  const resultImages = RESULT_IMAGES[activePreset] ?? RESULT_IMAGES[MODEL_PRESETS[0].id];
  const garmentName = selectedGarment?.name ?? (uploadedGarmentUrl ? 'Uploaded Garment' : 'selected garment');

  const cacheKey = useMemo(
    () => (modelFrontUrl && garmentImageUrl ? `${modelFrontUrl}_${garmentImageUrl}` : null),
    [modelFrontUrl, garmentImageUrl],
  );
  const cachedResultUrl = cacheKey ? resultCache[cacheKey] : null;

  const reachableSteps: StepId[] = useMemo(() => {
    if (activeStep >= 4) return [1, 2, 3, 4];
    if (activeStep === 3) return [1, 2, 3];
    return [1, activeStep];
  }, [activeStep]);

  /* ------------------------------ Handlers ----------------------------- */
  function handleNavChange(id: string) {
    setActiveNav(id);
    if (id === 'studio') {
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (id === 'lookbook') {
      setActiveStep(2);
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (id === 'lighting') {
      setLightingOpen(true);
    } else if (id === 'how') {
      document.getElementById('how')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function launchStudio() {
    setActiveNav('studio');
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startFitting() {
    setIsRegeneration(false);
    setActiveStep(3);
    setFitting(true);
  }

  function handleForceRegenerate() {
    if (cacheKey) {
      setResultCache((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    }
    setTryonResultUrl(null);
    setIsRegeneration(true);
    setActiveStep(3);
    setFitting(true);
  }

  function onFittingComplete(realUrl: string) {
    if (cacheKey) {
      setResultCache((prev) => ({ ...prev, [cacheKey]: realUrl }));
    }
    setTryonResultUrl(realUrl);
    setFitting(false);
    setIsRegeneration(false);
    setActiveStep(4);
  }

  function saveFit() {
    if (!modelFrontUrl) return;
    const newFit: SavedFit = {
      id: `sf-${Date.now()}`,
      modelName: MODEL_PRESETS.find((p) => p.id === selectedPresetId)?.name ?? 'Custom Model',
      garmentName,
      thumbnail: tryonResultUrl ?? modelFrontUrl,
      timestamp: 'Just now',
      fitScore: 98.7,
    };
    setSavedFits((prev) => [newFit, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  }

  function removeFit(id: string) {
    setSavedFits((prev) => prev.filter((f) => f.id !== id));
  }

  /* ------------------------------- Render ------------------------------ */
  return (
    <div className="relative min-h-screen">
      <AmbientBackground preset={lighting} />
      <ParticleField preset={lighting} />
      <ScrollProgressBar />
      <CursorSparkTrail />

      <TopGlassNav
        savedCount={savedFits.length}
        onOpenLighting={() => setLightingOpen(true)}
        onOpenSaved={() => setSavedOpen(true)}
        onLaunch={launchStudio}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        ambientToggle={<AmbientAudioToggle />}
        activeStep={activeStep}
      />

      <main id="studio">
        <HeroHeader />

        <Reveal>
          <StudioWorkspace
            activeStep={activeStep}
            onStepChange={setActiveStep}
            reachableSteps={reachableSteps}
            fullBleedContent={
              activeStep === 4 ? (
                <Step4RunwayShowcase
                  beforeUrl={modelFrontUrl ?? ''}
                  afterUrls={resultImages}
                  realResultUrl={tryonResultUrl ?? cachedResultUrl}
                  garmentThumbnail={garmentImageUrl}
                  garmentName={garmentName}
                  garmentBrand={selectedGarment?.brand}
                  isLoading={fitting}
                  onSave={saveFit}
                  onRegenerate={handleForceRegenerate}
                  justSaved={justSaved}
                />
              ) : undefined
            }
          >
            {activeStep === 1 && (
              <Step1ModelStudio
                angles={angles}
                setAngles={setAngles}
                selectedPresetId={selectedPresetId}
                setSelectedPresetId={setSelectedPresetId}
                onContinue={() => setActiveStep(2)}
              />
            )}

            {activeStep === 2 && (
              <Step2WardrobeCloset
                selectedGarment={selectedGarment}
                setSelectedGarment={setSelectedGarment}
                uploadedGarmentUrl={uploadedGarmentUrl}
                setUploadedGarmentUrl={setUploadedGarmentUrl}
                bgRemoval={bgRemoval}
                setBgRemoval={setBgRemoval}
                onBack={() => setActiveStep(1)}
                onContinue={startFitting}
              />
            )}

            {activeStep === 3 && (
              <Step3NeuralFitting
                modelImageUrl={modelFrontUrl}
                garmentImageUrl={garmentImageUrl ?? undefined}
                garmentName={garmentName}
                cachedResultUrl={cachedResultUrl}
                isRegeneration={isRegeneration}
                onComplete={onFittingComplete}
                onBack={() => setActiveStep(2)}
                onForceRegenerate={handleForceRegenerate}
              />
            )}
          </StudioWorkspace>
        </Reveal>
      </main>

      <HowItWorks />

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <GlassPanel className="flex flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-[0.2em] text-white">VOILE</span>
            </div>
            <p className="text-center text-xs text-silver-muted">
              Generative AI virtual fitting — millimeter precision try-on for modern wardrobes.
            </p>
            <p className="text-xs text-silver-muted/60">© 2026 VOILE</p>
          </GlassPanel>
        </Reveal>
      </footer>

      {/* Drawers + floating widget */}
      <LightingDrawer
        open={lightingOpen}
        onClose={() => setLightingOpen(false)}
        preset={lighting}
        onPresetChange={(p) => {
          setLighting(p);
          setLightingAutoRotate(false); // Locking a single preset stops auto-rotation
        }}
        autoRotate={lightingAutoRotate}
        onToggleAutoRotate={() => setLightingAutoRotate((prev) => !prev)}
      />
      <SavedFitsDrawer
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        fits={savedFits}
        onRemove={removeFit}
      />
      <AuraStylist />
    </div>
  );
}

/* ---------------- Plain-Language 3-Step "How It Works" Section ---------------- */

const THREE_STEPS = [
  {
    num: '01',
    title: 'Upload Your Photo',
    text: 'Take or select a clear full-body photo standing straight against any background.',
  },
  {
    num: '02',
    title: 'Pick or Upload a Garment',
    text: 'Choose from our curated luxury collection or upload your own clothing item.',
  },
  {
    num: '03',
    title: 'See Your AI Try-On Instantly',
    text: 'Our generative engine renders a realistic preview of how the garment fits your body.',
  },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="mb-10 text-center">
          <SectionLabel>Simple & Instant</SectionLabel>
          <h2 className="mt-2 font-serif text-3xl font-bold uppercase tracking-wide-luxe text-white sm:text-4xl">
            How It <span className="text-gradient-cyan">Works</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-silver-muted">
            Three easy steps to experience photorealistic virtual try-on from any device.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {THREE_STEPS.map((step, i) => (
          <Reveal key={step.num} delay={i * 0.1}>
            <TiltCard maxDeg={6}>
              <GlassPanel hover shimmer trace className="relative flex h-full flex-col p-6">
                <span className="font-serif text-4xl font-bold text-cyan-aura/30 mb-4">{step.num}</span>
                <h3 className="text-base font-bold uppercase tracking-wide-luxe text-white">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-silver-muted">{step.text}</p>
              </GlassPanel>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default App;
