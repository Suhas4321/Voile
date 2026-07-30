/* ============================================================
 * Full-bleed brand logo marquee — real store wordmarks on theme.
 * Charcoal glass strip (no white band). Logos monochrome gold-tint.
 * ============================================================ */

export interface StoreLogo {
  name: string;
  src: string;
  aspect?: number;
}

export const STORE_LOGOS: StoreLogo[] = [
  { name: 'Myntra', src: '/store-logos/myntra.png', aspect: 3.2 },
  { name: 'Ajio', src: '/store-logos/ajio.svg', aspect: 2.8 },
  { name: 'Amazon Fashion', src: '/store-logos/amazon.svg', aspect: 3.3 },
  { name: 'Flipkart', src: '/store-logos/flipkart.png', aspect: 3.5 },
  { name: 'Meesho', src: '/store-logos/meesho.png', aspect: 1.0 },
  { name: 'Nykaa Fashion', src: '/store-logos/nykaa.svg', aspect: 3.0 },
  { name: 'Tata CLiQ', src: '/store-logos/tatacliq.png', aspect: 1.65 },
];

const LOGO_H = 36;

interface StoreLogoMarqueeProps {
  className?: string;
}

export function StoreLogoMarquee({ className = '' }: StoreLogoMarqueeProps) {
  const logos = [...STORE_LOGOS, ...STORE_LOGOS, ...STORE_LOGOS];

  return (
    <div
      className={`relative w-screen max-w-[100vw] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden ${className}`}
      aria-label="Supported e-commerce stores"
    >
      {/* Thin on-theme strip — no white band, no heavy section chrome */}
      <div className="relative border-y border-stone-800/60 bg-stone-950/40 py-5 backdrop-blur-md sm:py-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-obsidian-base to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-obsidian-base to-transparent sm:w-28" />

        <div
          className="marquee-track relative z-[1] items-center gap-14 px-10 sm:gap-20 sm:px-14"
          style={{ minHeight: LOGO_H + 8 }}
        >
          {logos.map((logo, i) => (
            <span
              key={`${logo.name}-${i}`}
              className="store-logo-mark inline-flex shrink-0 items-center justify-center opacity-75 transition-opacity duration-300 hover:opacity-100"
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.name}
                height={LOGO_H}
                style={{
                  height: LOGO_H,
                  width: 'auto',
                  maxWidth: LOGO_H * (logo.aspect ?? 3),
                  objectFit: 'contain',
                  display: 'block',
                }}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
