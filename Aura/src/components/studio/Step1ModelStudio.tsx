import { useRef, useState } from 'react';
import { Upload, CheckCircle2, Wand2, Camera, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { SkeletonKeypoints } from '@/components/SkeletonKeypoints';
import { TiltCard } from '@/components/ui/MotionWrappers';
import {
  MODEL_PRESETS,
  type AnglePhoto,
  SAMPLE_MODEL_NOTE,
} from '@/lib/data';

/* ============================================================
 * Step1ModelStudio — 2D VTON Single Full-Body Photo Flow.
 * Clean, luxury layout focused on 1 required full-body photo.
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
  onContinue,
}: Step1ModelStudioProps) {
  const [dragOver, setDragOver] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Single-photo 2D VTON requirement: front angle photo is required
  const frontPhoto = angles.find((a) => a.id === 'front');
  const photoUrl = frontPhoto?.url;
  const hasImage = Boolean(photoUrl);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
    setImgLoading(false);
  }

  function handleFile(files: FileList | null) {
    if (!files || !files[0]) return;
    const url = URL.createObjectURL(files[0]);
    setImgLoading(true);
    setAspectRatio(null);
    setAngles(
      angles.map((a) => ({ ...a, url })),
    );
  }

  function applyPreset(presetId: string) {
    const preset = MODEL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setImgLoading(true);
    setAspectRatio(null);
    setAngles(
      angles.map((a) => ({ ...a, url: preset.angles.front })),
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Step 01 · Capture</SectionLabel>
          <h2 className="mt-2 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-3xl">
            Model Studio
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-stone-400">
            Upload one clear, full-body photo of yourself, standing straight against a plain background. This is what your garment try-on will be based on.
          </p>
        </div>
        <GlowButton variant="gold" onClick={() => applyPreset(MODEL_PRESETS[0].id)}>
          <Wand2 className="h-4 w-4" />
          Use Sample Professional Model
        </GlowButton>
      </div>

      {/* Main Single-Photo Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        
        {/* Left Column: Primary Single Upload Card (7 Cols) */}
        <div className="lg:col-span-7">
          <TiltCard maxDeg={4} scale={1.01}>
            <GlassPanel hover trace className="group relative flex flex-col items-center justify-center overflow-hidden p-4 sm:p-5 border-stone-800 bg-stone-900/80">
              {/* Hidden File Input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files)}
              />

              {/* Dynamic Aspect Ratio Container — capped at max-h-[70vh] desktop / max-h-[55vh] mobile */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files);
                }}
                style={{
                  aspectRatio: aspectRatio ? `${aspectRatio}` : '3/4',
                }}
                className={`relative flex min-h-[360px] max-h-[55vh] sm:max-h-[70vh] w-full max-w-[500px] mx-auto cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-500 bg-stone-950 ${
                  dragOver
                    ? 'border-2 border-dashed border-gold-accent bg-gold-accent/10 shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)]'
                    : hasImage
                      ? 'border border-gold-accent/30 bg-stone-950'
                      : 'border-2 border-dashed border-stone-700 bg-stone-900/40 hover:border-gold-accent/60 hover:bg-stone-900/60'
                }`}
              >
                {hasImage ? (
                  <>
                    {/* Skeleton while natural aspect ratio calculates */}
                    {imgLoading && (
                      <div className="absolute inset-0 bg-stone-900 animate-pulse flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-gold-accent animate-spin-slow" />
                      </div>
                    )}

                    <img
                      src={photoUrl}
                      alt="Full-Body Model Photo"
                      onLoad={handleImageLoad}
                      className={`h-full w-full object-contain transition-opacity duration-300 ${
                        imgLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                    />

                    {/* Pose skeleton overlay on hover */}
                    <SkeletonKeypoints className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Pose Detected Badge */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-stone-950/80 px-3 py-1.5 backdrop-blur-md border border-gold-accent/40 z-10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold-accent animate-glow-pulse" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide-luxe text-gold-accent">
                        {SAMPLE_MODEL_NOTE}
                      </span>
                    </div>

                    {/* Hover Prompt Overlay */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-950/60 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-full border border-gold-accent/60 bg-gold-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide-luxe text-gold-accent backdrop-blur-md">
                        <Upload className="h-4 w-4" />
                        Click to Change Photo
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-accent/40 bg-gold-accent/10 shadow-[0_0_20px_-3px_rgba(212,175,55,0.3)]">
                      <Upload className="h-6 w-6 text-gold-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide-luxe text-stone-100">
                        Click or drag to upload your photo
                      </div>
                      <div className="mt-1 text-xs text-stone-400">
                        High-resolution JPG, PNG, or WebP (up to 10MB)
                      </div>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-stone-700 bg-stone-800/50 px-3 py-1 text-[10px] uppercase tracking-wide-luxe text-stone-400">
                      <Camera className="h-3 w-3 text-gold-accent" />
                      Single Full-Body Photo
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Status */}
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide-luxe text-stone-400">
                  <UserCheck className="h-3.5 w-3.5 text-gold-accent" />
                  Full-Body Photo
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      hasImage ? 'bg-gold-accent shadow-[0_0_10px_2px_rgba(212,175,55,0.7)]' : 'bg-stone-700'
                    }`}
                  />
                  {hasImage ? 'Ready for fitting' : 'Required'}
                </span>
              </div>
            </GlassPanel>
          </TiltCard>
        </div>

        {/* Right Column: Guidelines & Presets Selection (5 Cols) */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Preset Models Panel */}
          <GlassPanel className="p-5 border-stone-800 bg-stone-900/80">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide-luxe text-gold-accent">
              <Sparkles className="h-4 w-4 text-gold-accent" />
              Sample Studio Presets
            </div>
            <p className="mt-1 text-xs text-stone-400">
              Select one of our verified fashion editorial models to test instant fitting:
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {MODEL_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-all duration-300 ${
                      isSelected
                        ? 'border-gold-accent/60 bg-gold-accent/15 text-stone-100 shadow-[0_0_16px_-4px_rgba(212,175,55,0.4)]'
                        : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:bg-stone-800/50 hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.angles.front}
                        alt={p.name}
                        className="h-10 w-10 rounded-lg object-cover object-top border border-stone-700"
                      />
                      <div>
                        <div className="font-semibold uppercase tracking-wide-luxe text-stone-100">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Full-body standing studio preset
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-gold-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {/* Photo Requirements Guidelines Panel */}
          <GlassPanel className="p-5 border-stone-800 bg-stone-900/80">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide-luxe text-stone-200">
              <ShieldCheck className="h-4 w-4 text-gold-accent" />
              Photo Guidelines for Best AI Drape
            </div>
            
            <ul className="mt-3 space-y-2.5 text-xs text-stone-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-accent" />
                <span><strong className="text-stone-200">Standing upright facing front</strong> — natural relaxed posture with legs visible down to feet or mid-thigh.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-accent" />
                <span><strong className="text-stone-200">Plain background</strong> — simple wall or studio backdrop for precise silhouette extraction.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-accent" />
                <span><strong className="text-stone-200">Clear lighting</strong> — unobstructed torso and shoulders for accurate fabric wrapping.</span>
              </li>
            </ul>
          </GlassPanel>
        </div>
      </div>

      {/* Continue Action Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-stone-800 pt-5">
        <span className="text-xs text-stone-400">
          {hasImage
            ? 'Full-body photo ready. Proceed to select a garment from the wardrobe.'
            : 'Please upload a full-body photo or select a sample preset to continue.'}
        </span>
        <GlowButton variant="gold" onClick={onContinue} disabled={!hasImage}>
          Continue to Wardrobe
          <span className="text-base">→</span>
        </GlowButton>
      </div>
    </div>
  );
}
