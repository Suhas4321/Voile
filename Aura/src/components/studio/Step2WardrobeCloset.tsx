import { useRef, useState } from 'react';
import { Upload, Scissors, Check, Sparkles } from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { TiltCard } from '@/components/ui/MotionWrappers';
import { GARMENTS, type GarmentCategory, type Garment } from '@/lib/data';

/* ============================================================
 * Step2WardrobeCloset — garment selection with dual mode:
 * upload your own (with mock bg-removal toggle) or pick from
 * a curated luxury wardrobe grid with category tabs.
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
        <h2 className="mt-2 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-white sm:text-3xl">
          Wardrobe Closet
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-silver-muted">
          Upload a garment flat-lay or select from our curated luxury wardrobe. Every piece is
          analyzed for fabric, drape, and tension.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mb-5 flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] p-1">
        {(['curated', 'upload'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none ${
              mode === m ? 'bg-white/[0.1] text-white shadow-[inset_0_0_12px_-4px_rgba(0,229,255,0.6)]' : 'text-silver-muted hover:text-white'
            }`}
          >
            {m === 'curated' ? 'Curated Luxury Wardrobe' : 'Upload Your Garment'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Upload zone */}
          <GlassPanel hover className="overflow-hidden p-0">
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
              className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-300 ${
                dragOver
                  ? 'border-2 border-dashed border-cyan-aura bg-cyan-aura/[0.08]'
                  : uploadedGarmentUrl
                    ? ''
                    : 'border-2 border-dashed border-white/15 hover:border-cyan-aura/50'
              }`}
            >
              {uploadedGarmentUrl ? (
                <img src={uploadedGarmentUrl} alt="Uploaded garment" className="h-full w-full object-cover" />
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                    <Upload className="h-6 w-6 text-silver-muted" />
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wide-luxe text-white">
                    Drop Garment Flat-Lay
                  </div>
                  <div className="text-xs text-silver-muted">Shirt · Dress · Jacket · Pants</div>
                </>
              )}
            </div>
          </GlassPanel>

          {/* Options panel */}
          <GlassPanel className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-aura" />
                <span className="text-sm font-semibold uppercase tracking-wide-luxe text-white">
                  Extraction Tools
                </span>
              </div>
              <button
                onClick={() => setBgRemoval(!bgRemoval)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all duration-300 hover:border-cyan-aura/40"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-cyan-aura" />
                  <div>
                    <div className="text-sm font-semibold text-white">Auto-Remove Background</div>
                    <div className="text-xs text-silver-muted">Flat-Lay Extraction · AI matte</div>
                  </div>
                </div>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                    bgRemoval ? 'bg-cyan-aura/80' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
                      bgRemoval ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>

              {bgRemoval && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-aura/[0.06] px-3 py-2 text-xs text-cyan-aura/90 animate-fade-in">
                  <Check className="h-3.5 w-3.5" />
                  Background isolated — garment cutout ready for draping.
                </div>
              )}
            </div>

            {uploadedGarmentUrl && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-400/[0.08] px-3 py-2 text-xs text-emerald-300 animate-fade-in">
                <Check className="h-3.5 w-3.5" />
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
                    ? 'border-cyan-aura/60 bg-cyan-aura/10 text-cyan-aura shadow-[0_0_16px_-4px_rgba(0,229,255,0.7)]'
                    : 'border-white/10 bg-white/[0.03] text-silver-muted hover:border-white/25 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Garment grid */}
          <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((g) => {
              const isSelected = selectedGarment?.id === g.id;
              return (
                <TiltCard key={g.id} maxDeg={6} scale={1.03}>
                <GlassPanel
                  hover
                  shimmer
                  trace
                  className={`group relative h-full cursor-pointer overflow-hidden p-0 transition-all duration-500 ${
                    isSelected ? 'ring-2 ring-cyan-aura shadow-[0_0_28px_-6px_rgba(0,229,255,0.8)] hover:scale-[1.02] active:scale-[0.98] transition-transform' : ''
                  }`}
                >
                  <button onClick={() => selectGarment(g)} className="block w-full text-left">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                      <img
                        src={g.url}
                        alt={g.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-cyan-aura px-2 py-1 shadow-[0_0_14px_-2px_rgba(0,229,255,0.9)] animate-scale-in">
                          <Check className="h-3 w-3 text-obsidian" />
                          <span className="text-[9px] font-bold uppercase tracking-wide-luxe text-obsidian">
                            Selected
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="text-[10px] uppercase tracking-wide-luxe text-cyan-aura/90">{g.brand}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-white">
                          {g.name}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-silver-muted">{g.fabric}</span>
                          <span className="text-[11px] font-bold text-gradient-gold">{g.price}</span>
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
      <div className="sticky bottom-4 z-40 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-obsidian/90 px-5 py-3.5 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.8)]">
        <button
          onClick={onBack}
          className="text-xs uppercase tracking-wide-luxe text-silver-muted transition-colors hover:text-white"
        >
          ← Back to Model
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs font-medium text-silver-muted">
            {ready
              ? `Locked: ${selectedGarment?.name ?? 'Uploaded Garment'}`
              : 'Select or upload a garment to proceed'}
          </span>
          <GlowButton variant="cyan" onClick={onContinue} disabled={!ready}>
            Generate AI Try-On
            <Sparkles className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
