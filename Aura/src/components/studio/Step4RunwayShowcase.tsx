import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, RefreshCw, Maximize2, Bookmark, Check, Sparkles, AlertCircle, Shirt, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';
import { type AngleId } from '@/lib/data';

/* ============================================================
 * Step4RunwayShowcase — Reveal workspace with:
 * 1. Dynamic Natural Aspect-Ratio Sizing (max-h-[70vh] desktop /
 *    max-h-[55vh] mobile with object-contain safety net).
 * 2. Full-Screen Image Viewer Modal replacing old fixed loupe:
 *    - Click/tap opens full-screen overlay.
 *    - Desktop: mouse wheel zoom + drag pan.
 *    - Mobile: touch pan & pinch zoom.
 * 3. "You Tried On" Garment Chip below the image frame.
 * 4. Warm Gold Luxury styling.
 * ============================================================ */

interface Step4RunwayShowcaseProps {
  beforeUrl: string;
  afterUrls: Record<AngleId, string>;
  realResultUrl?: string | null;
  garmentThumbnail?: string | null;
  garmentName?: string;
  garmentBrand?: string;
  isLoading?: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  justSaved?: boolean;
}

const ANGLES: { id: AngleId; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'side', label: '3/4' },
  { id: 'detail', label: 'Detail' },
];

