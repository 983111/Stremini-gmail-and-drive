import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Clock,
  Presentation,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  GripVertical,
  ChevronLeft,
  Eye,
  EyeOff,
  SortAsc,
  SortDesc,
  Send,
  X,
  Upload,
  MessageSquare,
  FileText,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Monitor,
  AlignLeft,
  BarChart2,
  Minus,
  Columns,
  Quote,
  BookOpen,
  Flag,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchRecentDriveFiles,
  deleteDriveFile,
  createGooglePresentation,
  updatePresentationBatch,
  uploadBase64ImageToDrive,
} from '../lib/googleApi';
import {
  generatePresentationStructure,
  editPresentationStructureWithAI,
  summarizePresentation,
  askPresentationQuestion,
} from '../lib/gemini';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlideTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  bgColor: string;
}

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string[];
  layout: string;
  notes?: string;
  imagePrompt?: string;
  image?: string;
}

interface GeneratedDeck {
  title: string;
  subtitle?: string;
  theme: SlideTheme;
  slides: Slide[];
}

// ─── Layout Icons ─────────────────────────────────────────────────────────────

const LAYOUT_META: Record<string, { label: string; Icon: React.FC<any> }> = {
  COVER:          { label: 'Cover',          Icon: Monitor },
  AGENDA:         { label: 'Agenda',         Icon: BookOpen },
  SECTION_BREAK:  { label: 'Section Break',  Icon: Minus },
  CONTENT:        { label: 'Content',        Icon: AlignLeft },
  TWO_COLUMN:     { label: 'Two Column',     Icon: Columns },
  QUOTE:          { label: 'Quote',          Icon: Quote },
  DATA_CALLOUT:   { label: 'Data Callout',   Icon: BarChart2 },
  CLOSING:        { label: 'Closing',        Icon: Flag },
};

// ─── Slide Preview Renderer ───────────────────────────────────────────────────

