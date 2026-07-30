import { type CSSProperties } from 'react';
import { LIGHTING_THEMES, type LightingPreset } from '@/lib/data';

/* ============================================================
 * AmbientBackground — the animated liquid gradient mesh orb layer
 * that responds to the active lighting preset. Sits behind all
 * glass panels and tints the entire page atmosphere.
 * ============================================================ */

interface AmbientBackgroundProps {
  preset: LightingPreset;
}

export function AmbientBackground({ preset }: AmbientBackgroundProps) {
  const theme = LIGHTING_THEMES.find((t) => t.id === preset) ?? LIGHTING_THEMES[0];

  const orbBase: CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(90px)',
    willChange: 'transform, opacity',
  };

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        backgroundColor: theme.base ?? '#0C0A09',
        transition: 'background-color 1.2s ease',
      }}
      aria-hidden
    >
      {/* Ambient page-wide tint */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(120% 90% at 50% 0%, ${theme.ambient}, transparent 60%)`,
        }}
      />

      {/* Orb 1 — top-left (color from active lighting theme) */}
      <div
        className="animate-orb-float-1"
        style={{
          ...orbBase,
          top: '-12%',
          left: '-10%',
          width: '46vw',
          height: '46vw',
          maxWidth: '640px',
          maxHeight: '640px',
          background: theme.orb1,
          transition: 'background 1.2s ease',
        }}
      />

      {/* Orb 2 — bottom-right */}
      <div
        className="animate-orb-float-2"
        style={{
          ...orbBase,
          bottom: '-18%',
          right: '-12%',
          width: '52vw',
          height: '52vw',
          maxWidth: '720px',
          maxHeight: '720px',
          background: theme.orb2,
          transition: 'background 1.2s ease',
        }}
      />

      {/* Orb 3 — center pulse */}
      <div
        className="animate-orb-pulse"
        style={{
          ...orbBase,
          top: '32%',
          left: '38%',
          width: '30vw',
          height: '30vw',
          maxWidth: '440px',
          maxHeight: '440px',
          background: theme.orb3,
          transition: 'background 1.2s ease',
        }}
      />

      {/* Subtle grain / vignette to deepen the obsidian space */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}
