import { useEffect, useState, useRef } from 'react';
import { Wand2, Cpu, AlertTriangle, RefreshCw, ArrowLeft, CheckCircle2, Clock, ExternalLink, Zap, ShieldAlert } from 'lucide-react';
import { GlassPanel, GlowButton, SectionLabel } from '@/components/ui/GlassPrimitives';

/* ============================================================
 * Step3NeuralFitting — Real VTON API Integration & Progress view.
 * Sends model & garment images to FastAPI /api/v1/try-on,
 * polls /api/v1/jobs/{job_id} until completed or failed,
 * and passes the real rendered result image to Step 4.
 * ============================================================ */

interface Step3NeuralFittingProps {
  modelImageUrl?: string;
  garmentImageUrl?: string;
  garmentName: string;
  cachedResultUrl?: string | null;
  isRegeneration?: boolean;
  onComplete: (realResultUrl: string) => void;
  onBack: () => void;
  onForceRegenerate?: () => void;
}

const API_BASE = 'http://localhost:8000';

export function Step3NeuralFitting({
  modelImageUrl,
  garmentImageUrl,
  garmentName,
  cachedResultUrl,
  isRegeneration = false,
  onComplete,
  onBack,
  onForceRegenerate,
}: Step3NeuralFittingProps) {
  const isCached = Boolean(cachedResultUrl) && !isRegeneration;
  const [progress, setProgress] = useState(isCached ? 100 : 10);
  const [statusText, setStatusText] = useState(
    isCached ? 'Cached neural fit ready' : 'Initializing pipeline…',
  );
  const [logs, setLogs] = useState<string[]>(
    isCached
      ? [
          '[0.0s] System initialized.',
          '[0.1s] Found existing cached try-on output for this photo + garment pair.',
          '[0.2s] Synthesis cached. Ready for instant reveal.',
        ]
      : ['[0.0s] System initialization initialized.'],
  );
  const [scanPos, setScanPos] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(!isCached);

  const mountedRef = useRef(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  function addLog(msg: string) {
    const timestamp = (performance.now() / 1000).toFixed(1);
    setLogs((prev) => [...prev, `[${timestamp}s] ${msg}`]);
  }

  // Laser scan line effect
  useEffect(() => {
    mountedRef.current = true;
    const scanInterval = setInterval(() => {
      setScanPos((prev) => (prev >= 90 ? 10 : prev + 4));
    }, 100);

    return () => {
      mountedRef.current = false;
      clearInterval(scanInterval);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Main API job execution
  useEffect(() => {
    if (isCached && cachedResultUrl) {
      return; // Skip re-submitting to backend when result is already cached for this pair!
    }

    let cancelled = false;

    async function runFittingPipeline() {
      if (!modelImageUrl || !garmentImageUrl) {
        setErrorMsg('Missing model photo or garment photo. Please return to Step 1/2.');
        setIsProcessing(false);
        return;
      }

      try {
        setErrorMsg(null);
        setIsProcessing(true);
        setProgress(15);
        setStatusText('Preparing image payloads…');
        addLog('Fetching image byte data for multipart submission…');

        // Fetch Blobs from URLs (handles blob: URLs or external asset URLs)
        const [modelBlob, garmentBlob] = await Promise.all([
          fetch(modelImageUrl).then((r) => {
            if (!r.ok) throw new Error('Failed to load model image payload.');
            return r.blob();
          }),
          fetch(garmentImageUrl).then((r) => {
            if (!r.ok) throw new Error('Failed to load garment image payload.');
            return r.blob();
          }),
        ]);

        if (cancelled) return;

        setProgress(30);
        setStatusText('Submitting to VTON backend queue…');
        addLog('POSTing payload to /api/v1/try-on…');

        // Build FormData
        const formData = new FormData();
        formData.append('model_image', modelBlob, 'model_image.jpg');
        formData.append('garment_image', garmentBlob, 'garment_image.jpg');

        const submitRes = await fetch(`${API_BASE}/api/v1/try-on`, {
          method: 'POST',
          body: formData,
        });

        if (!submitRes.ok) {
          const errData = await submitRes.json().catch(() => ({ detail: 'Upload error' }));
          throw new Error(errData.detail || `Server returned status ${submitRes.status}`);
        }

        const jobData = await submitRes.json();
        const jobId = jobData.job_id;
        addLog(`Job enqueued successfully. Job ID: ${jobId}`);
        setProgress(45);
        setStatusText('AI Worker processing request…');

        // Poll /api/v1/jobs/{jobId}
        const pollJob = async () => {
          if (cancelled) return;
          try {
            const pollRes = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
            if (!pollRes.ok) throw new Error('Failed to query job status');
            const statusData = await pollRes.json();

            if (cancelled) return;

            if (statusData.status === 'validating') {
              setProgress(55);
              setStatusText(statusData.progress_message || 'Validating image constraints…');
              addLog('Backend validating image dimensions & color profiles…');
            } else if (statusData.status === 'processing' || statusData.status === 'pending') {
              setProgress((p) => Math.min(85, p + 5));
              setStatusText(statusData.progress_message || 'Running AI latent diffusion inference…');
              addLog('Executing VTON diffusion inference via provider adapter…');
            } else if (statusData.status === 'completed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setProgress(100);
              setStatusText('Synthesis completed!');
              addLog('Inference complete! Rendering full-bleed result…');
              setIsProcessing(false);

              let finalResultUrl = statusData.result_image_url;
              if (finalResultUrl && finalResultUrl.startsWith('/')) {
                finalResultUrl = `${API_BASE}${finalResultUrl}`;
              }

              setTimeout(() => {
                if (!cancelled) onComplete(finalResultUrl);
              }, 800);
            } else if (statusData.status === 'failed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              throw new Error(statusData.error_message || 'AI inference process failed.');
            }
          } catch (err: any) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setErrorMsg(err.message || 'Polling error occurred');
            setIsProcessing(false);
          }
        };

        // Start polling every 2 seconds
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
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [modelImageUrl, garmentImageUrl]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 text-center">
        <SectionLabel>Step 03 · Synthesize</SectionLabel>
        <h2 className="mt-2 font-serif text-2xl font-bold uppercase tracking-wide-luxe text-white sm:text-3xl">
          Neural Fitting Room
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-silver-muted">
          Draping <span className="text-cyan-aura">{garmentName}</span> onto your model with
          latent diffusion synthesis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Scan viewport */}
        <GlassPanel className="relative overflow-hidden p-0">
          <div className="relative flex aspect-[3/4] max-h-[520px] items-center justify-center overflow-hidden rounded-2xl bg-obsidian/60 sm:aspect-[16/11]">
            {modelImageUrl ? (
              <img
                src={modelImageUrl}
                alt="Model under scan"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-silver-muted">
                No model image
              </div>
            )}

            {/* Sweeping laser scan line + particle trail */}
            {isProcessing && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-px"
                  style={{
                    top: `${scanPos}%`,
                    background: 'linear-gradient(90deg, transparent, #00E5FF 50%, transparent)',
                    boxShadow:
                      '0 0 22px 4px rgba(0,229,255,0.85), 0 0 60px 10px rgba(0,229,255,0.35)',
                    transition: 'top 0.1s linear',
                  }}
                />
                <div
                  className="absolute inset-0 opacity-30 mix-blend-screen"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(0,229,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.18) 1px, transparent 1px)',
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
                  className={`absolute h-6 w-6 rounded-[2px] border-cyan-aura/60 ${c}`}
                />
              ),
            )}

            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-obsidian/80 px-3 py-1.5 backdrop-blur-md border border-cyan-aura/30">
              <Cpu className="h-3.5 w-3.5 text-cyan-aura animate-glow-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wide-luxe text-cyan-aura">
                {isProcessing ? 'Synthesizing (Live Inference)' : errorMsg ? 'Inference Error' : 'Complete'}
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Terminal + Progress / Error View */}
        <GlassPanel className="flex flex-col gap-5 p-5">
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
                      style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.6))' }}
                    />
                    <defs>
                      <linearGradient id="fitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00E5FF" />
                        <stop offset="100%" stopColor="#E8C468" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    {isCached ? (
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                        <Wand2 className="mt-0.5 h-3.5 w-3.5 text-cyan-aura animate-glow-pulse" />
                      </>
                    )}
                  </div>
                </div>
                <span className="mt-2 text-[11px] uppercase tracking-wide-luxe text-cyan-aura">
                  {statusText}
                </span>

                {isCached && cachedResultUrl && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <GlowButton
                      variant="cyan"
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
              <div className="flex-1 min-h-[160px] rounded-xl border border-white/10 bg-obsidian/80 p-3.5 font-mono">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400/70" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 text-[10px] uppercase tracking-wide-luxe text-silver-muted">
                    voile · real-time inference log
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="text-[10.5px] leading-relaxed text-emerald-300/90">
                      <span className="text-silver-muted/60">▸</span> {log}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="text-[10.5px] text-cyan-aura animate-pulse">
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

  // Extract wait time like "23:19:19" or "Quota resets in X"
  const waitMatch = msg.match(/(?:try again in|resets in)\s+(\d+:\d+:\d+)/i);
  const waitTime = waitMatch ? waitMatch[1] : null;

  // Check if it mentions adding a token
  const needsToken =
    msg.includes('[ACTION]') ||
    msg.toLowerCase().includes('hf_token') ||
    msg.toLowerCase().includes('authenticate');

  // Check if user already has a token
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
          <p className="mt-1.5 text-xs text-silver-muted leading-relaxed max-w-sm">
            The free Hugging Face ZeroGPU quota for today has been used up.
            Each try-on request reserves ~60s of GPU time from a shared pool.
          </p>
        </div>

        {/* Wait time card */}
        {waitTime && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide-luxe text-amber-300">
                Quota Resets In
              </div>
              <div className="text-lg font-bold text-white font-mono tracking-wider">
                {waitTime}
              </div>
            </div>
          </div>
        )}

        {/* Actionable guidance cards */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide-luxe text-cyan-aura">
            What You Can Do
          </div>

          {needsToken && !hasToken && (
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-cyan-aura/20 bg-cyan-aura/[0.05] px-4 py-3 transition-all hover:border-cyan-aura/40 hover:bg-cyan-aura/[0.08] group"
            >
              <Zap className="h-5 w-5 shrink-0 text-cyan-aura mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">
                  Add a HF Token → 8× More Quota
                </div>
                <div className="mt-0.5 text-[10.5px] leading-relaxed text-silver-muted">
                  Create a free token at huggingface.co/settings/tokens and add it as{' '}
                  <code className="rounded bg-white/10 px-1 py-0.5 text-cyan-aura font-mono text-[9.5px]">
                    HF_TOKEN
                  </code>{' '}
                  in your backend <code className="rounded bg-white/10 px-1 py-0.5 text-cyan-aura font-mono text-[9.5px]">.env</code> file.
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-silver-muted group-hover:text-cyan-aura mt-0.5" />
            </a>
          )}

          {hasToken && (
            <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.05] px-4 py-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-purple-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">
                  Consider HF Pro ($9/mo)
                </div>
                <div className="mt-0.5 text-[10.5px] leading-relaxed text-silver-muted">
                  You're authenticated but exceeded even the token quota.
                  HF Pro gives significantly more daily GPU time and priority queue access.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-silver-muted mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">
                Wait for Quota Reset
              </div>
              <div className="mt-0.5 text-[10.5px] leading-relaxed text-silver-muted">
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
      <p className="mt-2 text-xs text-silver-muted leading-relaxed max-w-xs">
        {errorMsg}
      </p>
      <div className="mt-5 flex gap-2">
        <GlowButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Wardrobe
        </GlowButton>
        <GlowButton variant="cyan" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Retry Job
        </GlowButton>
      </div>
    </div>
  );
}