function SlidePreview({ slide, theme, index, total }: {
  slide: Slide;
  theme: SlideTheme;
  index: number;
  total: number;
}) {
  const primary   = theme.primaryColor   || '#1a365d';
  const accent    = theme.accentColor    || '#c9a84c';
  const textColor = theme.textColor      || '#1a1a2e';
  const bg        = theme.bgColor        || '#f8f9fa';

  const isCover   = slide.layout === 'COVER';
  const isSection = slide.layout === 'SECTION_BREAK';
  const isQuote   = slide.layout === 'QUOTE';
  const isData    = slide.layout === 'DATA_CALLOUT';
  const isTwo     = slide.layout === 'TWO_COLUMN';
  const isClosing = slide.layout === 'CLOSING';

  return (
    <div
      className="relative w-full aspect-video rounded overflow-hidden select-none"
      style={{ background: bg, fontFamily: "'Georgia', serif" }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: primary }}
      />

      {/* Slide number */}
      <div
        className="absolute bottom-3 right-4 text-[9px] font-mono tracking-widest"
        style={{ color: `${textColor}55` }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      {/* Accent line top-right */}
      <div
        className="absolute top-0 right-0 h-0.5 w-24"
        style={{ background: accent }}
      />

      {isCover && (
        <div className="flex flex-col justify-center h-full px-10 py-8">
          <div
            className="text-[9px] font-bold tracking-[0.25em] uppercase mb-3"
            style={{ color: accent }}
          >
            Confidential
          </div>
          <h1
            className="text-[22px] font-bold leading-tight mb-3"
            style={{ color: primary, fontFamily: "'Georgia', serif" }}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-[11px] leading-relaxed" style={{ color: `${textColor}99` }}>
              {slide.subtitle}
            </p>
          )}
          <div
            className="mt-6 h-px w-16"
            style={{ background: accent }}
          />
        </div>
      )}

      {isSection && (
        <div
          className="flex flex-col justify-center h-full px-10 py-8"
          style={{ background: primary }}
        >
          <div
            className="text-[8px] font-bold tracking-[0.3em] uppercase mb-3 opacity-60"
            style={{ color: accent }}
          >
            Section
          </div>
          <h2
            className="text-[18px] font-bold leading-tight"
            style={{ color: '#ffffff', fontFamily: "'Georgia', serif" }}
          >
            {slide.title}
          </h2>
          {slide.content?.[0] && (
            <p className="text-[10px] mt-3 leading-relaxed opacity-70" style={{ color: '#ffffff' }}>
              {slide.content[0]}
            </p>
          )}
        </div>
      )}

      {isQuote && (
        <div className="flex flex-col justify-center h-full px-12 py-8">
          <div
            className="text-[28px] leading-none mb-4 opacity-20"
            style={{ color: primary, fontFamily: 'serif' }}
          >
            "
          </div>
          <p
            className="text-[12px] italic leading-relaxed"
            style={{ color: textColor, fontFamily: "'Georgia', serif" }}
          >
            {slide.content?.[0] || slide.title}
          </p>
          {slide.subtitle && (
            <div
              className="mt-4 text-[9px] font-bold tracking-widest uppercase"
              style={{ color: accent }}
            >
              — {slide.subtitle}
            </div>
          )}
        </div>
      )}

      {isData && (
        <div className="flex flex-col h-full px-8 py-6">
          <div className="mb-4">
            <h2
              className="text-[14px] font-bold leading-tight"
              style={{ color: primary, fontFamily: "'Georgia', serif" }}
            >
              {slide.title}
            </h2>
            <div className="mt-1 h-px w-8" style={{ background: accent }} />
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {(slide.content || []).slice(0, 4).map((point, i) => (
              <div
                key={i}
                className="p-2 rounded"
                style={{ background: `${primary}08`, borderLeft: `2px solid ${accent}` }}
              >
                <p className="text-[8px] leading-relaxed" style={{ color: textColor }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isTwo && (
        <div className="flex flex-col h-full px-8 py-6">
          <h2
            className="text-[13px] font-bold mb-4 leading-tight"
            style={{ color: primary, fontFamily: "'Georgia', serif" }}
          >
            {slide.title}
          </h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {(slide.content || []).map((point, i) => {
              const parts = point.split(' || ');
              return (
                <div key={i} className="flex items-start gap-1.5">
                  <div
                    className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                    style={{ background: accent }}
                  />
                  <p className="text-[8px] leading-relaxed" style={{ color: textColor }}>
                    {parts[i % 2] || point}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isClosing && (
        <div
          className="flex flex-col justify-center h-full px-10 py-8"
          style={{ background: `${primary}f0` }}
        >
          <h2
            className="text-[18px] font-bold leading-tight mb-4"
            style={{ color: '#ffffff', fontFamily: "'Georgia', serif" }}
          >
            {slide.title}
          </h2>
          <div className="space-y-2">
            {(slide.content || []).map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="text-[9px] font-bold w-4 shrink-0 mt-0.5"
                  style={{ color: accent }}
                >
                  {String(i + 1).padStart(2, '0')}.
                </div>
                <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default CONTENT / AGENDA */}
      {!isCover && !isSection && !isQuote && !isData && !isTwo && !isClosing && (
        <div className="flex flex-col h-full px-8 py-5">
          <div className="mb-3">
            <h2
              className="text-[13px] font-bold leading-tight"
              style={{ color: primary, fontFamily: "'Georgia', serif" }}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-[8px] mt-1" style={{ color: `${textColor}80` }}>
                {slide.subtitle}
              </p>
            )}
            <div className="mt-1.5 h-px w-8" style={{ background: accent }} />
          </div>
          <div className="space-y-1.5 flex-1 overflow-hidden">
            {(slide.content || []).slice(0, 5).map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                  style={{ background: accent }}
                />
                <p className="text-[8.5px] leading-relaxed line-clamp-2" style={{ color: textColor }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Slide Editor Card ────────────────────────────────────────────────────────

function SlideEditorCard({
  slide,
  theme,
  index,
  total,
  onUpdate,
  onRemove,
  onImageUpload,
  onImageRemove,
}: {
  slide: Slide;
  theme: SlideTheme;
  index: number;
  total: number;
  onUpdate: (id: string, updates: Partial<Slide>) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const meta = LAYOUT_META[slide.layout] || LAYOUT_META['CONTENT'];
  const LayoutIcon = meta.Icon;

  return (
    <Reorder.Item
      key={slide.id}
      value={slide}
      className="bg-background border border-border rounded-sm overflow-hidden"
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-surface transition-colors group"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="cursor-grab active:cursor-grabbing text-muted p-0.5">
          <GripVertical size={14} />
        </div>

        <div
          className="w-5 h-5 rounded-sm flex items-center justify-center shrink-0"
          style={{ background: `${theme.primaryColor}18`, color: theme.primaryColor }}
        >
          <LayoutIcon size={11} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted tracking-widest uppercase w-5 text-right shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {slide.title || 'Untitled Slide'}
            </span>
          </div>
          <span className="text-[10px] text-muted ml-7">{meta.label}</span>
        </div>

        {/* Thumbnail */}
        <div className="hidden sm:block w-20 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <SlidePreview slide={slide} theme={theme} index={index} total={total} />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onRemove(slide.id); }}
            className="p-1.5 text-muted hover:text-red-500 transition-colors rounded-sm hover:bg-red-50"
          >
            <Trash2 size={13} />
          </button>
          <div className="text-muted">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded edit panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={e => onUpdate(slide.id, { title: e.target.value })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-border-strong transition-colors"
                    placeholder="Slide title"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Subtitle / Context
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle || ''}
                    onChange={e => onUpdate(slide.id, { subtitle: e.target.value })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-border-strong transition-colors"
                    placeholder="Optional subtitle"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Layout
                  </label>
                  <select
                    value={slide.layout}
                    onChange={e => onUpdate(slide.id, { layout: e.target.value })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-border-strong transition-colors"
                  >
                    {Object.entries(LAYOUT_META).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Bullet Points <span className="normal-case font-normal">(one per line)</span>
                  </label>
                  <textarea
                    value={Array.isArray(slide.content) ? slide.content.join('\n') : (slide.content || '')}
                    onChange={e => onUpdate(slide.id, { content: e.target.value.split('\n') })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-border-strong transition-colors resize-none min-h-[100px]"
                    placeholder="Each line becomes a bullet point"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Speaker Notes
                  </label>
                  <textarea
                    value={slide.notes || ''}
                    onChange={e => onUpdate(slide.id, { notes: e.target.value })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-border-strong transition-colors resize-none min-h-[60px] font-mono"
                    placeholder="Speaker notes for this slide"
                  />
                </div>
              </div>

              {/* Right: preview + image */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                    Live Preview
                  </label>
                  <SlidePreview slide={slide} theme={theme} index={index} total={total} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Image
                  </label>
                  {slide.image ? (
                    <div className="relative group rounded-sm overflow-hidden border border-border">
                      <img src={slide.image} alt="Slide" className="w-full h-24 object-cover" />
                      <button
                        onClick={() => onImageRemove(slide.id)}
                        className="absolute top-2 right-2 bg-background border border-border p-1 rounded-sm text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-sm text-muted hover:text-foreground hover:border-border-strong transition-colors cursor-pointer">
                      <Upload size={13} />
                      <span className="text-xs">Upload image for this slide</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => onImageUpload(slide.id, e)}
                      />
                    </label>
                  )}
                  {slide.imagePrompt && !slide.image && (
                    <p className="text-[10px] text-muted mt-1.5 italic leading-relaxed">
                      AI suggestion: {slide.imagePrompt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

// ─── Insight Panel ────────────────────────────────────────────────────────────

function InsightPanel({
  slides,
  onClose,
}: {
  slides: Slide[];
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const summarize = async () => {
    setLoading(true);
    try {
      const summary = await summarizePresentation(slides);
      setMessages(prev => [...prev, { role: 'model', content: summary }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', content: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const answer = await askPresentationQuestion(
        slides,
        q,
        messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
      );
      setMessages(prev => [...prev, { role: 'model', content: answer }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', content: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Deck Intelligence</h3>
            <p className="text-[11px] text-muted mt-0.5">Analyse and query this presentation</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-foreground rounded-sm hover:bg-surface transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-surface rounded-sm flex items-center justify-center mx-auto mb-3">
                <FileText size={18} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Start with a summary</p>
              <p className="text-xs text-muted mb-5 max-w-[200px] mx-auto leading-relaxed">
                Get a structured briefing of this deck, or ask any question about its content.
              </p>
              <button
                onClick={summarize}
                disabled={loading}
                className="px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                Summarise Deck
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[90%] p-3 rounded-sm text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'bg-foreground text-background ml-auto'
                  : 'bg-surface border border-border text-foreground mr-auto'
              )}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-muted bg-surface border border-border p-3 rounded-sm w-fit">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs">Analysing...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <form onSubmit={sendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about this deck..."
              className="w-full bg-surface border border-border rounded-sm px-3 py-2.5 pr-10 text-sm outline-none focus:border-border-strong transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}

// ─── Full-screen Presentation Preview ────────────────────────────────────────

function FullPreview({
  deck,
  onClose,
}: {
  deck: GeneratedDeck;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const total = deck.slides.length;

  const go = (dir: number) => {
    setCurrent(c => Math.min(Math.max(c + dir, 0), total - 1));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const slide = deck.slides[current];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[60] flex flex-col"
    >
      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/80 shrink-0">
        <span className="text-white/60 text-xs font-mono tracking-widest">
          {deck.title}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-xs font-mono">
            {current + 1} / {total}
          </span>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Slide */}
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="w-full max-w-5xl aspect-video shadow-2xl rounded-sm overflow-hidden">
          <SlidePreview slide={slide} theme={deck.theme} index={current} total={total} />
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-center gap-4 py-4 shrink-0">
        <button
          onClick={() => go(-1)}
          disabled={current === 0}
          className="p-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1.5">
          {deck.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-1 rounded-full transition-all duration-200',
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
              )}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={current === total - 1}
          className="p-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Notes */}
      {slide.notes && (
        <div className="px-8 py-3 bg-black/60 border-t border-white/10 shrink-0">
          <p className="text-white/50 text-xs leading-relaxed max-w-3xl mx-auto">
            <span className="font-bold text-white/40 uppercase tracking-widest text-[10px] mr-2">Notes</span>
            {slide.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Slides() {
  const { accessToken, signIn } = useAuth();

  const [activeTab, setActiveTab] = useState<'builder' | 'management'>('builder');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  const [userSlides, setUserSlides] = useState<any[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [slidesSearch, setSlidesSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modifiedTime'>('modifiedTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (activeTab === 'management' && accessToken) {
      loadUserSlides();
    }
  }, [activeTab, accessToken, sortBy, sortOrder]);

  const loadUserSlides = async () => {
    setIsLoadingSlides(true);
    try {
      const slides = await fetchRecentDriveFiles(
        accessToken!,
        "mimeType = 'application/vnd.google-apps.presentation' and trashed = false",
        `${sortBy} ${sortOrder}`
      );
      setUserSlides(slides);
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setIsLoadingSlides(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setCreatedUrl(null);
    try {
      const structure = await generatePresentationStructure(prompt);
      const withIds: GeneratedDeck = {
        ...structure,
        slides: (structure.slides || []).map((s: any) => ({
          ...s,
          id: s.id || Math.random().toString(36).substring(7),
        })),
      };
      setDeck(withIds);
    } catch (error: any) {
      alert('Failed to generate presentation: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !deck) return;
    setIsEditingWithAI(true);
    try {
      const updated = await editPresentationStructureWithAI(deck, editPrompt);
      setDeck({
        ...updated,
        slides: (updated.slides || []).map((s: any) => ({
          ...s,
          id: s.id || Math.random().toString(36).substring(7),
        })),
      });
      setEditPrompt('');
    } catch (error: any) {
      alert('Failed to edit presentation: ' + error.message);
    } finally {
      setIsEditingWithAI(false);
    }
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setDeck(prev =>
      prev ? { ...prev, slides: prev.slides.map(s => s.id === id ? { ...s, ...updates } : s) } : prev
    );
  };

  const removeSlide = (id: string) => {
    setDeck(prev =>
      prev ? { ...prev, slides: prev.slides.filter(s => s.id !== id) } : prev
    );
  };

  const handleImageUpload = (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateSlide(slideId, { image: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: Math.random().toString(36).substring(7),
      title: 'New Slide',
      content: [],
      layout: 'CONTENT',
    };
    setDeck(prev => prev ? { ...prev, slides: [...prev.slides, newSlide] } : prev);
  };

  const handlePublish = async () => {
    if (!accessToken || !deck) return;
    setIsCreating(true);
    try {
      const presentation = await createGooglePresentation(accessToken, deck.title);
      const presentationId = presentation.presentationId;
      const requests: any[] = [];

      const theme = deck.theme || {
        primaryColor: '#1a365d',
        secondaryColor: '#2b6cb0',
        accentColor: '#c9a84c',
        textColor: '#1a1a2e',
        bgColor: '#f8f9fa',
      };

      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { red: r, green: g, blue: b };
      };

      const primaryRgb = hexToRgb(theme.primaryColor);
      const accentRgb  = hexToRgb(theme.accentColor);
      const textRgb    = hexToRgb(theme.textColor || '#1a1a2e');

      for (let index = 0; index < deck.slides.length; index++) {
        const slide = deck.slides[index];
        const slideId  = `slide_${index}_${Math.random().toString(36).substring(7)}`;
        const titleId  = `title_${index}_${Math.random().toString(36).substring(7)}`;
        const bodyId   = `body_${index}_${Math.random().toString(36).substring(7)}`;
        const barId    = `bar_${index}_${Math.random().toString(36).substring(7)}`;
        const footId   = `foot_${index}_${Math.random().toString(36).substring(7)}`;
        const accentId = `acc_${index}_${Math.random().toString(36).substring(7)}`;

        const isCover   = slide.layout === 'COVER';
        const isSection = slide.layout === 'SECTION_BREAK';
        const isClosing = slide.layout === 'CLOSING';

        // Create blank slide
        requests.push({
          createSlide: {
            objectId: slideId,
            insertionIndex: index,
            slideLayoutReference: { predefinedLayout: 'BLANK' },
          },
        });

        // Set background
        const bgRgb = isCover || isSection || isClosing
          ? hexToRgb(theme.primaryColor)
          : hexToRgb(theme.bgColor || '#f8f9fa');

        requests.push({
          updatePageProperties: {
            objectId: slideId,
            pageProperties: {
              pageBackgroundFill: { solidFill: { color: { rgbColor: bgRgb } } },
            },
            fields: 'pageBackgroundFill',
          },
        });

        // Left accent bar (not on dark slides)
        if (!isCover && !isSection && !isClosing) {
          requests.push({
            createShape: {
              objectId: barId,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: 8, unit: 'PT' }, height: { magnitude: 405, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'PT' },
              },
            },
          });
          requests.push({
            updateShapeProperties: {
              objectId: barId,
              shapeProperties: {
                shapeBackgroundFill: { solidFill: { color: { rgbColor: primaryRgb } } },
                outline: { outlineFill: { solidFill: { color: { rgbColor: primaryRgb } } } },
              },
              fields: 'shapeBackgroundFill,outline',
            },
          });

          // Accent top-right line
          requests.push({
            createShape: {
              objectId: accentId,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: 90, unit: 'PT' }, height: { magnitude: 2, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 630, translateY: 0, unit: 'PT' },
              },
            },
          });
          requests.push({
            updateShapeProperties: {
              objectId: accentId,
              shapeProperties: {
                shapeBackgroundFill: { solidFill: { color: { rgbColor: accentRgb } } },
                outline: { outlineFill: { solidFill: { color: { rgbColor: accentRgb } } } },
              },
              fields: 'shapeBackgroundFill,outline',
            },
          });
        }

        // Title
        const titleX       = isCover || isSection || isClosing ? 50 : 26;
        const titleY       = isCover ? 130 : isSection || isClosing ? 120 : 36;
        const titleW       = 600;
        const titleH       = isCover ? 100 : 60;
        const titleSize    = isCover ? 40 : isSection || isClosing ? 32 : 24;
        const titleColor   = isCover || isSection || isClosing ? { red: 1, green: 1, blue: 1 } : primaryRgb;

        requests.push({
          createShape: {
            objectId: titleId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: { width: { magnitude: titleW, unit: 'PT' }, height: { magnitude: titleH, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: titleX, translateY: titleY, unit: 'PT' },
            },
          },
        });
        requests.push({ insertText: { objectId: titleId, text: slide.title, insertionIndex: 0 } });
        requests.push({
          updateTextStyle: {
            objectId: titleId,
            style: {
              fontSize: { magnitude: titleSize, unit: 'PT' },
              bold: true,
              fontFamily: 'Georgia',
              foregroundColor: { opaqueColor: { rgbColor: titleColor } },
            },
            fields: 'fontSize,bold,fontFamily,foregroundColor',
          },
        });

        // Body content
        const hasContent = Array.isArray(slide.content) && slide.content.length > 0;
        if (hasContent && !isCover) {
          const bodyX = isSection || isClosing ? 50 : 26;
          const bodyY = isSection || isClosing ? 200 : 110;
          const bodyW = 600;
          const bodyColor = isSection || isClosing
            ? { red: 1, green: 1, blue: 0.7 }
            : textRgb;

          const contentText = slide.content.join('\n');
          requests.push({
            createShape: {
              objectId: bodyId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: bodyW, unit: 'PT' }, height: { magnitude: 240, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: bodyX, translateY: bodyY, unit: 'PT' },
              },
            },
          });
          requests.push({ insertText: { objectId: bodyId, text: contentText, insertionIndex: 0 } });
          requests.push({
            updateTextStyle: {
              objectId: bodyId,
              style: {
                fontSize: { magnitude: isSection || isClosing ? 14 : 12, unit: 'PT' },
                fontFamily: 'Georgia',
                foregroundColor: { opaqueColor: { rgbColor: bodyColor } },
              },
              fields: 'fontSize,fontFamily,foregroundColor',
            },
          });
        }

        // Footer (light slides only)
        if (!isCover && !isSection && !isClosing) {
          const footText = `${deck.title.toUpperCase()}  |  CONFIDENTIAL`;
          requests.push({
            createShape: {
              objectId: footId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: 580, unit: 'PT' }, height: { magnitude: 16, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 26, translateY: 385, unit: 'PT' },
              },
            },
          });
          requests.push({ insertText: { objectId: footId, text: footText, insertionIndex: 0 } });
          requests.push({
            updateTextStyle: {
              objectId: footId,
              style: {
                fontSize: { magnitude: 7, unit: 'PT' },
                fontFamily: 'Arial',
                bold: true,
                foregroundColor: { opaqueColor: { rgbColor: { red: 0.65, green: 0.65, blue: 0.65 } } },
              },
              fields: 'fontSize,fontFamily,bold,foregroundColor',
            },
          });
        }

        // Image handling
        if (slide.image) {
          try {
            const driveUrl = await uploadBase64ImageToDrive(accessToken!, slide.image, `slide_img_${index}.png`);
            if (driveUrl) {
              requests.push({
                createImage: {
                  url: driveUrl,
                  elementProperties: {
                    pageObjectId: slideId,
                    size: { width: { magnitude: 220, unit: 'PT' }, height: { magnitude: 180, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 420, translateY: 110, unit: 'PT' },
                  },
                },
              });
            }
          } catch (imgErr) {
            console.error('Image upload failed for slide', index, imgErr);
          }
        }
      }

      await updatePresentationBatch(accessToken!, presentationId, requests);
      setCreatedUrl(`https://docs.google.com/presentation/d/${presentationId}/edit`);
      setDeck(null);
      setPrompt('');
    } catch (error: any) {
      console.error('Error creating presentation:', error);
      alert('Failed to create presentation: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlide = async (fileId: string) => {
    if (!window.confirm('Delete this presentation?')) return;
    try {
      await deleteDriveFile(accessToken!, fileId);
      setUserSlides(prev => prev.filter(s => s.id !== fileId));
    } catch (error: any) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const filtered = userSlides.filter(s =>
    s.name.toLowerCase().includes(slidesSearch.toLowerCase())
  );

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <div className="w-14 h-14 bg-surface border border-border rounded-sm flex items-center justify-center mb-6">
          <Presentation size={24} className="text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Connect Google Account</h2>
        <p className="text-sm text-muted mb-8 max-w-xs leading-relaxed">
          Sign in with Google to generate and manage your presentation decks.
        </p>
        <button
          onClick={signIn}
          className="px-6 py-2.5 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-foreground-hover transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Presentations</h1>
            <p className="text-sm text-muted mt-1">Generate and manage Google Slides decks with AI.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['builder', 'management'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              )}
            >
              {tab === 'builder' ? 'AI Builder' : 'My Slides'}
            </button>
          ))}
        </div>

        {/* ── BUILDER TAB ── */}
        {activeTab === 'builder' && (
          <div className="space-y-6">

            {/* Prompt input */}
            <AnimatePresence mode="popLayout">
              {!deck && !createdUrl && (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <form onSubmit={handleGenerate}>
                    <div className="border border-border rounded-sm bg-surface overflow-hidden">
                      <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Describe your presentation... e.g. A 12-slide pitch deck for a Series A SaaS startup targeting enterprise HR teams, including market sizing, product overview, and financial projections."
                        className="w-full h-32 p-4 bg-transparent text-sm outline-none resize-none placeholder:text-muted text-foreground"
                        disabled={isGenerating}
                      />
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
                        <p className="text-xs text-muted">
                          AI will generate 10-14 slides with speaker notes and visual suggestions.
                        </p>
                        <button
                          type="submit"
                          disabled={isGenerating || !prompt.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-40"
                        >
                          {isGenerating ? (
                            <><Loader2 size={13} className="animate-spin" /> Generating...</>
                          ) : (
                            <>Generate Deck</>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Example prompts */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      'Series A pitch deck for a B2B SaaS startup',
                      'Quarterly business review for Q3 2025',
                      'Go-to-market strategy for a new product launch',
                      'Market entry analysis for Southeast Asia',
                    ].map(ex => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        className="px-3 py-1.5 text-xs text-muted border border-border rounded-sm hover:bg-surface hover:text-foreground transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success state */}
            {createdUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-border rounded-sm p-8 text-center bg-background"
              >
                <div className="w-12 h-12 bg-surface border border-border rounded-sm flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={20} className="text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Presentation Created</h3>
                <p className="text-sm text-muted mb-6 max-w-sm mx-auto leading-relaxed">
                  Your Google Slides deck has been published and is ready to edit, present, or share.
                </p>
                <div className="flex items-center gap-3 justify-center">
                  <a
                    href={createdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-foreground-hover transition-colors"
                  >
                    Open in Google Slides
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => { setCreatedUrl(null); setPrompt(''); }}
                    className="px-5 py-2.5 border border-border text-sm font-medium rounded-sm hover:bg-surface transition-colors text-foreground"
                  >
                    New Deck
                  </button>
                </div>
              </motion.div>
            )}

            {/* Deck editor */}
            {deck && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Deck meta + actions bar */}
                <div className="border border-border rounded-sm bg-background overflow-hidden">
                  {/* AI edit bar */}
                  <div className="px-4 py-3 border-b border-border bg-surface">
                    <form onSubmit={handleEditWithAI} className="flex gap-2">
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={e => setEditPrompt(e.target.value)}
                        placeholder="Edit with AI — e.g. Add a competitor analysis slide, change theme to navy blue..."
                        className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-border-strong transition-colors text-foreground placeholder:text-muted"
                        disabled={isEditingWithAI}
                      />
                      <button
                        type="submit"
                        disabled={isEditingWithAI || !editPrompt.trim()}
                        className="px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                      >
                        {isEditingWithAI ? <Loader2 size={13} className="animate-spin" /> : null}
                        Apply
                      </button>
                    </form>
                  </div>

                  {/* Deck title + actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={deck.title}
                        onChange={e => setDeck(prev => prev ? { ...prev, title: e.target.value } : prev)}
                        className="text-xl font-semibold text-foreground bg-transparent border-none outline-none w-full placeholder:text-muted"
                        placeholder="Presentation Title"
                      />
                      {deck.subtitle && (
                        <p className="text-sm text-muted mt-0.5">{deck.subtitle}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted">
                          {deck.slides.length} slides
                        </span>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-1.5">
                          {['primaryColor', 'accentColor', 'secondaryColor'].map(k => (
                            <div
                              key={k}
                              className="w-3 h-3 rounded-full border border-border"
                              style={{ background: (deck.theme as any)[k] }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-medium rounded-sm hover:bg-surface transition-colors text-foreground"
                      >
                        <Monitor size={13} />
                        Present
                      </button>
                      <button
                        onClick={() => setIsInsightOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-medium rounded-sm hover:bg-surface transition-colors text-foreground"
                      >
                        <MessageSquare size={13} />
                        Insights
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={isCreating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-40"
                      >
                        {isCreating ? (
                          <><Loader2 size={13} className="animate-spin" /> Publishing...</>
                        ) : (
                          <><Send size={13} /> Publish to Google</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slide cards */}
                <Reorder.Group
                  axis="y"
                  values={deck.slides}
                  onReorder={slides => setDeck(prev => prev ? { ...prev, slides } : prev)}
                  className="space-y-2"
                >
                  {deck.slides.map((slide, i) => (
                    <SlideEditorCard
                      key={slide.id}
                      slide={slide}
                      theme={deck.theme}
                      index={i}
                      total={deck.slides.length}
                      onUpdate={updateSlide}
                      onRemove={removeSlide}
                      onImageUpload={handleImageUpload}
                      onImageRemove={id => updateSlide(id, { image: undefined })}
                    />
                  ))}
                </Reorder.Group>

                {/* Add slide */}
                <button
                  onClick={addSlide}
                  className="w-full py-3 border border-dashed border-border rounded-sm text-sm text-muted hover:text-foreground hover:border-border-strong transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  Add Slide
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* ── MANAGEMENT TAB ── */}
        {activeTab === 'management' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search presentations..."
                  value={slidesSearch}
                  onChange={e => setSlidesSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-sm text-sm outline-none focus:border-border-strong transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-border rounded-sm overflow-hidden">
                  <button
                    onClick={() => setSortBy('name')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors',
                      sortBy === 'name' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground bg-background'
                    )}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => setSortBy('modifiedTime')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                      sortBy === 'modifiedTime' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground bg-background'
                    )}
                  >
                    Date
                  </button>
                </div>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-border rounded-sm text-muted hover:text-foreground bg-background transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                </button>
                <button
                  onClick={loadUserSlides}
                  disabled={isLoadingSlides}
                  className="p-2 border border-border rounded-sm text-muted hover:text-foreground bg-background transition-colors"
                >
                  <Clock size={14} className={isLoadingSlides ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {isLoadingSlides ? (
              <div className="flex items-center justify-center py-20 text-muted gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading presentations...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-sm">
                <div className="w-12 h-12 bg-surface rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Presentation size={20} className="text-muted" />
                </div>
                <p className="text-sm font-medium text-foreground">No presentations found</p>
                <p className="text-xs text-muted mt-1">
                  {slidesSearch ? 'No results match your search.' : 'Create your first deck in the AI Builder tab.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(slide => (
                  <div
                    key={slide.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-sm hover:bg-surface transition-colors group bg-background"
                  >
                    <div className="w-10 h-10 bg-surface border border-border rounded-sm flex items-center justify-center shrink-0">
                      <Presentation size={16} className="text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{slide.name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Modified {new Date(slide.modifiedTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1.5 text-muted hover:text-red-500 rounded-sm hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <a
                        href={slide.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-sm text-xs font-medium text-foreground hover:bg-surface transition-colors"
                      >
                        Open
                        <ArrowRight size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {isInsightOpen && deck && (
          <InsightPanel slides={deck.slides} onClose={() => setIsInsightOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPreviewOpen && deck && (
          <FullPreview deck={deck} onClose={() => setIsPreviewOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
