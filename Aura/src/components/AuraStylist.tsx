import { useState } from 'react';
import { Wand2, X, Send, Sparkles } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPrimitives';
import { STYLIST_SUGGESTIONS, GARMENTS } from '@/lib/data';

/* ============================================================
 * AuraStylist — Compact Circular AI Assistant Widget.
 * Positioned above the pinned bottom CTA bar (bottom-16 right-5).
 * ============================================================ */

interface Message {
  role: 'user' | 'ai';
  text: string;
  chips?: string[];
}

function replyFor(prompt: string): Message {
  const lower = prompt.toLowerCase();
  let text =
    'Excellent question. For a cohesive look, consider these pairings that complement your selection:';
  let chips = ['Technical Wool Bomber', 'Cashmere Drape Overcoat', 'Gold-Plated Articulated Cuff'];

  if (lower.includes('trouser')) {
    text =
      'For matching trousers, I recommend a high-rise tailored cut in a neutral wool. The Cashmere Drape Overcoat pairs beautifully for evening.';
    chips = ['Heavyweight Japanese Raw Denim Jacket', 'Architectural Cutline Tee'];
  } else if (lower.includes('footwear') || lower.includes('shoe')) {
    text =
      'Footwear should echo the garment weight. A sculpted evening gown asks for a minimal satin mule, while streetwear leans into a chunky technical sole.';
    chips = ['Sculpted Satin Column Dress', 'Architectural Cutline Tee'];
  } else if (lower.includes('winter') || lower.includes('layer')) {
    text =
      'Layering for cold weather: anchor with a fine-gauge base, add the leather trench as the hero piece, and finish with a cashmere overcoat for warmth and depth.';
    chips = ['Cyberpunk Matte Leather Trench', 'Cashmere Drape Overcoat'];
  } else if (lower.includes('skin tone') || lower.includes('blazer')) {
    text =
      'Your warm undertone pairs elegantly with champagne and amber-adjacent hues. A gold-accented cuff elevates the blazer without competing with it.';
    chips = ['Gold-Plated Articulated Cuff', 'Italian Mulberry Silk Gown'];
  }
  return { role: 'ai', text, chips };
}

export function AuraStylist() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'I am FitLabs Stylist. Ask me about pairings, layering, or colour harmony for your current look.',
    },
  ]);
  const [input, setInput] = useState('');

  function send(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    const ai = replyFor(prompt);
    setMessages((m) => [...m, { role: 'user', text: prompt }, ai]);
    setInput('');
  }

  return (
    <div className="fixed bottom-16 right-5 z-50 flex flex-col items-end gap-3 pointer-events-auto">
      {/* Chat window modal */}
      {open && (
        <GlassPanel
          shimmer
          className="flex w-[min(92vw,360px)] flex-col overflow-hidden animate-scale-in border-stone-800 bg-stone-950/95 shadow-2xl backdrop-blur-2xl rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-md">
                <Wand2 className="h-4 w-4 text-stone-950" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">FitLabs Stylist</div>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  AI Fashion Assistant
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-64 space-y-3 overflow-y-auto p-4 no-scrollbar">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-400/20 text-white border border-amber-400/40'
                      : 'bg-stone-900 text-stone-200 border border-stone-800'
                  }`}
                >
                  {m.text}
                  {m.chips && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.chips.map((c) => {
                        const g = GARMENTS.find((x) => x.name === c);
                        return (
                          <span
                            key={c}
                            className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-400"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            {c}
                            {g && <span className="text-stone-400 font-normal">· {g.price}</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {STYLIST_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-stone-800 bg-stone-900/80 px-2.5 py-1 text-[10px] text-stone-300 transition-all hover:border-amber-400/50 hover:text-amber-400 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-stone-800 p-3 bg-stone-950">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask FitLabs Stylist…"
              className="flex-1 bg-transparent text-xs text-white placeholder:text-stone-500 focus:outline-none"
            />
            <button
              onClick={() => send(input)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-stone-950 transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-md"
            >
              <Send className="h-3.5 w-3.5 fill-stone-950 text-stone-950" />
            </button>
          </div>
        </GlassPanel>
      )}

      {/* Sleek Compact Circular Icon Trigger Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="FitLabs Stylist AI"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/50 bg-stone-950/90 text-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.4)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-amber-400 hover:bg-stone-900 active:scale-95 cursor-pointer"
      >
        <Wand2 className="h-5 w-5 text-amber-400 transition-transform group-hover:rotate-12" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
        </span>
      </button>
    </div>
  );
}
