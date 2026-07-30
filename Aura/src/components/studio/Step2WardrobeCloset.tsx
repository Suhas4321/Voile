import { useRef, useState } from 'react';
import {
  Upload,
  Scissors,
  Check,
  Sparkles,
  Link as LinkIcon,
  Globe,
  Loader2,
  ExternalLink,
  ShoppingBag,
  AlertCircle,
  Tag,
  Store,
  Layers,
} from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { TiltCard } from '@/components/ui/MotionWrappers';
import { GARMENTS, type GarmentCategory, type Garment } from '@/lib/data';

/* ============================================================
 * Step2WardrobeCloset — Garment selection with triple mode:
 * 1. Browse Collection (curated wardrobe)
 * 2. Upload Your Own (flat-lay photo)
 * 3. Import from Link (e-commerce product URL → /api/v1/extract-garment)
 * ============================================================ */

const API_BASE = 'http://localhost:8000';

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

// Demo preset e-commerce links (Myntra verified working with current scraper)
const PRESET_LINKS = [
  {
    label: 'Myntra TOXA Oversized Tee',
    brand: 'TOXA',
    tag: 'Myntra',
    url: 'https://www.myntra.com/tshirts/toxa/toxa-unisex-typography-puff-print-half-sleeve-oversized-casual-t-shirt/44497035/buy',
  },
  {
    label: 'Myntra Roadster Cotton Tee',
    brand: 'Roadster',
    tag: 'Myntra',
    url: 'https://www.myntra.com/tshirts/roadster/roadster-men-white--pure-cotton-t-shirt/2275365/buy',
  },
  {
    label: 'Direct High-Res Garment Photo',
    brand: 'Studio Flat-Lay',
    tag: 'Image URL',
    url: 'https://assets.myntassets.com/h_1440,q_85,w_1080/v1/assets/images/2026/JULY/24/8OKClMF8_a21f67c873004c2a90acd2a173d0c28f.jpg',
  },
];

