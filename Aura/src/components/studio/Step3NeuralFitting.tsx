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
 * Step3NeuralFitting — Right Panel Controls for Neural Fitting
 * Submits model & garment images to FastAPI `/api/v1/try-on`,
 * polls job status every 2s, displays live progress ring & logs.
 * ============================================================ */

const API_BASE = 'http://localhost:8000';

/**
 * Module-level try-on registry — survives React StrictMode remounts.
 * In dev, StrictMode mounts → unmounts → remounts and re-runs effects.
 * Without this, two POSTs hit the free HF ZeroGPU Space at once
 * (timeouts + AcceleratorError). Refs reset on remount; this does not.
 */
type InflightTryOn = {
  startedAt: number;
  jobId: string | null;
  /** Resolves with jobId once the first mount finishes POSTing. */
  ready: Promise<string>;
  resolveReady: (jobId: string) => void;
  rejectReady: (err: Error) => void;
};
const inflightTryOns = new Map<string, InflightTryOn>();
const TRYON_DEDUPE_MS = 120_000; // same model+garment within 2 min reuses job

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

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context creation failed');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(createFallbackBlob('Garment Payload'));
        }, 'image/jpeg', 0.92);
      } catch {
        resolve(createFallbackBlob('Garment Payload'));
      }
    };
    img.onerror = () => {
      resolve(createFallbackBlob('Garment Payload'));
    };
    img.src = url;
  });
}

