import { useEffect, useState, useRef } from 'react';
import {
  Wand2,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Clock,
  Zap,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';

/* ============================================================
 * Step3NeuralFitting — Real asynchronous backend pipeline integration.
 * Submits model & garment images to FastAPI `/api/v1/try-on`,
 * polls job status every 2 seconds, and displays live progress logs.
 * Includes smart error handling for GPU quota limits.
 * Uses warm gold luxury aesthetic and object-contain image display.
 * ============================================================ */

const API_BASE = 'http://localhost:8000';

interface Step3NeuralFittingProps {
  modelImageUrl: string | null;
  garmentImageUrl: string | null;
  garmentName: string;
  onComplete: (resultUrl: string) => void;
  onBack: () => void;
  onForceRegenerate?: () => void;
}

async function fetchImageBlob(url: string): Promise<Blob> {
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to read local image blob (${res.status})`);
    return await res.blob();
  }

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return await res.blob();
  } catch {
    // Fall back to image object + canvas conversion if standard fetch is blocked
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context creation failed'));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert image to Blob payload'));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => reject(new Error(`Unable to load image payload from ${url}`));
    img.src = url;
  });
}

export function Step3NeuralFitting({
  modelImageUrl,
  garmentImageUrl,
  garmentName,
  onComplete,
  onBack,
  onForceRegenerate,
}: Step3NeuralFittingProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Neural Engine...');
  const [logs, setLogs] = useState<string[]>([]);
  const [scanPos, setScanPos] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cachedResultUrl, setCachedResultUrl] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartRef = useRef<number>(0);

  // Scanline animation loop
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setScanPos((prev) => (prev >= 98 ? 0 : prev + 2));
    }, 40);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Main API job execution effect
  useEffect(() => {
    let cancelled = false;

    async function runFittingPipeline() {
      if (!modelImageUrl || !garmentImageUrl) {
        setErrorMsg('Missing model or garment image. Please go back and select both.');
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      pollStartRef.current = Date.now();
      setErrorMsg(null);
      setProgress(5);
      setStatusText('Preparing image payloads...');
      setLogs(['[FITMIRRORS ENGINE] Initializing virtual try-on session...']);

      try {
        // Step A: Fetch blob files from object URLs safely
        setLogs((prev) => [...prev, '[PAYLOAD] Fetching model and garment image blobs...']);
        const modelBlob = await fetchImageBlob(modelImageUrl);
        const garmentBlob = await fetchImageBlob(garmentImageUrl);

        // Step B: Submit multipart form to /api/v1/try-on
        setLogs((prev) => [...prev, '[API] Transmitting request to FastAPI backend...']);
        const formData = new FormData();
        formData.append('model_image', modelBlob, 'model.jpg');
        formData.append('garment_image', garmentBlob, 'garment.jpg');
        formData.append('category', 'upper_body');

        let submitRes: Response;
        try {
          submitRes = await fetch(`${API_BASE}/api/v1/try-on`, {
            method: 'POST',
            body: formData,
          });
        } catch (netErr: any) {
          throw new Error('Failed to connect to backend server. Make sure uvicorn backend is running on http://localhost:8000.');
        }

        if (!submitRes.ok) {
          const errData = await submitRes.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned status ${submitRes.status}`);
        }

        const submitData = await submitRes.json();
        const jobId = submitData.job_id;
        const cached = submitData.cached || false;

        setLogs((prev) => [
          ...prev,
          `[JOB ENQUEUED] Job ID: ${jobId.slice(0, 8)}... (${cached ? 'CACHED' : 'QUEUED'})`,
        ]);
        setProgress(20);

        // Step C: Poll job status until completed or failed
        // Backend statuses (source of truth — main.py / tasks.py):
        //   "pending" → "validating" → "processing" → "completed" | "failed"
        const POLL_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes max

        const pollJob = async () => {
          if (cancelled) return;

          // Timeout: if polling exceeds ceiling, stop and surface a clear error
          const elapsedMs = Date.now() - pollStartRef.current;
          if (elapsedMs > POLL_TIMEOUT_MS) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setErrorMsg(
              'This is taking longer than expected (>4 min). The HF Space may be cold-starting ' +
              'or under heavy load. Please retry — the Space should be warmed up now.'
            );
            setIsProcessing(false);
            return;
          }

          try {
            const statusRes = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
            if (!statusRes.ok) return;

            const statusData = await statusRes.json();
            const currentStatus = statusData.status;

            if (currentStatus === 'pending' || currentStatus === 'validating') {
              setStatusText(statusData.progress_message || 'Job queued in worker pipeline...');
              setProgress((p) => Math.min(p + 3, 35));
            } else if (currentStatus === 'processing') {
              setStatusText(statusData.progress_message || 'AI inference in progress...');
              // Smoothly animate progress from 35→90 over polling cycles
              setProgress((p) => Math.min(p + 4, 90));
              setLogs((prev) => {
                const msg = `[INFERENCE] ${statusData.progress_message || 'Processing...'}`;
                const last = prev[prev.length - 1];
                return last === msg ? prev : [...prev, msg];
              });
            } else if (currentStatus === 'completed') {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setProgress(100);
              setStatusText('Synthesis complete!');
              setIsProcessing(false);

              const resultUrl = statusData.result_image_url
                ? `${API_BASE}${statusData.result_image_url}`
                : `${API_BASE}/api/v1/jobs/${jobId}/result`;

              setLogs((prev) => [...prev, '[SUCCESS] Photorealistic drape synthesis complete!']);

              if (cached) {
                setIsCached(true);
                setCachedResultUrl(resultUrl);
              } else {
                setTimeout(() => {
                  if (!cancelled) onComplete(resultUrl);
                }, 800);
              }
            } else if (currentStatus === 'failed') {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              throw new Error(statusData.error_message || 'AI inference process failed.');
            } else {
              // Unknown status — fail loudly so drift is caught immediately
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              throw new Error(
                `Backend returned unexpected job status "${currentStatus}". ` +
                'The frontend may be out of sync with the API — please check for updates.'
              );
            }
          } catch (err: any) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setErrorMsg(err.message || 'Polling error occurred');
            setIsProcessing(false);
          }
        };

        // Start polling every 2 seconds
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(pollJob, 2000);
        pollJob(); // Immediate first check
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Failed to submit try-on job');
          setIsProcessing(false);
        }
      }
    }

    runFittingPipeline();

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [modelImageUrl, garmentImageUrl]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 text-center">
        <SectionLabel>Step 03 · Synthesize</SectionLabel>
        <h2 className="mt-2 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-stone-100 sm:text-3xl">
          Neural Fitting Room
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-stone-400">
          Draping <span className="text-gold-accent font-semibold">{garmentName}</span> onto your model with
          latent diffusion synthesis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Scan viewport — full image boundary display with object-contain */}
        <GlassPanel className="relative overflow-hidden p-0 border-stone-800 bg-stone-900/80">
          <div className="relative flex aspect-[3/4] max-h-[520px] items-center justify-center overflow-hidden rounded-2xl bg-stone-950 p-2 sm:aspect-[16/11]">
            {modelImageUrl ? (
              <img
                src={modelImageUrl}
                alt="Model under scan"
                className="h-full w-full object-contain drop-shadow-md"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                No model image
              </div>
            )}

            {/* Sweeping laser scan line + particle trail — Gold */}
            {isProcessing && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-px"
                  style={{
                    top: `${scanPos}%`,
                    background: 'linear-gradient(90deg, transparent, #E8C468 50%, transparent)',
                    boxShadow:
                      '0 0 22px 4px rgba(212,175,55,0.85), 0 0 60px 10px rgba(212,175,55,0.35)',
                    transition: 'top 0.1s linear',
                  }}
                />
                <div
                  className="absolute inset-0 opacity-20 mix-blend-screen"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(212,175,55,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.18) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />
              </div>
            )}

            {/* Corner HUD brackets */}
            {['left-3 top-3 border-l-2 border-t-2', 'right-3 top-3 border-r-2 border-t-2', 'left-3 bottom-3 border-l-2 border-b-2', 'right-3 bottom-3 border-r-2 border-b-2'].map(
              (c) => (
                <span
                  key={c}
                  className={`absolute h-6 w-6 rounded-[2px] border-gold-accent/60 ${c}`}
                />
              ),
            )}

            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-stone-950/80 px-3 py-1.5 backdrop-blur-md border border-gold-accent/40 z-10">
              <Cpu className="h-3.5 w-3.5 text-gold-accent animate-glow-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wide-luxe text-gold-accent">
                {isProcessing ? 'Synthesizing (Live Inference)' : errorMsg ? 'Inference Error' : 'Complete'}
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Terminal + Progress / Error View */}
        <GlassPanel className="flex flex-col gap-5 p-5 border-stone-800 bg-stone-900/80">
          {errorMsg ? (
            /* ─── Structured Error State UI ─── */
            <ErrorDisplay errorMsg={errorMsg} onBack={onBack} />
          ) : (
            /* Active Progress UI */
            <>
              <div className="flex flex-col items-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg width="112" height="112" className="-rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="url(#fitGrad)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 - (progress / 100) * 2 * Math.PI * 48}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }}
                    />
                    <defs>
                      <linearGradient id="fitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E8C468" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    {isCached ? (
                      <CheckCircle2 className="h-7 w-7 text-gold-accent" />
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-stone-100">{Math.round(progress)}%</span>
                        <Wand2 className="mt-0.5 h-3.5 w-3.5 text-gold-accent animate-glow-pulse" />
                      </>
                    )}
                  </div>
                </div>
                <span className="mt-2 text-[11px] uppercase tracking-wide-luxe text-gold-accent font-semibold">
                  {statusText}
                </span>

                {isCached && cachedResultUrl && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <GlowButton
                      variant="gold"
                      onClick={() => onComplete(cachedResultUrl)}
                      className="text-xs"
                    >
                      View Result →
                    </GlowButton>
                    {onForceRegenerate && (
                      <GlowButton
                        variant="ghost"
                        onClick={onForceRegenerate}
                        className="text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-Generate
                      </GlowButton>
                    )}
                  </div>
                )}
              </div>

              {/* Live Terminal Log */}
              <div className="flex-1 min-h-[160px] rounded-xl border border-stone-800 bg-stone-950/80 p-3.5 font-mono">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400/70" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                  <span className="h-2 w-2 rounded-full bg-gold-accent/70" />
                  <span className="ml-2 text-[10px] uppercase tracking-wide-luxe text-stone-400">
                    fitlabs · real-time inference log
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="text-[10.5px] leading-relaxed text-gold-accent/90">
                      <span className="text-stone-500">▸</span> {log}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="text-[10.5px] text-amber-300 animate-pulse">
                      ▸ Waiting for model output from backend...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

/* ============================================================
 * ErrorDisplay — Smart error card with parsed context.
 * Detects quota errors vs generic failures and shows
 * specific actionable guidance.
 * ============================================================ */

function parseError(msg: string) {
  const isQuota =
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('zerogpu') ||
    msg.toLowerCase().includes('exceeded');

  const waitMatch = msg.match(/(?:try again in|resets in)\s+(\d+:\d+:\d+)/i);
  const waitTime = waitMatch ? waitMatch[1] : null;

  const needsToken =
    msg.includes('[ACTION]') ||
    msg.toLowerCase().includes('hf_token') ||
    msg.toLowerCase().includes('authenticate');

  const hasToken = msg.toLowerCase().includes('already authenticated');

  return { isQuota, waitTime, needsToken, hasToken };
}

function ErrorDisplay({ errorMsg, onBack }: { errorMsg: string; onBack: () => void }) {
  const { isQuota, waitTime, needsToken, hasToken } = parseError(errorMsg);

  if (isQuota) {
    return (
      <div className="flex flex-col gap-4 p-4 my-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wide-luxe text-amber-400">
            GPU Quota Exhausted
          </h3>
          <p className="mt-1.5 text-xs text-stone-400 leading-relaxed max-w-sm">
            The free Hugging Face ZeroGPU quota for today has been used up.
            Each try-on request reserves ~60s of GPU time from a shared pool.
          </p>
        </div>

        {/* Wait time card */}
        {waitTime && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide-luxe text-amber-300">
                Quota Resets In
              </div>
              <div className="text-lg font-bold text-stone-100 font-mono tracking-wider">
                {waitTime}
              </div>
            </div>
          </div>
        )}

        {/* Actionable guidance cards */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide-luxe text-gold-accent">
            What You Can Do
          </div>

          {needsToken && !hasToken && (
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-gold-accent/30 bg-gold-accent/[0.06] px-4 py-3 transition-all hover:border-gold-accent/60 hover:bg-gold-accent/[0.1] group"
            >
              <Zap className="h-5 w-5 shrink-0 text-gold-accent mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-stone-100">
                  Add a HF Token → 8× More Quota
                </div>
                <div className="mt-0.5 text-[10.5px] leading-relaxed text-stone-400">
                  Create a free token at huggingface.co/settings/tokens and add it as{' '}
                  <code className="rounded bg-stone-800 px-1 py-0.5 text-gold-accent font-mono text-[9.5px]">
                    HF_TOKEN
                  </code>{' '}
                  in your backend <code className="rounded bg-stone-800 px-1 py-0.5 text-gold-accent font-mono text-[9.5px]">.env</code> file.
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-gold-accent mt-0.5" />
            </a>
          )}

          {hasToken && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-stone-100">
                  Consider HF Pro ($9/mo)
                </div>
                <div className="mt-0.5 text-[10.5px] leading-relaxed text-stone-400">
                  You're authenticated but exceeded even the token quota.
                  HF Pro gives significantly more daily GPU time and priority queue access.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-stone-400 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-stone-100">
                Wait for Quota Reset
              </div>
              <div className="mt-0.5 text-[10.5px] leading-relaxed text-stone-400">
                {waitTime
                  ? `Come back in ${waitTime} when the daily quota resets automatically.`
                  : 'Quota resets 24 hours after your first GPU usage of the day.'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <GlowButton variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Wardrobe
          </GlowButton>
        </div>
      </div>
    );
  }

  /* ── Generic Error Fallback ── */
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center my-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wide-luxe text-red-400">
        Synthesis Failed
      </h3>
      <p className="mt-2 text-xs text-stone-400 leading-relaxed max-w-xs">
        {errorMsg}
      </p>
      <div className="mt-5 flex gap-2">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Wardrobe
        </GlowButton>
        <GlowButton variant="gold" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Retry Job
        </GlowButton>
      </div>
    </div>
  );
}
