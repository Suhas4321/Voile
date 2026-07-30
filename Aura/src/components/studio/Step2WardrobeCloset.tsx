import { useRef, useState } from 'react';
import { Upload, Scissors, Check, Sparkles } from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { TiltCard } from '@/components/ui/MotionWrappers';
import { GARMENTS, type GarmentCategory, type Garment } from '@/lib/data';

/* ============================================================
 * Step2WardrobeCloset — garment selection with dual mode:
 * upload your own (with flat-lay background isolation) or pick
 * from a curated luxury wardrobe grid with category tabs.
 * ============================================================ */

interface Step2WardrobeClosetProps {
  selectedGarment: Garment | null;
  setSelectedGarment: (g: Garment | null) => void;
  uploadedGarmentUrl: string | null;
  setUploadedGarmentUrl: (url: string | null) => void;
  bgRemoval: boolean;
  setBgRemoval: (v: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

const CATEGORIES: GarmentCategory[] = ['All', 'Outerwear', 'Evening Wear', 'Streetwear', 'Accessories'];

export function Step2WardrobeCloset({
  selectedGarment,
  setSelectedGarment,
  uploadedGarmentUrl,
  setUploadedGarmentUrl,
  bgRemoval,
  setBgRemoval,
  onBack,
  onContinue,
}: Step2WardrobeClosetProps) {
  const [mode, setMode] = useState<'curated' | 'upload'>('curated');
  const [category, setCategory] = useState<GarmentCategory>('All');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category);
  const ready = Boolean(selectedGarment) || Boolean(uploadedGarmentUrl);

  function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return;
    setUploadedGarmentUrl(URL.createObjectURL(files[0]));
  }

