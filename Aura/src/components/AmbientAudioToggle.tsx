import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/* ============================================================
 * AmbientAudioToggle — a creative surprise widget. Toggles a
 * generative ambient luxury "atelier" drone synthesized live
 * with the Web Audio API (no audio files needed). A soft pad
 * of detuned oscillators with a slow LFO swell + gentle filter.
 * ============================================================ */

export function AmbientAudioToggle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  function start() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Soft lowpass for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.6;
    filter.connect(master);

    // Detuned pad — three oscillators forming a lush chord
    const freqs = [110, 165, 220, 277];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.12 / freqs.length;
      o.connect(g);
      g.connect(filter);
      o.start();
      return o;
    });

    // Slow LFO swelling the filter cutoff
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Fade in
    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.5);

    nodesRef.current = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        setTimeout(() => {
          oscs.forEach((o) => o.stop());
          lfo.stop();
          ctx.close();
        }, 700);
      },
    };
  }

  function toggle() {
    if (on) {
      nodesRef.current?.stop();
      nodesRef.current = null;
      setOn(false);
    } else {
      start();
      setOn(true);
    }
  }

  useEffect(() => {
    return () => nodesRef.current?.stop();
  }, []);

  return (
    <button
      onClick={toggle}
      title={on ? 'Mute ambient atelier drone' : 'Play ambient atelier drone'}
      className={`glass glass-hover group flex h-10 items-center gap-2 rounded-full px-3.5 transition-all duration-300 ${
        on ? 'border-cyan-aura/50 shadow-[0_0_18px_-4px_rgba(0,229,255,0.7)]' : ''
      }`}
    >
      {on ? (
        <Volume2 className="h-4 w-4 text-cyan-aura animate-glow-pulse" />
      ) : (
        <VolumeX className="h-4 w-4 text-silver-muted group-hover:text-white" />
      )}
      <span className="hidden text-[11px] font-semibold uppercase tracking-wide-luxe sm:inline">
        {on ? 'Ambient On' : 'Ambient'}
      </span>
      {on && (
        <span className="flex items-end gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-0.5 rounded-full bg-cyan-aura animate-glow-pulse"
              style={{ height: `${6 + i * 4}px`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
