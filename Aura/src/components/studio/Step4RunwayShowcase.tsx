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
  // Use real AI result when available; otherwise fall back to preset angle image
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
    a.download = `voile-tryon-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleShare() {
    if (navigator.share && afterUrl) {
      navigator.share({ title: 'VOILE AI Try-On', url: afterUrl }).catch(() => {});
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
          className="relative mx-auto min-h-[380px] max-h-[55vh] sm:max-h-[70vh] w-full max-w-[500px] overflow-hidden rounded-2xl border border-white/10 bg-obsidian-surface shadow-2xl select-none"
        >
          {/* STATE 1: LOADING SKELETON */}
          {(isLoading || (imgLoading && (afterUrl || beforeUrl))) && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-obsidian-surface p-6 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cyan-aura/10 shadow-[0_0_30px_rgba(0,229,255,0.3)]">
                <Sparkles className="h-8 w-8 text-cyan-aura animate-spin-slow" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide-luxe text-white">
                Synthesizing AI Try-On…
              </p>
              <p className="mt-1 text-xs text-silver-muted">
                Rendering 4K photorealistic neural drape
              </p>
              <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-aura to-gold-aura animate-progress-shimmer" />
              </div>
            </div>
          )}

          {/* STATE 2: EMPTY / ERROR PLACEHOLDER */}
          {!isLoading && (imageError || (!afterUrl && !beforeUrl)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian-surface p-6 text-center">
              <AlertCircle className="h-10 w-10 text-gold-aura/80 mb-3" />
              <p className="text-sm font-semibold uppercase tracking-wide-luxe text-white">
                Fitting Result Ready Soon
              </p>
              <p className="mt-1 max-w-xs text-xs text-silver-muted">
                Select your model photo & garment in previous steps, then click "Generate AI Try-On".
              </p>
              <GlowButton variant="cyan" onClick={onRegenerate} className="mt-5">
                <RefreshCw className="h-4 w-4" />
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
                className="absolute inset-0 h-full w-full object-contain bg-obsidian cursor-zoom-in"
                style={hasRealResult ? {} : { filter: 'saturate(1.25) contrast(1.08) brightness(1.04) hue-rotate(8deg)' }}
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
                    className="absolute inset-0 h-full object-contain bg-obsidian cursor-zoom-in"
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
                  className="absolute inset-y-0 z-10 w-px cursor-ew-resize bg-white/70 shadow-[0_0_12px_rgba(0,229,255,0.8)]"
                  style={{ left: `${split}%` }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-md">
                    <Maximize2 className="h-4 w-4 rotate-90 text-obsidian" />
                  </div>
                </div>
              )}

              {/* Before/After labels */}
              <span className="pointer-events-none absolute bottom-14 left-3 z-20 rounded-full bg-obsidian/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide-luxe text-white backdrop-blur-sm">
                Before
              </span>
              <span className="pointer-events-none absolute bottom-14 right-3 z-20 rounded-full bg-cyan-aura/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide-luxe text-obsidian backdrop-blur-sm">
                After · AI
              </span>

              {/* Bottom floating pill — angle switchers + Fullscreen Zoom button */}
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/[0.14] bg-obsidian/70 p-1.5 backdrop-blur-xl">
                {!hasRealResult &&
                  ANGLES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAngle(a.id)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide-luxe transition-all duration-300 ${
                        angle === a.id
                          ? 'bg-white/[0.12] text-white shadow-[inset_0_0_12px_-4px_rgba(0,229,255,0.6)]'
                          : 'text-silver-muted hover:text-white'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                {!hasRealResult && <span className="mx-0.5 h-5 w-px bg-white/10" />}
                <button
                  onClick={() => setViewerOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-cyan-aura/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide-luxe text-cyan-aura transition-all duration-300 hover:bg-cyan-aura/25"
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
                  className={`pointer-events-none absolute h-5 w-5 rounded-[2px] border-cyan-aura/40 ${c}`}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* "YOU TRIED ON" GARMENT CHIP — confirms which garment was applied */}
      <div className="mx-auto mb-5 flex max-w-md items-center justify-between gap-3.5 rounded-2xl border border-cyan-aura/30 bg-obsidian-surface/90 px-4 py-3 shadow-[0_4px_20px_rgba(0,229,255,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          {garmentThumbnail ? (
            <img
              src={garmentThumbnail}
              alt={garmentName}
              className="h-11 w-11 shrink-0 rounded-xl border border-cyan-aura/50 object-cover shadow-md"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-aura/10 border border-cyan-aura/40 text-cyan-aura">
              <Shirt className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] font-bold uppercase tracking-wide-luxe text-cyan-aura">
                Equipped Garment
              </span>
              {garmentBrand && (
                <>
                  <span className="text-[10px] text-white/30">•</span>
                  <span className="text-[9.5px] uppercase tracking-wide-luxe text-gold-aura font-medium">
                    {garmentBrand}
                  </span>
                </>
              )}
            </div>
            <div className="truncate text-xs font-semibold text-white mt-0.5">
              {garmentName}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-cyan-aura/10 px-2.5 py-1 border border-cyan-aura/30 text-[10px] font-semibold text-cyan-aura uppercase tracking-wide-luxe">
          <Sparkles className="h-3 w-3 text-cyan-aura animate-glow-pulse" />
          Tried On
        </div>
      </div>

      {/* Action bar — below the image and chip */}
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3 px-4 pb-8">
        <GlowButton variant="cyan" onClick={handleDownload} disabled={!afterUrl}>
          <Download className="h-4 w-4" />
          4K Render
        </GlowButton>
        <GlowButton variant={justSaved ? 'gold' : 'ghost'} onClick={onSave} disabled={!afterUrl}>
          {justSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {justSaved ? 'Saved' : 'Save'}
        </GlowButton>
        <GlowButton variant="ghost" onClick={handleShare} disabled={!afterUrl}>
          <Share2 className="h-4 w-4" />
          Share
        </GlowButton>
        <GlowButton variant="outline" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4" />
          Re-Gen
        </GlowButton>
      </div>

      {/* FULL-SCREEN IMAGE VIEWER OVERLAY MODAL */}
      {viewerOpen && afterUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/95 backdrop-blur-2xl transition-all duration-300"
          onClick={() => {
            setViewerOpen(false);
            setZoomScale(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          {/* Top Controls */}
          <div
            className="absolute top-4 right-4 z-50 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] p-2 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomScale((z) => Math.min(4, z + 0.5))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-silver-muted hover:bg-white/10 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomScale((z) => Math.max(1, z - 0.5))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-silver-muted hover:bg-white/10 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoomScale(1);
                setPan({ x: 0, y: 0 });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-silver-muted hover:bg-white/10 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="h-4 w-px bg-white/10" />
            <button
              onClick={() => {
                setViewerOpen(false);
                setZoomScale(1);
                setPan({ x: 0, y: 0 });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-aura/20 text-cyan-aura hover:bg-cyan-aura/30"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image Viewport Container */}
          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden p-4 select-none"
            onWheel={handleWheel}
            onMouseDown={(e) => handlePanStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePanMove(e.clientX, e.clientY)}
            onMouseUp={handlePanEnd}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handlePanEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={afterUrl}
              alt="Full screen AI result"
              className="max-h-[90vh] max-w-[90vw] object-contain transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              draggable={false}
            />
          </div>

          {/* Hint Overlay at bottom */}
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-obsidian/70 px-4 py-1.5 text-xs text-silver-muted backdrop-blur-md">
            Scroll to zoom · Drag to pan · Press Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