  function selectGarment(g: Garment) {
    setSelectedGarment(g);
    setUploadedGarmentUrl(null);
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <SectionLabel>Step 02 · Curate</SectionLabel>
        <h2 className="mt-2 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-3xl">
          Wardrobe Closet
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-stone-400">
          Upload a garment flat-lay or select from our curated luxury wardrobe. Every piece is
          analyzed for fabric, drape, and tension.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mb-5 flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900/80 p-1">
        {(['curated', 'upload'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none ${
              mode === m
                ? 'bg-stone-800 text-gold-accent shadow-[inset_0_0_12px_-4px_rgba(212,175,55,0.5)] border border-gold-accent/30'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            {m === 'curated' ? 'Curated Luxury Wardrobe' : 'Upload Your Garment'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Upload zone — FULL image boundary display with object-contain */}
          <GlassPanel hover className="overflow-hidden p-3 border-stone-800 bg-stone-900/80">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
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
                handleFiles(e.dataTransfer.files);
              }}
              className={`flex aspect-[4/3] min-h-[320px] max-h-[50vh] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-300 bg-stone-950 overflow-hidden ${
                dragOver
                  ? 'border-2 border-dashed border-gold-accent bg-gold-accent/10'
                  : uploadedGarmentUrl
                    ? 'border border-gold-accent/40'
                    : 'border-2 border-dashed border-stone-700 hover:border-gold-accent/60'
              }`}
            >
              {uploadedGarmentUrl ? (
                <div className="relative h-full w-full flex items-center justify-center p-2 bg-stone-950">
                  <img
                    src={uploadedGarmentUrl}
                    alt="Uploaded garment"
                    className="h-full w-full object-contain drop-shadow-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60 opacity-0 transition-opacity hover:opacity-100 backdrop-blur-xs">
                    <span className="rounded-full bg-gold-accent px-4 py-2 text-xs font-bold uppercase tracking-wide-luxe text-stone-950 shadow-md">
                      Change Garment Image
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-700 bg-stone-800/60">
                    <Upload className="h-6 w-6 text-gold-accent" />
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wide-luxe text-stone-100">
                    Drop Garment Flat-Lay
                  </div>
                  <div className="text-xs text-stone-400">Shirt · Dress · Jacket · Pants</div>
                </>
              )}
            </div>
          </GlassPanel>

          {/* Options panel */}
          <GlassPanel className="flex flex-col justify-between p-5 border-stone-800 bg-stone-900/80">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-accent" />
                <span className="text-sm font-semibold uppercase tracking-wide-luxe text-stone-100">
                  Extraction Tools
                </span>
              </div>
              <button
                onClick={() => setBgRemoval(!bgRemoval)}
                className="flex w-full items-center justify-between rounded-xl border border-stone-800 bg-stone-900/60 p-4 text-left transition-all duration-300 hover:border-gold-accent/40"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-gold-accent" />
                  <div>
                    <div className="text-sm font-semibold text-stone-100">Auto-Remove Background</div>
                    <div className="text-xs text-stone-400">Flat-Lay Extraction · AI matte</div>
                  </div>
                </div>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                    bgRemoval ? 'bg-gold-accent' : 'bg-stone-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-stone-950 shadow transition-all duration-300 ${
                      bgRemoval ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>

              {bgRemoval && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-gold-accent/10 border border-gold-accent/30 px-3 py-2 text-xs text-gold-accent animate-fade-in">
                  <Check className="h-3.5 w-3.5" />
                  Background isolated — garment cutout ready for draping.
                </div>
              )}
            </div>

            {uploadedGarmentUrl && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-stone-800 border border-stone-700 px-3 py-2 text-xs text-stone-200 animate-fade-in">
                <Check className="h-3.5 w-3.5 text-gold-accent" />
                Garment uploaded and ready for try-on.
              </div>
            )}
          </GlassPanel>
        </div>
      ) : (
        <>
          {/* Category tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide-luxe uppercase transition-all duration-300 ${
                  category === c
                    ? 'border-gold-accent/60 bg-gold-accent/15 text-gold-accent shadow-[0_0_16px_-4px_rgba(212,175,55,0.4)]'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Garment grid — clean proportional container */}
          <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((g) => {
              const isSelected = selectedGarment?.id === g.id;
              return (
                <TiltCard key={g.id} maxDeg={6} scale={1.03}>
                <GlassPanel
                  hover
                  shimmer
                  trace
                  className={`group relative h-full cursor-pointer overflow-hidden p-0 border-stone-800 bg-stone-900/80 transition-all duration-500 ${
                    isSelected ? 'ring-2 ring-gold-accent shadow-[0_0_28px_-6px_rgba(212,175,55,0.6)]' : ''
                  }`}
                >
                  <button onClick={() => selectGarment(g)} className="block w-full text-left">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-950 p-2 flex items-center justify-center">
                      <img
                        src={g.url}
                        alt={g.name}
                        className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent pointer-events-none" />
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-gold-accent px-2.5 py-1 shadow-[0_0_14px_-2px_rgba(212,175,55,0.9)] animate-scale-in">
                          <Check className="h-3 w-3 text-stone-950" />
                          <span className="text-[9px] font-bold uppercase tracking-wide-luxe text-stone-950">
                            Selected
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                        <div className="text-[10px] uppercase tracking-wide-luxe text-gold-accent/90">{g.brand}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-stone-100">
                          {g.name}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-stone-400">{g.fabric}</span>
                          <span className="text-[11px] font-bold text-gold-accent">{g.price}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </GlassPanel>
                </TiltCard>
              );
            })}
          </div>
        </>
      )}

      {/* Sticky Floating Bottom Bar */}
      <div className="sticky bottom-4 z-40 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950/90 px-5 py-3.5 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.8)]">
        <button
          onClick={onBack}
          className="text-xs uppercase tracking-wide-luxe text-stone-400 transition-colors hover:text-stone-100 cursor-pointer"
        >
          ← Back to Model
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs font-medium text-stone-400">
            {ready
              ? `Locked: ${selectedGarment?.name ?? 'Uploaded Garment'}`
              : 'Select or upload a garment to proceed'}
          </span>
          <GlowButton variant="gold" onClick={onContinue} disabled={!ready}>
            Generate AI Try-On
            <Sparkles className="h-4 w-4 fill-stone-950" />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
