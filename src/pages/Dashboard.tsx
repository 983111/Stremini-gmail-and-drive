import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Cpu, Loader2, FileText, X, Activity, HardDrive,
  AlertTriangle, Clock, TrendingUp, ChevronRight, RefreshCw, Sparkles,
} from 'lucide-react';
import { fetchRecentEmails, fetchRecentDriveFiles } from '../lib/googleApi';
import { generateBriefing, generateMeetingIntelligence } from '../lib/gemini';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Section { title: string; body: string; kind: SectionKind }
type SectionKind = 'summary' | 'urgent' | 'followup' | 'financial' | 'other';

// ─── Parse markdown into labelled sections ────────────────────────────────────
function parseSections(md: string): Section[] {
  if (!md.trim()) return [];
  const raw = md.split(/\n(?=##\s)/);
  return raw
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.startsWith('##'))
    .map(chunk => {
      const nl    = chunk.indexOf('\n');
      const title = (nl === -1 ? chunk : chunk.slice(0, nl)).replace(/^#+\s*/, '').trim();
      const body  = nl === -1 ? '' : chunk.slice(nl + 1).trim();
      const lower = title.toLowerCase();
      let kind: SectionKind = 'other';
      if (lower.includes('summary') || lower.includes('today'))      kind = 'summary';
      else if (lower.includes('urgent') || lower.includes('alert'))  kind = 'urgent';
      else if (lower.includes('follow'))                             kind = 'followup';
      else if (lower.includes('financial') || lower.includes('finance')) kind = 'financial';
      return { title, body, kind };
    })
    .filter(s => s.body.length > 0);
}

// ─── Section visual config ────────────────────────────────────────────────────
const KINDS: Record<SectionKind, {
  icon: React.FC<{ size?: number; className?: string }>;
  pill: string;
  border: string;
  bg: string;
  dot: string;
}> = {
  summary:   { icon: Sparkles,       pill: 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900',        border: 'border-zinc-200 dark:border-zinc-700',    bg: 'bg-zinc-50/60 dark:bg-zinc-900/40',       dot: 'bg-zinc-400' },
  urgent:    { icon: AlertTriangle,  pill: 'bg-red-600 text-white',                                             border: 'border-red-200 dark:border-red-800',      bg: 'bg-red-50/60 dark:bg-red-950/30',         dot: 'bg-red-500'  },
  followup:  { icon: Clock,          pill: 'bg-amber-500 text-white',                                           border: 'border-amber-200 dark:border-amber-700',  bg: 'bg-amber-50/60 dark:bg-amber-950/30',     dot: 'bg-amber-400'},
  financial: { icon: TrendingUp,     pill: 'bg-emerald-600 text-white',                                         border: 'border-emerald-200 dark:border-emerald-700', bg: 'bg-emerald-50/60 dark:bg-emerald-950/30', dot: 'bg-emerald-500'},
  other:     { icon: Activity,       pill: 'bg-blue-600 text-white',                                            border: 'border-blue-200 dark:border-blue-700',    bg: 'bg-blue-50/60 dark:bg-blue-950/30',       dot: 'bg-blue-400' },
};

function SectionCard({ section }: { section: Section }) {
  const cfg = KINDS[section.kind];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-sm border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-3 break-inside-avoid`}>
      <div className={`inline-flex items-center space-x-1.5 self-start px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.pill}`}>
        <Icon size={11} />
        <span>{section.title}</span>
      </div>
      <div className="text-xs text-foreground-muted leading-relaxed prose dark:prose-invert prose-xs max-w-none
        [&>ul]:pl-4 [&>ul]:space-y-1 [&>li]:text-xs [&>p]:text-xs [&>p]:my-1
        [&_strong]:text-foreground [&_strong]:font-semibold">
        <Markdown>{section.body}</Markdown>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function BriefingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[40, 60, 48, 52].map((w, i) => (
        <div key={i} className="h-3 rounded-full bg-surface-hover" style={{ width: `${w}%` }} />
      ))}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {[1, 2].map(i => (
          <div key={i} className="rounded-sm border border-border p-4 space-y-2">
            <div className="h-2.5 w-24 rounded-full bg-surface-hover" />
            <div className="h-2 w-full rounded-full bg-surface-hover" />
            <div className="h-2 w-4/5 rounded-full bg-surface-hover" />
            <div className="h-2 w-3/5 rounded-full bg-surface-hover" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { accessToken } = useAuth();
  const [briefing, setBriefing]           = useState('');
  const [sections, setSections]           = useState<Section[]>([]);
  const [loadingBriefing, setLoading]     = useState(false);
  const [briefingTime, setBriefingTime]   = useState('');
  const [files, setFiles]                 = useState<any[]>([]);
  const [meetingOut, setMeetingOut]       = useState('');
  const [meetingLoading, setMeetingLoad]  = useState(false);
  const [meetingOpen, setMeetingOpen]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => { if (accessToken) loadFiles(); }, [accessToken]);

  const loadFiles = async () => {
    try { setFiles((await fetchRecentDriveFiles(accessToken!, '')).slice(0, 4)); }
    catch (e) { console.error(e); }
  };

  const runAnalysis = async () => {
    if (!accessToken) { alert('Connect Google account first.'); return; }
    setLoading(true); setBriefing(''); setSections([]);
    try {
      const [emails, driveFiles] = await Promise.all([
        fetchRecentEmails(accessToken, 'is:unread'),
        fetchRecentDriveFiles(accessToken, ''),
      ]);
      const result = await generateBriefing(emails, driveFiles);
      setBriefing(result);
      setSections(parseSections(result));
      setBriefingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setBriefing('Error: ' + e.message);
      setSections([]);
    } finally { setLoading(false); }
  };

  const runMeeting = async () => {
    if (!accessToken) { alert('Connect Google account first.'); return; }
    setMeetingLoad(true); setMeetingOut('');
    try {
      const [emails, driveFiles] = await Promise.all([
        fetchRecentEmails(accessToken, 'meeting OR notes'),
        fetchRecentDriveFiles(accessToken, 'name contains "meeting"'),
      ]);
      setMeetingOut(await generateMeetingIntelligence(driveFiles, emails));
    } catch (e: any) { setMeetingOut('Error: ' + e.message); }
    finally { setMeetingLoad(false); }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted mb-1">{today}</p>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">Nexus Hub</h1>
          </div>
          <span className={`inline-flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1 rounded-full border
            ${accessToken
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${accessToken ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
            <span>{accessToken ? 'Google connected' : 'Not connected'}</span>
          </span>
        </div>

        {/* ── Daily Synthesis card ── */}
        <div className="border border-border rounded-sm overflow-hidden shadow-sm">

          {/* Card toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface">
            <div className="flex items-center space-x-2">
              <Cpu size={15} className="text-foreground" />
              <span className="text-sm font-semibold text-foreground">Daily Synthesis</span>
              {briefingTime && (
                <span className="text-[10px] text-muted font-medium">· {briefingTime}</span>
              )}
            </div>
            <button
              onClick={runAnalysis}
              disabled={loadingBriefing}
              className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest
                text-muted hover:text-foreground border border-border hover:border-border-strong
                bg-background hover:bg-surface px-3 py-1.5 rounded-sm transition-all disabled:opacity-40"
            >
              {loadingBriefing
                ? <Loader2 size={11} className="animate-spin" />
                : <RefreshCw size={11} />}
              <span>{briefing ? 'Refresh' : 'Run Synthesis'}</span>
            </button>
          </div>

          {/* Card body */}
          <div className="px-5 py-5 bg-background min-h-[140px]">
            {loadingBriefing ? (
              <BriefingSkeleton />

            ) : sections.length > 0 ? (
              /* ── Structured section cards ── */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Today's Summary spans full width if it exists */}
                {sections.filter(s => s.kind === 'summary').map((s, i) => (
                  <div key={i} className="md:col-span-2">
                    <SectionCard section={s} />
                  </div>
                ))}
                {sections.filter(s => s.kind !== 'summary').map((s, i) => (
                  <SectionCard key={i} section={s} />
                ))}
              </div>

            ) : briefing ? (
              /* ── Fallback: model didn't use ## headings, show clean prose ── */
              <div className="prose dark:prose-invert prose-sm max-w-none text-foreground-muted
                prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-foreground">
                <Markdown>{briefing}</Markdown>
              </div>

            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-11 h-11 rounded-sm border border-border bg-surface flex items-center justify-center">
                  <Cpu size={18} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">No briefing yet</p>
                  <p className="text-xs text-muted">Run Synthesis to analyze unread emails and Drive activity.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* System Core */}
          <div className="border border-border rounded-sm p-5 bg-background">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-foreground">System Core</span>
              <Activity size={14} className="text-muted" />
            </div>
            <div className="space-y-0 divide-y divide-border">
              {[
                { label: 'Google Mail',    ok: !!accessToken },
                { label: 'Google Drive',   ok: !!accessToken },
                { label: 'Workspace Auth', ok: true },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-muted">{label}</span>
                  <span className={`inline-flex items-center space-x-1.5 text-[10px] font-semibold uppercase tracking-wider ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                    <span>{ok ? 'Connected' : 'Offline'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Synthesis */}
          <div
            onClick={() => setMeetingOpen(true)}
            className="border border-border rounded-sm p-5 bg-background hover:bg-surface transition-colors cursor-pointer group flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-8 h-8 rounded-sm border border-border bg-surface group-hover:bg-background flex items-center justify-center transition-colors">
                <FileText size={14} className="text-foreground" />
              </div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Workflow</span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1.5">Meeting Synthesis</p>
            <p className="text-xs text-muted leading-relaxed flex-1">
              Synthesize meeting notes and email threads into a clean structured brief.
            </p>
            <div className="mt-4 inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">
              <span>Run</span><ChevronRight size={11} />
            </div>
          </div>

          {/* Recent Drive */}
          <div className="border border-border rounded-sm p-5 bg-background flex flex-col">
            <p className="text-sm font-semibold text-foreground mb-4">Recent Drive</p>
            <div className="flex-1 space-y-2.5">
              {files.length > 0 ? files.map(f => (
                <div
                  key={f.id}
                  onClick={() => window.open(f.webViewLink, '_blank')}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <HardDrive size={12} className="text-muted flex-shrink-0" />
                    <span className="text-xs text-foreground-muted truncate group-hover:text-foreground transition-colors">{f.name}</span>
                  </div>
                  <ChevronRight size={11} className="text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )) : (
                <p className="text-xs text-muted">No recent files.</p>
              )}
            </div>
            <button
              onClick={() => navigate('/drive')}
              className="mt-4 w-full py-2 border border-border text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface rounded-sm transition-colors"
            >
              View Directory
            </button>
          </div>
        </div>

        {/* Draft Document row */}
        <div
          onClick={() => navigate('/docs')}
          className="border border-border rounded-sm px-5 py-4 bg-background hover:bg-surface transition-colors cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded-sm border border-border bg-surface group-hover:bg-background flex items-center justify-center transition-colors">
              <Activity size={14} className="text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Draft Document</p>
              <p className="text-xs text-muted mt-0.5">Open the minimalist editor to write without distractions.</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-muted group-hover:text-foreground transition-colors flex-shrink-0" />
        </div>

      </div>

      {/* ── Meeting Modal ── */}
      {meetingOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
          <div className="bg-background border border-border shadow-xl w-full max-w-3xl h-full md:h-auto md:max-h-[80vh] flex flex-col rounded-sm overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Meeting Synthesis</h2>
                <p className="text-xs text-muted mt-0.5">Scanning Drive and Mail for meeting context…</p>
              </div>
              <button onClick={() => setMeetingOpen(false)} className="text-muted hover:text-foreground p-1 -mr-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-surface">
              {!meetingOut && !meetingLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <div className="w-12 h-12 border border-border bg-background rounded-sm flex items-center justify-center">
                    <FileText size={20} className="text-muted" />
                  </div>
                  <p className="text-xs text-muted max-w-xs">Click below to scan recent emails and Drive files for meeting context.</p>
                  <button
                    onClick={runMeeting}
                    className="bg-foreground text-background px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-foreground-hover transition-colors"
                  >
                    Execute Synthesis
                  </button>
                </div>
              ) : meetingLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Processing…</p>
                </div>
              ) : (
                <div className="bg-background border border-border rounded-sm p-6">
                  <div className="prose dark:prose-invert prose-sm max-w-none text-foreground-muted
                    prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-headings:text-foreground">
                    <Markdown>{meetingOut}</Markdown>
                  </div>
                  <div className="mt-6 pt-5 border-t border-border flex justify-end space-x-4">
                    <button onClick={() => setMeetingOut('')} className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
                      Clear
                    </button>
                    <button
                      onClick={() => { alert('Saved.'); setMeetingOpen(false); }}
                      className="bg-foreground text-background px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-foreground-hover transition-colors"
                    >
                      Save Context
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
