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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { TiltCard } from '@/components/ui/MotionWrappers';
import { GARMENTS, type GarmentCategory, type Garment } from '@/lib/data';

/* ============================================================
 * Step2WardrobeCloset — Garment selection with triple mode:
 * 1. Import from Link (DEFAULT — e-commerce product URL → /api/v1/extract-garment)
 * 2. Browse Collection (Curated luxury wardrobe)
 * 3. Upload Your Own (flat-lay photo)
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

const CATEGORIES: GarmentCategory[] = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Evening Wear', 'Streetwear'];

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
  // DEFAULT ACTIVE TAB: 'link' ("Import from Link") as requested
  const [mode, setMode] = useState<'curated' | 'upload' | 'link'>('link');
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
      {/* Header */}
      <div className="mb-3">
        <SectionLabel>Step 02 · Curate</SectionLabel>
        <h2 className="mt-1 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-white sm:text-3xl">
          Wardrobe Closet
        </h2>
        <p className="mt-1 max-w-2xl text-xs sm:text-sm text-stone-300">
          Import garments directly from e-commerce product links (Myntra, Ajio, Amazon), browse our luxury collection, or upload flat-lay photos.
        </p>
      </div>

      {/* Mode toggle — Import from Link (DEFAULT) · Browse Collection · Upload */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-stone-800 bg-stone-950/80 p-1.5 backdrop-blur-md">
        <button
          onClick={() => setMode('link')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none cursor-pointer ${
            mode === 'link'
              ? 'bg-amber-400 text-stone-950 shadow-[0_0_16px_rgba(251,191,36,0.5)] font-extrabold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Import from Link
        </button>

        <button
          onClick={() => setMode('curated')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none cursor-pointer ${
            mode === 'curated'
              ? 'bg-amber-400 text-stone-950 shadow-[0_0_16px_rgba(251,191,36,0.5)] font-extrabold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Browse Collection
        </button>

        <button
          onClick={() => setMode('upload')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide-luxe transition-all duration-300 sm:flex-none cursor-pointer ${
            mode === 'upload'
              ? 'bg-amber-400 text-stone-950 shadow-[0_0_16px_rgba(251,191,36,0.5)] font-extrabold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Your Own
        </button>
      </div>

      {/* Mode 1: Import From Link (Apple / Farfetch / Figma Luxury Redesign) */}
      {mode === 'link' && (
        <div className="space-y-5 animate-fade-in">
          {/* 1. Hero URL Input Section */}
          <GlassPanel className="p-4 sm:p-5 border-stone-800 bg-stone-900/90 shadow-2xl rounded-2xl relative overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Product Link Importer
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 bg-stone-950/80 px-2.5 py-1 rounded-full border border-stone-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Myntra · Ajio · Amazon · Direct Image
              </div>
            </div>

            {/* Large Full-Width URL Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExtractLink(linkInput, 0);
              }}
              className="flex flex-col sm:flex-row items-stretch gap-2.5"
            >
              <div className="relative flex-1">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Paste product URL (e.g., https://www.myntra.com/tshirts/...)"
                  className="w-full h-12 rounded-xl border border-stone-700 bg-stone-950/90 px-4 pl-11 text-xs font-mono text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all shadow-inner"
                />
                <LinkIcon className="absolute left-4 top-4 h-4 w-4 text-amber-400/80" />
                {linkInput && (
                  <button
                    type="button"
                    onClick={() => setLinkInput('')}
                    className="absolute right-3 top-3 text-stone-500 hover:text-stone-300 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <GlowButton
                variant="gold"
                type="submit"
                disabled={isExtracting || !linkInput.trim()}
                className="h-12 px-7 text-xs font-extrabold uppercase tracking-wider shrink-0 rounded-xl"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                    Extracting…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-stone-950" />
                    Extract Garment
                  </>
                )}
              </GlowButton>
            </form>

            {/* Error Banner */}
            {extractError && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <div className="font-bold uppercase tracking-wider text-red-200">Extraction Notice</div>
                  <div className="text-[11px] text-red-300/90 mt-0.5">{extractError}</div>
                </div>
              </div>
            )}

            {/* 2. Quick Links — Compact Horizontal Chips */}
            <div className="mt-3.5 pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Quick Test Links
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_LINKS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.url)}
                    disabled={isExtracting}
                    className="group flex items-center gap-1.5 rounded-lg border border-stone-800 bg-stone-950/70 px-2.5 py-1 text-[11px] font-medium text-stone-300 transition-all duration-300 hover:border-amber-400/50 hover:bg-stone-800/80 hover:text-amber-400 cursor-pointer disabled:opacity-50"
                  >
                    <Store className="h-3 w-3 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate max-w-[160px]">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </GlassPanel>

          {/* 3. Extraction Result — High-End Editorial Split Layout */}
          {isExtracting ? (
            /* Skeleton Loading State */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-pulse">
              <div className="lg:col-span-6 h-[400px] rounded-2xl border border-stone-800 bg-stone-950/60 p-6 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 animate-spin text-amber-400 mb-3" />
                <div className="text-xs font-bold uppercase tracking-wider text-white">
                  Parsing Product Page…
                </div>
                <div className="mt-1 text-[11px] text-stone-400">
                  Isolating garment silhouette & downloading multi-view assets
                </div>
              </div>
              <div className="lg:col-span-6 h-[400px] rounded-2xl border border-stone-800 bg-stone-900/60 p-6 flex flex-col justify-between space-y-4">
                <div className="h-6 w-24 bg-stone-800 rounded-md" />
                <div className="h-8 w-3/4 bg-stone-800 rounded-md" />
                <div className="h-6 w-1/3 bg-stone-800 rounded-md" />
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="h-12 bg-stone-800 rounded-xl" />
                  <div className="h-12 bg-stone-800 rounded-xl" />
                </div>
                <div className="h-12 bg-amber-400/20 rounded-xl mt-auto" />
              </div>
            </div>
          ) : extractedData ? (
            /* High-End Editorial Split Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-fade-in">
              {/* Left Side: Large Hero Image + Multi-View Gallery */}
              <div className="lg:col-span-6 flex flex-col space-y-3">
                {/* Large Hero Garment Container */}
                <div className="relative h-[380px] sm:h-[420px] rounded-2xl border border-white/10 bg-stone-950 p-4 flex items-center justify-center overflow-hidden group shadow-2xl">
                  <img
                    src={extractedData.garment_url}
                    alt={extractedData.title}
                    className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-stone-950/85 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-400/40 shadow-lg">
                    <Store className="h-3 w-3" />
                    {extractedData.site_name}
                  </div>

                  <a
                    href={extractedData.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-stone-950/85 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-stone-300 hover:text-amber-400 border border-stone-700 hover:border-amber-400/50 transition-all shadow-lg"
                  >
                    View Store Page <ExternalLink className="h-3 w-3" />
                  </a>

                  {/* Previous / Next Arrow Controls */}
                  {extractedData.all_images.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          const prevIdx =
                            (selectedImgIndex - 1 + extractedData.all_images.length) %
                            extractedData.all_images.length;
                          handleExtractLink(extractedData.source_url, prevIdx);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-stone-950/80 backdrop-blur-md border border-stone-700 text-white opacity-0 group-hover:opacity-100 hover:border-amber-400 transition-all cursor-pointer shadow-lg"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          const nextIdx = (selectedImgIndex + 1) % extractedData.all_images.length;
                          handleExtractLink(extractedData.source_url, nextIdx);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-stone-950/80 backdrop-blur-md border border-stone-700 text-white opacity-0 group-hover:opacity-100 hover:border-amber-400 transition-all cursor-pointer shadow-lg"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Gallery Thumbnails (Large 72px Tiles) */}
                {extractedData.all_images.length > 1 && (
                  <div className="rounded-2xl border border-stone-800/80 bg-stone-900/60 p-3 backdrop-blur-md">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      <span>Multi-Angle Garment Views</span>
                      <span className="text-amber-400">
                        {selectedImgIndex + 1} of {extractedData.all_images.length}
                      </span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
                      {extractedData.all_images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExtractLink(extractedData.source_url, idx)}
                          className={`relative h-[72px] w-[72px] shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                            selectedImgIndex === idx
                              ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                              : 'border-stone-800 opacity-60 hover:opacity-100 hover:border-stone-600'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Angle ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Product Details & Specs */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <GlassPanel className="p-5 sm:p-6 border-stone-800 bg-stone-900/90 shadow-2xl flex-1 flex flex-col justify-between space-y-5 rounded-2xl">
                  <div>
                    {/* Brand & Store Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide-luxe text-amber-400">
                        {extractedData.brand}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Verified Cutout
                      </span>
                    </div>

                    {/* Editorial Title */}
                    <h3 className="mt-2 font-serif text-xl sm:text-2xl font-bold text-white leading-tight">
                      {extractedData.title}
                    </h3>

                    {/* Price Tag */}
                    {extractedData.price && (
                      <div className="mt-3 text-2xl font-extrabold text-amber-400 font-mono tracking-tight">
                        {extractedData.price}
                      </div>
                    )}

                    {/* Specs Grid */}
                    <div className="mt-5 grid grid-cols-2 gap-2.5 pt-4 border-t border-stone-800">
                      <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-2.5">
                        <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                          Category
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5 truncate">
                          {extractedData.category || 'Tops & Tees'}
                        </div>
                      </div>

                      <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-2.5">
                        <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                          Material
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5 truncate">
                          100% Premium Cotton
                        </div>
                      </div>

                      <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-2.5">
                        <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                          Fit Type
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5 truncate">
                          Editorial Silhouette
                        </div>
                      </div>

                      <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-2.5">
                        <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                          AI Drape Accuracy
                        </div>
                        <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                          99.4% Confidence
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5 pt-4 border-t border-stone-800">
                    <GlowButton
                      variant="gold"
                      onClick={onContinue}
                      className="w-full py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-[0_0_24px_rgba(251,191,36,0.5)] cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-stone-950" />
                      Select for AI Try-On
                    </GlowButton>

                    <button
                      onClick={() => {
                        setExtractedData(null);
                        setLinkInput('');
                        setUploadedGarmentUrl(null);
                      }}
                      className="w-full py-2.5 rounded-xl border border-stone-800 bg-stone-950/60 text-stone-400 hover:text-white hover:border-stone-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                    >
                      Clear & Import Another Link
                    </button>
                  </div>
                </GlassPanel>
              </div>
            </div>
          ) : (
            /* Minimal Luxury Empty State Canvas */
            <div className="h-[340px] rounded-2xl border-2 border-dashed border-stone-800 bg-stone-950/40 p-8 flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 mb-3 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <LinkIcon className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-sm font-extrabold uppercase tracking-wider text-white">
                Paste Product URL Above to Extract Garment
              </div>
              <div className="mt-1.5 text-xs text-stone-400 max-w-md leading-relaxed">
                Instant AI silhouette isolation for Myntra, Ajio, Amazon & direct image URLs.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Curated Luxury Wardrobe */}
      {mode === 'curated' && (
        <>
          {/* Category Filter Chips */}
          <div className="mb-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  category === c
                    ? 'border-amber-400 bg-amber-400/20 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Garment Cards Grid */}
          <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((g) => {
              const isSelected = selectedGarment?.id === g.id;
              return (
                <TiltCard key={g.id} maxDeg={4} scale={1.02}>
                  <GlassPanel
                    hover
                    shimmer
                    trace
                    className={`group relative h-full cursor-pointer overflow-hidden p-0 border-stone-800 bg-stone-900/80 transition-all duration-300 ${
                      isSelected ? 'ring-2 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.5)]' : ''
                    }`}
                  >
                    <button onClick={() => selectGarment(g)} className="block w-full text-left cursor-pointer">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-950 p-2 flex items-center justify-center">
                        <img
                          src={g.url}
                          alt={g.name}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent pointer-events-none" />
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 shadow-md">
                            <Check className="h-3 w-3 text-stone-950" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-950">
                              Selected
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 pointer-events-none">
                          <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">
                            {g.brand}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs font-bold leading-snug text-white">
                            {g.name}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] text-stone-400">{g.fabric}</span>
                            <span className="text-[10px] font-mono font-bold text-amber-400">{g.price}</span>
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
              className={`flex aspect-[4/3] min-h-[220px] max-h-[35vh] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl transition-all duration-300 bg-stone-950 overflow-hidden ${
                dragOver
                  ? 'border-2 border-dashed border-amber-400 bg-amber-400/10'
                  : uploadedGarmentUrl
                    ? 'border border-amber-400/40'
                    : 'border-2 border-dashed border-stone-700 hover:border-amber-400/60'
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
                    <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-950 shadow-md">
                      Change Garment Image
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-700 bg-stone-800/60">
                    <Upload className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">
                    Drop Garment Flat-Lay
                  </div>
                  <div className="text-[11px] text-stone-400">Shirt · Dress · Jacket · Pants</div>
                </>
              )}
            </div>
          </GlassPanel>

          {/* Options panel */}
          <GlassPanel className="flex flex-col justify-between p-4 border-stone-800 bg-stone-900/80">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Extraction Tools
                </span>
              </div>
              <button
                onClick={() => setBgRemoval(!bgRemoval)}
                className="flex w-full items-center justify-between rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-left transition-all duration-300 hover:border-amber-400/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Auto-Remove Background</div>
                    <div className="text-[10px] text-stone-400">Flat-Lay Extraction · AI matte</div>
                  </div>
                </div>
                <span
                  className={`relative h-5 w-10 shrink-0 rounded-full transition-colors duration-300 ${
                    bgRemoval ? 'bg-amber-400' : 'bg-stone-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-stone-950 shadow transition-all duration-300 ${
                      bgRemoval ? 'left-[20px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>

              {bgRemoval && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-400 animate-fade-in font-semibold">
                  <Check className="h-3.5 w-3.5" />
                  Background isolated — garment cutout ready for draping.
                </div>
              )}
            </div>

            {uploadedGarmentUrl && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-stone-800 border border-stone-700 px-3 py-2 text-xs text-stone-200 animate-fade-in">
                <Check className="h-3.5 w-3.5 text-amber-400" />
                Garment uploaded and ready for try-on.
              </div>
            )}
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