export function Step4RunwayShowcase({
  beforeUrl,
  afterUrls,
  realResultUrl,
  garmentThumbnail,
  garmentName = 'selected garment',
  garmentBrand,
  isLoading = false,
  onSave,
  onRegenerate,
  justSaved,
}: Step4RunwayShowcaseProps) {
  const [angle, setAngle] = useState<AngleId>('front');
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [imgLoading, setImgLoading] = useState(true);

  /* Full-Screen Zoom Viewer Modal State */
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement | null>(null);

  const hasRealResult = Boolean(realResultUrl);
  const afterUrl = realResultUrl || afterUrls[angle];

  /* Dynamic natural aspect ratio detection */
  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
    setImgLoading(false);
  }

  /* ---- Split slider scoped to frame bounds ---- */
  const updateSplit = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(2, Math.min(98, pct)));
  }, []);

  // Global pointer listeners for smooth split drag
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => updateSplit(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, updateSplit]);

  /* Keyboard Esc listener for Full-Screen Viewer */
  useEffect(() => {
    if (!viewerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewerOpen(false);
        setZoomScale(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewerOpen]);

  /* Fullscreen Mouse Wheel Zoom */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoomScale((prev) => Math.min(4, Math.max(1, prev + delta)));
  };

  /* Fullscreen Pan Handlers */
  const handlePanStart = (clientX: number, clientY: number) => {
    if (zoomScale <= 1) return;
    setIsPanning(true);
    startPanRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (!isPanning || zoomScale <= 1) return;
    setPan({
      x: clientX - startPanRef.current.x,
      y: clientY - startPanRef.current.y,
    });
  };

  const handlePanEnd = () => setIsPanning(false);

  /* ---- Action handlers ---- */
  function handleDownload() {
    if (!afterUrl) return;
    const a = document.createElement('a');
    a.href = afterUrl;
    a.download = `fitlabs-tryon-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleShare() {
    if (navigator.share && afterUrl) {
      navigator.share({ title: 'FitLabs AI Try-On', url: afterUrl }).catch(() => {});
    } else if (afterUrl) {
      navigator.clipboard.writeText(afterUrl);
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Eyebrow — above the frame */}
      <div className="mb-4 flex items-center justify-center gap-2 px-4 pt-2">
        <SectionLabel>Step 04 · Reveal</SectionLabel>
      </div>

      {/* Frame Container — Dynamic Natural Aspect-Ratio Sizing */}
      <div className="flex w-full justify-center px-4 pb-4">
        <div
          ref={frameRef}
          style={{
            aspectRatio: aspectRatio ? `${aspectRatio}` : '3/4',
          }}
          className="relative mx-auto min-h-[380px] max-h-[55vh] sm:max-h-[70vh] w-full max-w-[500px] overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl select-none"
        >
          {/* STATE 1: LOADING SKELETON */}
          {(isLoading || (imgLoading && (afterUrl || beforeUrl))) && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950 p-6 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gold-accent/10 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                <Sparkles className="h-8 w-8 text-gold-accent animate-spin-slow" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide-luxe text-stone-100">
                Synthesizing AI Try-On…
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Rendering 4K photorealistic neural drape
              </p>
              <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-stone-800">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-accent to-amber-400 animate-progress-shimmer" />
              </div>
            </div>
          )}

          {/* STATE 2: EMPTY / ERROR PLACEHOLDER */}
          {!isLoading && (imageError || (!afterUrl && !beforeUrl)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-gold-accent/80 mb-3" />
              <p className="text-sm font-semibold uppercase tracking-wide-luxe text-stone-100">
                Fitting Result Ready Soon
              </p>
              <p className="mt-1 max-w-xs text-xs text-stone-400">
                Select your model photo & garment in previous steps, then click "Generate AI Try-On".
              </p>
              <GlowButton variant="gold" onClick={onRegenerate} className="mt-5">
                <RefreshCw className="h-4 w-4 fill-stone-950" />
                Return to Fitting
              </GlowButton>
            </div>
          )}

          {/* STATE 3: SUCCESS (BEFORE / AFTER SLIDER) */}
          {!isLoading && !imageError && (afterUrl || beforeUrl) && (
            <>
              {/* AFTER layer (full) */}
              <img
                src={afterUrl || beforeUrl}
                alt="AI try-on result"
                onLoad={handleImageLoad}
                onError={() => setImageError(true)}
                className="absolute inset-0 h-full w-full object-contain bg-stone-950 cursor-zoom-in"
                style={hasRealResult ? {} : { filter: 'saturate(1.25) contrast(1.08) brightness(1.04)' }}
                onClick={() => setViewerOpen(true)}
                draggable={false}
              />

              {/* BEFORE layer (clipped to split position) */}
              {beforeUrl && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${split}%` }}
                >
                  <img
                    src={beforeUrl}
                    alt="Original photo"
                    className="absolute inset-0 h-full object-contain bg-stone-950 cursor-zoom-in"
                    style={{
                      width: frameRef.current ? `${frameRef.current.getBoundingClientRect().width}px` : '100%',
                      maxWidth: 'none',
                    }}
                    onClick={() => setViewerOpen(true)}
                    draggable={false}
                  />
                </div>
              )}

              {/* Divider handle */}
              {beforeUrl && (
                <div
                  className="absolute inset-y-0 z-10 w-px cursor-ew-resize bg-gold-accent/80 shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                  style={{ left: `${split}%` }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-stone-900 border border-gold-accent/60 shadow-lg backdrop-blur-md">
                    <Maximize2 className="h-4 w-4 rotate-90 text-gold-accent" />
                  </div>
                </div>
              )}

              {/* Before/After labels */}
              <span className="pointer-events-none absolute bottom-14 left-3 z-20 rounded-full bg-stone-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide-luxe text-stone-300 backdrop-blur-sm border border-stone-800">
                Before
              </span>
              <span className="pointer-events-none absolute bottom-14 right-3 z-20 rounded-full bg-gold-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide-luxe text-stone-950 backdrop-blur-sm shadow-md">
                After · AI
              </span>

              {/* Bottom floating pill — angle switchers + Fullscreen Zoom button */}
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-stone-800 bg-stone-950/85 p-1.5 backdrop-blur-xl">
                {!hasRealResult &&
                  ANGLES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAngle(a.id)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide-luxe transition-all duration-300 ${
                        angle === a.id
                          ? 'bg-stone-800 text-gold-accent border border-gold-accent/30'
                          : 'text-stone-400 hover:text-stone-100'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                {!hasRealResult && <span className="mx-0.5 h-5 w-px bg-stone-800" />}
                <button
                  onClick={() => setViewerOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-gold-accent/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide-luxe text-gold-accent transition-all duration-300 hover:bg-gold-accent/25"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  Full Screen
                </button>
              </div>

              {/* Corner HUD brackets */}
              {[
                'left-2 top-2 border-l-2 border-t-2',
                'right-2 top-2 border-r-2 border-t-2',
                'left-2 bottom-2 border-l-2 border-b-2',
                'right-2 bottom-2 border-r-2 border-b-2',
              ].map((c) => (
                <span
                  key={c}
                  className={`pointer-events-none absolute h-5 w-5 rounded-[2px] border-gold-accent/40 ${c}`}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Spacer for fixed action bar */}
      <div className="h-20" aria-hidden />

      {/* Viewport-pinned result actions — Save / Try Another always visible */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4">
        <div className="pointer-events-auto mx-auto flex max-w-[560px] items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950/95 px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.85)] ring-1 ring-gold-accent/15 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            {garmentThumbnail ? (
              <img
                src={garmentThumbnail}
                alt={garmentName}
                className="h-9 w-9 shrink-0 rounded-lg border border-stone-800 bg-stone-950 object-contain p-1"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-gold-accent">
                <Shirt className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-[10px] uppercase tracking-wide-luxe text-gold-accent">
                {garmentBrand || 'FitLabs AI'}
              </div>
              <div className="truncate text-xs font-semibold text-stone-100">{garmentName}</div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onSave}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-300 cursor-pointer ${
                justSaved
                  ? 'border-gold-accent bg-gold-accent/20 text-gold-accent'
                  : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-gold-accent/40 hover:text-stone-100'
              }`}
            >
              {justSaved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span>{justSaved ? 'Saved' : 'Save'}</span>
            </button>
            <GlowButton variant="gold" onClick={onRegenerate}>
              <RefreshCw className="h-3.5 w-3.5 fill-stone-950" />
              <span className="hidden sm:inline">Try Another</span>
            </GlowButton>
          </div>
        </div>
      </div>

      {/* Full-Screen Zoom Viewer Modal */}
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 backdrop-blur-2xl animate-fade-in">
          {/* Modal Header */}
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900/80 px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-gold-accent" />
              <span className="text-xs font-semibold uppercase tracking-wide-luxe text-stone-200">
                FitLabs 4K Inspector
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomScale((prev) => Math.min(4, prev + 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/80 text-stone-300 hover:text-gold-accent"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale((prev) => Math.max(1, prev - 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/80 text-stone-300 hover:text-gold-accent"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/80 text-stone-300 hover:text-gold-accent"
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setViewerOpen(false);
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/80 text-stone-300 hover:text-white"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Content / Canvas Area */}
          <div
            className="h-full w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-8"
            onWheel={handleWheel}
            onMouseDown={(e) => handlePanStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePanMove(e.clientX, e.clientY)}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
          >
            <img
              src={afterUrl || beforeUrl}
              alt="Full resolution result"
              className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-100 ease-out select-none drop-shadow-2xl"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
              }}
              draggable={false}
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-stone-800 bg-stone-900/80 px-5 py-2 backdrop-blur-md">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide-luxe text-stone-300 hover:text-gold-accent"
            >
              <Download className="h-4 w-4" />
              Download High-Res
            </button>
            <span className="h-4 w-px bg-stone-800" />
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide-luxe text-stone-300 hover:text-gold-accent"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
