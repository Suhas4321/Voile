/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant', 'Cinzel', 'Playfair Display', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        obsidian: {
          base: '#0C0A09',       // Warm stone charcoal background
          surface: '#1C1917',    // Warm stone-900 surface
          card: '#292524',       // Warm stone-800 card
          border: '#44403C',     // Warm stone-700 border
          DEFAULT: '#0C0A09',
        },
        gold: {
          aura: '#D4AF37',       // Metallic Luxury Gold
          accent: '#E8C468',     // Champagne Gold
          warm: '#F59E0B',       // Warm Amber Gold
          deep: '#B45309',       // Deep Bronze
        },
        amber: {
          aura: '#F59E0B',
        },
        silver: {
          muted: '#A8A29E',      // Warm Stone Muted Grey
          light: '#E7E5E4',      // Warm Stone Off-White
        },
      },
      animation: {
        'orb-float-1': 'orbFloat1 22s ease-in-out infinite',
        'orb-float-2': 'orbFloat2 26s ease-in-out infinite',
        'orb-pulse': 'orbPulse 12s ease-in-out infinite',
        'shimmer': 'shimmer 3.2s linear infinite',
        'scan-line': 'scanLine 2.4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-in-right': 'slideInRight 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in-left': 'slideInLeft 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'spin-slow': 'spin 3.4s linear infinite',
        'skeleton-pulse': 'skeletonPulse 1.8s ease-in-out infinite',
        'gradient-x': 'gradientX 6s ease infinite',
        'log-blink': 'logBlink 1s steps(2) infinite',
        'specular-sweep': 'specularSweep 7s ease-in-out infinite',
      },
      keyframes: {
        orbFloat1: {
          '0%,100%': { transform: 'translate(-8%, -6%) scale(1)' },
          '50%': { transform: 'translate(14%, 18%) scale(1.18)' },
        },
        orbFloat2: {
          '0%,100%': { transform: 'translate(10%, 8%) scale(1.1)' },
          '50%': { transform: 'translate(-16%, -12%) scale(0.92)' },
        },
        orbPulse: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.15' },
          '50%': { transform: 'scale(1.32)', opacity: '0.24' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-150%)' },
          '100%': { transform: 'translateX(150%)' },
        },
        scanLine: {
          '0%,100%': { top: '4%' },
          '50%': { top: '94%' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        skeletonPulse: {
          '0%,100%': { opacity: '0.85', boxShadow: '0 0 8px 2px rgba(212,175,55,0.6)' },
          '50%': { opacity: '1', boxShadow: '0 0 14px 4px rgba(232,196,104,0.9)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        logBlink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        specularSweep: {
          '0%': { transform: 'translateX(-200%) rotate(0deg)' },
          '50%': { transform: 'translateX(200%) rotate(0deg)' },
          '100%': { transform: 'translateX(200%) rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