function createFallbackBlob(label: string): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, 800, 1000);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(label, 260, 500);
  }
  let resultBlob: Blob = new Blob([], { type: 'image/jpeg' });
  canvas.toBlob((b) => {
    if (b) resultBlob = b;
  }, 'image/jpeg', 0.9);
  return resultBlob;
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
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cachedResultUrl, setCachedResultUrl] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartRef = useRef<number>(0);

  // Main API job execution effect
  useEffect(() => {
    let cancelled = false;

    function startPolling(jobId: string, cached: boolean) {
      const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 min — HF cold start + queue

      const pollJob = async () => {
        if (cancelled) return;

        const elapsedMs = Date.now() - pollStartRef.current;
        if (elapsedMs > POLL_TIMEOUT_MS) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setErrorMsg(
            'This is taking longer than expected (>5 min). The HF Space may be cold-starting ' +
              'or under heavy load. Please retry — the Space should be warmed up now.'
          );
          setIsProcessing(false);
          return;
        }

        try {
          let statusRes: Response;
          try {
            statusRes = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
          } catch {
            throw new Error(
              'Lost connection to backend server. Make sure FastAPI backend is running on http://localhost:8000.'
            );
          }

          if (statusRes.status === 404) {
            throw new Error(
              'Job session expired or backend server was restarted. Click "Retry Job" below to restart synthesis.'
            );
          }

          if (!statusRes.ok) {
            const errData = await statusRes.json().catch(() => ({}));
            throw new Error(errData.detail || `Server returned error status ${statusRes.status}`);
          }

          const statusData = await statusRes.json();
          const currentStatus = statusData.status;

          if (currentStatus === 'pending' || currentStatus === 'validating') {
            setStatusText(statusData.progress_message || 'Job queued in worker pipeline...');
            setProgress((p) => Math.min(p + 3, 35));
          } else if (currentStatus === 'processing') {
            setStatusText(statusData.progress_message || 'AI inference in progress...');
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
            // Drop registry entry so a later Re-Generate can POST again
            if (modelImageUrl && garmentImageUrl) {
              inflightTryOns.delete(`${modelImageUrl}::${garmentImageUrl}`);
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
            if (modelImageUrl && garmentImageUrl) {
              inflightTryOns.delete(`${modelImageUrl}::${garmentImageUrl}`);
            }
            throw new Error(statusData.error_message || 'AI inference process failed.');
          } else {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            throw new Error(`Unexpected job status "${currentStatus}".`);
          }
        } catch (err: any) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          if (!cancelled) {
            setErrorMsg(err.message || 'Polling error occurred');
            setIsProcessing(false);
          }
        }
      };

      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(pollJob, 2000);
      pollJob();
    }

    async function runFittingPipeline() {
      if (!modelImageUrl || !garmentImageUrl) {
        setErrorMsg('Missing model or garment image. Please go back and select both.');
        setIsProcessing(false);
        return;
      }

      const submitKey = `${modelImageUrl}::${garmentImageUrl}`;
      const now = Date.now();
      const existing = inflightTryOns.get(submitKey);

      setIsProcessing(true);
      pollStartRef.current = Date.now();
      setErrorMsg(null);
      setProgress(5);
      setStatusText('Preparing image payloads...');
      setLogs(['[FITLABS ENGINE] Initializing virtual try-on session...']);

      try {
        // StrictMode remount / double-click: attach to the already-submitted job
        if (existing && now - existing.startedAt < TRYON_DEDUPE_MS) {
          setLogs((prev) => [
            ...prev,
            '[GUARD] Reusing in-flight try-on (duplicate submit blocked).',
          ]);
          setStatusText('Connecting to in-flight job…');
          setProgress(20);
          const jobId = existing.jobId ?? (await existing.ready);
          if (cancelled) return;
          setLogs((prev) => [
            ...prev,
            `[JOB ATTACHED] Job ID: ${jobId.slice(0, 8)}...`,
          ]);
          startPolling(jobId, false);
          return;
        }

        let resolveReady!: (jobId: string) => void;
        let rejectReady!: (err: Error) => void;
        const ready = new Promise<string>((resolve, reject) => {
          resolveReady = resolve;
          rejectReady = reject;
        });
        // Prevent unhandled rejection if first mount aborts before resolve
        ready.catch(() => {});
        inflightTryOns.set(submitKey, {
          startedAt: now,
          jobId: null,
          ready,
          resolveReady,
          rejectReady,
        });

        // Step A: Fetch blob files
        setLogs((prev) => [...prev, '[PAYLOAD] Fetching model and garment image blobs...']);
        const modelBlob = await fetchImageBlob(modelImageUrl);
        const garmentBlob = await fetchImageBlob(garmentImageUrl);

        // Step B: Submit multipart form to /api/v1/try-on
        // Continue even if StrictMode cancelled — second mount will attach via ready.
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
        } catch {
          const err = new Error(
            'Failed to connect to backend server. Make sure uvicorn backend is running on http://localhost:8000.'
          );
          inflightTryOns.delete(submitKey);
          rejectReady(err);
          throw err;
        }

        if (!submitRes.ok) {
          const errData = await submitRes.json().catch(() => ({}));
          const err = new Error(
            (errData as { detail?: string }).detail ||
              `Server returned status ${submitRes.status}`
          );
          inflightTryOns.delete(submitKey);
          rejectReady(err);
          throw err;
        }

        const submitData = await submitRes.json();
        const jobId = submitData.job_id as string;
        const cached = Boolean(submitData.cached);
        const entry = inflightTryOns.get(submitKey);
        if (entry) {
          entry.jobId = jobId;
          entry.resolveReady(jobId);
        }

        if (cancelled) {
          // StrictMode unmounted us; second mount will poll via ready promise.
          return;
        }

        setLogs((prev) => [
          ...prev,
          `[JOB ENQUEUED] Job ID: ${jobId.slice(0, 8)}... (${cached ? 'CACHED' : 'QUEUED'})`,
        ]);
        setProgress(20);
        startPolling(jobId, cached);
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
  }, [modelImageUrl, garmentImageUrl, onComplete]);

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Header */}
      <div>
        <SectionLabel>Step 03 · Synthesize</SectionLabel>
        <h2 className="mt-1 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-white sm:text-3xl">
          Neural Fitting Room
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-stone-300">
          Draping <span className="text-amber-400 font-bold">{garmentName}</span> onto your model with latent diffusion synthesis.
        </p>
      </div>

      {/* Main Terminal + Progress Panel */}
      <GlassPanel className="flex flex-col gap-4 p-5 border-stone-800 bg-stone-900/90 shadow-xl">
        {errorMsg ? (
          <ErrorDisplay errorMsg={errorMsg} onBack={onBack} />
        ) : (
          <>
            {/* Circular Progress & Status */}
            <div className="flex flex-col items-center justify-center py-2">
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
                    style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.7))' }}
                  />
                  <defs>
                    <linearGradient id="fitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  {isCached ? (
                    <CheckCircle2 className="h-8 w-8 text-amber-400" />
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold text-white font-mono">{Math.round(progress)}%</span>
                      <Wand2 className="mt-0.5 h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    </>
                  )}
                </div>
              </div>
              <span className="mt-3 text-xs uppercase tracking-wider text-amber-400 font-bold">
                {statusText}
              </span>

              {isCached && cachedResultUrl && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <GlowButton
                    variant="gold"
                    onClick={() => onComplete(cachedResultUrl)}
                    className="text-xs py-2 px-4 font-bold"
                  >
                    View Result →
                  </GlowButton>
                  {onForceRegenerate && (
                    <GlowButton
                      variant="ghost"
                      onClick={onForceRegenerate}
                      className="text-xs py-2 px-3"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-Generate
                    </GlowButton>
                  )}
                </div>
              )}
            </div>

            {/* Live Terminal Log */}
            <div className="rounded-xl border border-stone-800 bg-stone-950/90 p-3.5 font-mono">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    fitlabs · real-time inference log
                  </span>
                </div>
                <Cpu className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="text-[11px] leading-relaxed text-amber-300/90">
                    <span className="text-stone-500">▸</span> {log}
                  </div>
                ))}
                {isProcessing && (
                  <div className="text-[11px] text-amber-400 animate-pulse">
                    ▸ Waiting for model output from backend...
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </GlassPanel>
    </div>
  );
}

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
      <div className="flex flex-col gap-3 p-2 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            GPU Quota Exhausted
          </h3>
          <p className="mt-1 text-xs text-stone-300 leading-relaxed max-w-sm">
            The free Hugging Face ZeroGPU quota for today has been used up.
          </p>
        </div>

        {waitTime && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Quota Resets In
              </div>
              <div className="text-base font-bold text-white font-mono">
                {waitTime}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {needsToken && !hasToken && (
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 transition-all hover:bg-amber-400/20 group"
            >
              <Zap className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">
                  Add a HF Token → 8× More Quota
                </div>
                <div className="text-[10px] text-stone-300 leading-normal">
                  Set <code className="text-amber-400 font-mono">HF_TOKEN</code> in your backend .env file.
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:text-amber-400" />
            </a>
          )}
        </div>

        <div className="flex gap-2 pt-1 justify-center">
          <GlowButton variant="ghost" onClick={onBack} className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Wardrobe
          </GlowButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mb-2">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">
        Synthesis Failed
      </h3>
      <p className="mt-1.5 text-xs text-stone-300 leading-relaxed max-w-xs">
        {errorMsg}
      </p>
      <div className="mt-4 flex gap-2">
        <GlowButton variant="ghost" onClick={onBack} className="text-xs">
          <ArrowLeft className="h-3 w-3" />
          Back to Wardrobe
        </GlowButton>
        <GlowButton variant="gold" onClick={() => window.location.reload()} className="text-xs">
          <RefreshCw className="h-3 w-3" />
          Retry Job
        </GlowButton>
      </div>
    </div>
  );
}
