import { useEffect, useState } from 'react';

/* ============================================================
 * ScrollProgressBar — a thin glowing gradient bar fixed to
 * the top of the viewport that fills as the user scrolls.
 * Creative luxury touch indicating reading position.
 * ============================================================ */

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent" aria-hidden>
      <div
        className="progress-bar-fill h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(0,229,255,0.7)',
        }}
      />
    </div>
  );
}