export interface ExtractedGarmentData {
  id: string;
  title: string;
  brand: string;
  price: string | null;
  site_name: string;
  category: string;
  garment_url: string;
  source_url: string;
  all_images: string[];
  selected_image_index: number;
}

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
  const [mode, setMode] = useState<'curated' | 'upload' | 'link'>('curated');
  const [category, setCategory] = useState<GarmentCategory>('All');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Link Parser state
  const [linkInput, setLinkInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedGarmentData | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  const filtered = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category);
  const ready = Boolean(selectedGarment) || Boolean(uploadedGarmentUrl);

  function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return;
    setUploadedGarmentUrl(URL.createObjectURL(files[0]));
    setSelectedGarment(null);
  }

  function selectGarment(g: Garment) {
    setSelectedGarment(g);
    setUploadedGarmentUrl(null);
  }

  async function handleExtractLink(urlToExtract: string, imgIdx = 0) {
    if (!urlToExtract.trim()) {
      setExtractError('Please enter a valid e-commerce URL or image link.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/extract-garment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToExtract.trim(),
          image_index: imgIdx,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to extract garment (${res.status})`);
      }

      const data = await res.json();
      const fullGarmentUrl = data.garment_url.startsWith('http')
        ? data.garment_url
        : `${API_BASE}${data.garment_url}`;

      setExtractedData({
        id: data.id,
        title: data.title,
        brand: data.brand,
        price: data.price,
        site_name: data.site_name,
        category: data.category,
        garment_url: fullGarmentUrl,
        source_url: data.source_url,
        all_images: data.all_images || [],
        selected_image_index: imgIdx,
      });

      setSelectedImgIndex(imgIdx);
      setUploadedGarmentUrl(fullGarmentUrl);
      setSelectedGarment(null);
    } catch (err: any) {
      setExtractError(err.message || 'Failed to parse link. Please verify the URL.');
    } finally {
      setIsExtracting(false);
    }
  }

  function handlePresetClick(presetUrl: string) {
    setLinkInput(presetUrl);
    handleExtractLink(presetUrl, 0);
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <SectionLabel>Step 02 · Curate</SectionLabel>
        <h2 className="mt-2 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-3xl">
          Wardrobe Closet
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-stone-400">
          Browse the collection, upload your own garment photo, or import from a product link
          (Myntra, Ajio, Amazon Fashion, Flipkart, Meesho, Nykaa Fashion, Tata CLiQ).
        </p>
      </div>

      {/* Mode toggle — Browse · Upload · Import from Link */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/80 p-1.5 backdrop-blur-md">
        <button
          onClick={() => setMode('curated')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none cursor-pointer ${
            mode === 'curated'
              ? 'bg-stone-800 text-gold-accent border border-gold-accent/30 shadow-[inset_0_0_12px_-4px_rgba(212,175,55,0.5)]'
              : 'text-stone-400 hover:text-stone-100'
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Browse Collection
        </button>

        <button
          onClick={() => setMode('upload')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none cursor-pointer ${
            mode === 'upload'
              ? 'bg-stone-800 text-gold-accent border border-gold-accent/30 shadow-[inset_0_0_12px_-4px_rgba(212,175,55,0.5)]'
              : 'text-stone-400 hover:text-stone-100'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Your Own
        </button>

        <button
          onClick={() => setMode('link')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none cursor-pointer ${
            mode === 'link'
              ? 'bg-gradient-to-r from-gold-accent to-amber-500 text-stone-950 shadow-[0_0_20px_-4px_rgba(212,175,55,0.7)]'
              : 'text-stone-400 hover:text-stone-100'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Import from Link
        </button>
      </div>

      {/* Mode 1: Link Importer */}
      {mode === 'link' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left panel: URL input + Presets */}
          <div className="lg:col-span-7 space-y-4">
            <GlassPanel className="p-5 border-stone-800 bg-stone-900/90 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gold-accent" />
                  <span className="text-xs font-bold uppercase tracking-wide-luxe text-stone-100">
                    E-Commerce Product Link URL
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                  Myntra · Ajio · Amazon · Flipkart
                </span>
              </div>

              {/* URL Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExtractLink(linkInput, 0);
                }}
                className="relative flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://www.myntra.com/tshirts/..."
                    className="w-full rounded-xl border border-stone-700 bg-stone-950/90 px-4 py-3.5 pl-10 text-xs font-mono text-stone-100 placeholder-stone-500 focus:border-gold-accent focus:outline-none focus:ring-1 focus:ring-gold-accent/50 shadow-inner"
                  />
                  <LinkIcon className="absolute left-3.5 top-4 h-4 w-4 text-stone-400" />
                </div>

                <GlowButton
                  variant="gold"
                  type="submit"
                  disabled={isExtracting || !linkInput.trim()}
                  className="px-5 py-3.5 text-xs font-bold uppercase shrink-0"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-stone-950" />
                      Extract Garment
                    </>
                  )}
                </GlowButton>
              </form>

              {/* Error Message */}
              {extractError && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <div className="font-bold">Extraction Warning</div>
                    <div className="text-[11px] text-red-300/80 mt-0.5">{extractError}</div>
                  </div>
                </div>
              )}

              {/* Preset Link Chips */}
              <div className="mt-5 border-t border-stone-800/80 pt-4">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide-luxe text-stone-400 flex items-center justify-between">
                  <span>Quick Test Demo Links</span>
                  <span className="text-gold-accent">Click to auto-parse</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_LINKS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset.url)}
                      disabled={isExtracting}
                      className="group flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2 text-left transition-all duration-300 hover:border-gold-accent/50 hover:bg-stone-800/80 cursor-pointer"
                    >
                      <Store className="h-3.5 w-3.5 text-gold-accent shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-[11px] font-bold text-stone-200 group-hover:text-gold-accent transition-colors">
                          {preset.label}
                        </div>
                        <div className="text-[9px] text-stone-400 uppercase tracking-wider">
                          {preset.brand} · {preset.tag}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </GlassPanel>

            {/* How it works info card */}
            <GlassPanel className="p-4 border-stone-800 bg-stone-900/60 text-xs text-stone-400">
              <div className="flex items-center gap-2 text-gold-accent font-bold uppercase tracking-wide-luxe mb-1 text-[11px]">
                <Layers className="h-3.5 w-3.5" />
                Smart Link Parsing Engine
              </div>
              <p className="text-[11px] leading-relaxed text-stone-400">
                FitLabs extracts product images and metadata from the store page for virtual try-on.
                Myntra works best today; some sites block simple scrapers — see scraper notes in the repo.
                Prefer flat-lay / product-only photos over lifestyle model shots when choosing a view.
              </p>
            </GlassPanel>
          </div>

          {/* Right panel: Extracted Garment Card & Multi-View Picker */}
          <div className="lg:col-span-5">
            <GlassPanel className="relative h-full flex flex-col justify-between p-5 border-stone-800 bg-stone-900/90 shadow-2xl">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide-luxe text-stone-100 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-gold-accent" />
                    Extracted Garment Preview
                  </span>
                  {extractedData && (
                    <span className="rounded-full bg-gold-accent/15 border border-gold-accent/40 px-2.5 py-0.5 text-[9px] font-bold uppercase text-gold-accent tracking-wider">
                      {extractedData.site_name}
                    </span>
                  )}
                </div>

                {isExtracting ? (
                  <div className="flex aspect-[3/4] max-h-[380px] flex-col items-center justify-center rounded-2xl border border-stone-800 bg-stone-950 p-6 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-gold-accent mb-3" />
                    <div className="text-sm font-bold uppercase tracking-wide-luxe text-stone-100">
                      Scraping E-Commerce Store...
                    </div>
                    <div className="mt-1 text-xs text-stone-400">
                      Extracting high-resolution garment photo & specs
                    </div>
                  </div>
                ) : extractedData ? (
                  <div className="space-y-4">
                    {/* High-res Image Display */}
                    <div className="relative aspect-[3/4] max-h-[360px] overflow-hidden rounded-2xl bg-stone-950 p-2 flex items-center justify-center border border-gold-accent/30 shadow-inner group">
                      <img
                        src={extractedData.garment_url}
                        alt={extractedData.title}
                        className="h-full w-full object-contain drop-shadow-md"
                      />
                      <div className="absolute top-3 left-3 rounded-full bg-stone-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-gold-accent border border-gold-accent/40">
                        {extractedData.category}
                      </div>
                      <a
                        href={extractedData.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-stone-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-stone-300 hover:text-gold-accent border border-stone-700 transition-colors"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Multi-view image selector (if store provided multiple photos) */}
                    {extractedData.all_images.length > 1 && (
                      <div>
                        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide-luxe text-stone-400">
                          Select Garment View ({extractedData.all_images.length} available)
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {extractedData.all_images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleExtractLink(extractedData.source_url, idx)}
                              className={`relative h-14 w-12 shrink-0 rounded-lg overflow-hidden border transition-all duration-300 cursor-pointer ${
                                selectedImgIndex === idx
                                  ? 'border-gold-accent ring-2 ring-gold-accent/50 scale-105'
                                  : 'border-stone-800 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={imgUrl} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata details */}
                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wide-luxe text-gold-accent">
                        {extractedData.brand}
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-stone-100 line-clamp-2">
                        {extractedData.title}
                      </div>
                      {extractedData.price && (
                        <div className="mt-1 text-sm font-extrabold text-gold-accent font-mono">
                          {extractedData.price}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[3/4] max-h-[380px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-800 bg-stone-950/50 p-6 text-center">
                    <LinkIcon className="h-8 w-8 text-stone-600 mb-2" />
                    <div className="text-xs font-bold uppercase tracking-wide-luxe text-stone-400">
                      No Garment Extracted Yet
                    </div>
                    <div className="mt-1 text-[11px] text-stone-500 max-w-[200px]">
                      Paste a product link or click a preset link to extract clothing.
                    </div>
                  </div>
                )}
              </div>

              {/* Ready Status & Action */}
              {extractedData && (
                <div className="mt-4 pt-3 border-t border-stone-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gold-accent font-semibold">
                      <Check className="h-4 w-4" />
                      Ready for AI Try-On
                    </div>
                    <GlowButton variant="gold" onClick={onContinue} className="text-xs py-2 px-4">
                      Generate Try-On <Sparkles className="h-3.5 w-3.5 fill-stone-950" />
                    </GlowButton>
                  </div>
                </div>
              )}
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Mode 2: Curated Luxury Wardrobe */}
      {mode === 'curated' && (
        <>
          {/* Category tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide-luxe uppercase transition-all duration-300 cursor-pointer ${
                  category === c
                    ? 'border-gold-accent/60 bg-gold-accent/15 text-gold-accent shadow-[0_0_16px_-4px_rgba(212,175,55,0.4)]'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-100'
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
                    className={`group relative h-full cursor-pointer overflow-hidden p-0 border-stone-800 bg-stone-900/80 transition-all duration-500 ${
                      isSelected ? 'ring-2 ring-gold-accent shadow-[0_0_28px_-6px_rgba(212,175,55,0.6)]' : ''
                    }`}
                  >
                    <button onClick={() => selectGarment(g)} className="block w-full text-left cursor-pointer">
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
                          <div className="text-[10px] uppercase tracking-wide-luxe text-gold-accent/90">
                            {g.brand}
                          </div>
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

      {/* Mode 3: Upload Your Garment */}
      {mode === 'upload' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Upload zone */}
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
                className="flex w-full items-center justify-between rounded-xl border border-stone-800 bg-stone-900/60 p-4 text-left transition-all duration-300 hover:border-gold-accent/40 cursor-pointer"
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
      )}

      {/* Spacer so grid content is not hidden under the fixed CTA */}
      <div className="h-24" aria-hidden />

      {/* Viewport-pinned CTA — always discoverable; primary action enabled when ready */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4">
        <div className="pointer-events-auto mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950/95 px-5 py-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.85)] ring-1 ring-gold-accent/15 backdrop-blur-xl">
          <button
            onClick={onBack}
            className="text-xs uppercase tracking-wide-luxe text-stone-400 transition-colors hover:text-stone-100 cursor-pointer"
          >
            ← Back to Model
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-medium text-stone-400">
              {ready
                ? `Ready: ${extractedData?.title ? extractedData.title.slice(0, 30) + '…' : selectedGarment?.name ?? 'Uploaded Garment'}`
                : 'Browse, upload, or import a garment to continue'}
            </span>
            <GlowButton variant="gold" onClick={onContinue} disabled={!ready}>
              Continue to Neural Fitting
              <Sparkles className="h-4 w-4 fill-stone-950" />
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
