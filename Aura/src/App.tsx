import { useCallback, useEffect, useMemo, useState } from 'react';
import { AmbientBackground } from '@/components/AmbientBackground';
import { ParticleField } from '@/components/ParticleField';
import { CursorSparkTrail } from '@/components/CursorSparkTrail';
import { ScrollProgressBar } from '@/components/ScrollProgressBar';
import { TopGlassNav, type AppView } from '@/components/TopGlassNav';
import { LandingPage } from '@/components/LandingPage';
import { LightingDrawer } from '@/components/LightingDrawer';
import { SavedFitsDrawer } from '@/components/SavedFitsDrawer';
import { AuraStylist } from '@/components/AuraStylist';
import { StudioWorkspace, type StepId } from '@/components/studio/StudioWorkspace';
import { Step1ModelStudio } from '@/components/studio/Step1ModelStudio';
import { Step2WardrobeCloset } from '@/components/studio/Step2WardrobeCloset';
import { Step3NeuralFitting } from '@/components/studio/Step3NeuralFitting';
import { Step4RunwayShowcase } from '@/components/studio/Step4RunwayShowcase';
import { Reveal } from '@/components/ui/MotionWrappers';
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

function viewFromHash(): AppView {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return h.startsWith('studio') ? 'studio' : 'landing';
}

function App() {
  const [view, setView] = useState<AppView>(() =>
    typeof window !== 'undefined' ? viewFromHash() : 'landing',
  );
  const [activeNav, setActiveNav] = useState('home');
  const [activeStep, setActiveStep] = useState<StepId>(1);

  const [angles, setAngles] = useState<AnglePhoto[]>(
    ANGLE_DEFS.map((d) => ({ id: d.id, label: d.label, hint: d.hint })),
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(GARMENTS[0]);
  const [uploadedGarmentUrl, setUploadedGarmentUrl] = useState<string | null>(null);
  const [bgRemoval, setBgRemoval] = useState(true);

  const [fitting, setFitting] = useState(false);
  const [tryonResultUrl, setTryonResultUrl] = useState<string | null>(null);
  const [resultCache, setResultCache] = useState<Record<string, string>>({});

  const [savedFits, setSavedFits] = useState<SavedFit[]>(INITIAL_SAVED_FITS);
  const [justSaved, setJustSaved] = useState(false);

  const [lightingOpen, setLightingOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [lighting, setLighting] = useState<LightingPreset>('obsidian');
  const [lightingAutoRotate, setLightingAutoRotate] = useState(false);

  /* Hash routing: #/studio ↔ studio view */
  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goLanding = useCallback(() => {
    setView('landing');
    setActiveNav('home');
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const launchStudio = useCallback(() => {
    setView('studio');
    setActiveStep(1);
    window.location.hash = 'studio';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!lightingAutoRotate) return;
    const presets: LightingPreset[] = ['obsidian', 'golden', 'neutral', 'cyberpunk'];
    const timer = setInterval(() => {
      setLighting((prev) => {
        const nextIndex = (presets.indexOf(prev) + 1) % presets.length;
        return presets[nextIndex];
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [lightingAutoRotate]);

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
  const garmentName =
    selectedGarment?.name ?? (uploadedGarmentUrl ? 'Uploaded Garment' : 'selected garment');

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

  function handleNavChange(id: string) {
    setActiveNav(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startFitting() {
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
    setActiveStep(3);
    setFitting(true);
  }

  function onFittingComplete(realUrl: string) {
    if (cacheKey) {
      setResultCache((prev) => ({ ...prev, [cacheKey]: realUrl }));
    }
    setTryonResultUrl(realUrl);
    setFitting(false);
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

  return (
    <div className="relative min-h-screen">
      <AmbientBackground preset={lighting} />
      <ParticleField preset={lighting} />
      {view === 'landing' && <ScrollProgressBar />}
      <CursorSparkTrail />

      <TopGlassNav
        view={view}
        savedCount={savedFits.length}
        onOpenLighting={() => setLightingOpen(true)}
        onOpenSaved={() => setSavedOpen(true)}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onLaunchStudio={launchStudio}
        onBackToLanding={goLanding}
        activeStep={activeStep}
        reachableSteps={reachableSteps}
        onStepChange={setActiveStep}
      />

      {view === 'landing' ? (
        <LandingPage onLaunchStudio={launchStudio} />
      ) : (
        <main id="studio" className="pb-10">
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
                  modelImageUrl={modelFrontUrl ?? null}
                  garmentImageUrl={garmentImageUrl ?? null}
                  garmentName={garmentName}
                  onComplete={onFittingComplete}
                  onBack={() => setActiveStep(2)}
                  onForceRegenerate={handleForceRegenerate}
                />
              )}
            </StudioWorkspace>
          </Reveal>
        </main>
      )}

      {/* Theme drawer — landing + studio */}
      <LightingDrawer
        open={lightingOpen}
        onClose={() => setLightingOpen(false)}
        preset={lighting}
        onPresetChange={(p) => {
          setLighting(p);
          setLightingAutoRotate(false);
        }}
        autoRotate={lightingAutoRotate}
        onToggleAutoRotate={() => setLightingAutoRotate((prev) => !prev)}
      />

      {/* Studio-only tools */}
      {view === 'studio' && (
        <>
          <SavedFitsDrawer
            open={savedOpen}
            onClose={() => setSavedOpen(false)}
            fits={savedFits}
            onRemove={removeFit}
          />
          <AuraStylist />
        </>
      )}
    </div>
  );
}

export default App;
