import { Heart, X, Download, Trash2 } from 'lucide-react';
import { GlassPanel, GlowButton } from '@/components/ui/GlassPrimitives';
import { type SavedFit } from '@/lib/data';

/* ============================================================
 * SavedFitsDrawer — slide-over glass drawer showing saved
 * try-on combinations with thumbnails, timestamps, and a
 * full style-sheet export action.
 * Warm Gold Luxury aesthetic.
 * ============================================================ */

interface SavedFitsDrawerProps {
  open: boolean;
  onClose: () => void;
  fits: SavedFit[];
  onRemove: (id: string) => void;
}

export function SavedFitsDrawer({ open, onClose, fits, onRemove }: SavedFitsDrawerProps) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm transition-opacity duration-400 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col p-4 transition-transform duration-500 ease-out sm:p-6 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <GlassPanel className="flex h-full flex-col p-5 border-stone-800 bg-stone-900/90">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-gold-accent" />
              <h3 className="font-serif text-lg font-bold uppercase tracking-wide-luxe text-stone-100">
                Saved Fits & Moodboard
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-800 text-stone-400 transition-colors hover:text-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {fits.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Heart className="h-10 w-10 text-stone-700" />
              <p className="max-w-xs text-sm text-stone-400">
                No saved fits yet. Complete a try-on and tap "Save" to build your style moodboard.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 no-scrollbar">
              {fits.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/60 p-2.5 transition-all duration-300 hover:border-stone-700"
                >
                  <img
                    src={f.thumbnail}
                    alt={f.garmentName}
                    className="h-16 w-16 shrink-0 rounded-lg object-contain bg-stone-950 p-1 border border-stone-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-stone-100">{f.garmentName}</div>
                    <div className="truncate text-xs text-stone-400">{f.modelName}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-gold-accent/15 border border-gold-accent/30 px-2 py-0.5 text-[10px] font-semibold text-gold-accent">
                        {f.fitScore}% fit
                      </span>
                      <span className="text-[10px] text-stone-400">{f.timestamp}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(f.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {fits.length > 0 && (
            <div className="mt-5 pt-2">
              <GlowButton variant="gold" className="w-full">
                <Download className="h-4 w-4 fill-stone-950" />
                Export Full Style Sheet PDF
              </GlowButton>
            </div>
          )}
        </GlassPanel>
      </aside>
    </>
  );
}
