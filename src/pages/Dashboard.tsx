import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, Loader2, FileText, X, Activity, HardDrive, Zap, AlertTriangle, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchRecentEmails, fetchRecentDriveFiles } from '../lib/googleApi';
import { generateBriefing, generateMeetingIntelligence } from '../lib/gemini';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

// ─── Parse markdown briefing into sections ───────────────────────────────────
interface BriefingSection {
  title: string;
  content: string;
  icon: 'summary' | 'urgent' | 'followup' | 'financial';
}

function parseBriefing(markdown: string): BriefingSection[] {
  if (!markdown.trim()) return [];
  const sections: BriefingSection[] = [];
  // Split on ## headings
  const parts = markdown.split(/^##\s+/m).filter(Boolean);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    const title = newline !== -1 ? part.slice(0, newline).trim() : part.trim();
    const content = newline !== -1 ? part.slice(newline + 1).trim() : '';
    if (!title) continue;
    const lower = title.toLowerCase();
    let icon: BriefingSection['icon'] = 'summary';
    if (lower.includes('urgent') || lower.includes('alert')) icon = 'urgent';
    else if (lower.includes('follow')) icon = 'followup';
    else if (lower.includes('financial')) icon = 'financial';
    sections.push({ title, content, icon });
  }
  return sections;
}

// ─── Section card config ──────────────────────────────────────────────────────
const SECTION_CONFIG = {
  summary:   { color: 'from-zinc-50 to-white border-zinc-200',       badge: 'bg-zinc-900 text-white',      dot: 'bg-zinc-400' },
  urgent:    { color: 'from-red-50 to-white border-red-200',         badge: 'bg-red-600 text-white',       dot: 'bg-red-500'  },
  followup:  { color: 'from-amber-50 to-white border-amber-200',     badge: 'bg-amber-500 text-white',     dot: 'bg-amber-400'},
  financial: { color: 'from-emerald-50 to-white border-emerald-200', badge: 'bg-emerald-600 text-white',   dot: 'bg-emerald-500'},
};

function SectionIcon({ type }: { type: BriefingSection['icon'] }) {
  const cls = 'w-4 h-4';
  if (type === 'urgent')    return <AlertTriangle className={cls} />;
  if (type === 'followup')  return <Clock className={cls} />;
  if (type === 'financial') return <Activity className={cls} />;
  return <Cpu className={cls} />;
}

export function Dashboard() {
  const { user, accessToken } = useAuth();
  const [briefing, setBriefing] = useState('');
  const [briefingSections, setBriefingSections] = useState<BriefingSection[]>([]);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingTime, setBriefingTime] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);

  const [meetingLogicOutput, setMeetingLogicOutput] = useState('');
  const [isMeetingLoading, setIsMeetingLoading] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) loadFiles();
  }, [accessToken]);

  const loadFiles = async () => {
    try {
      const data = await fetchRecentDriveFiles(accessToken!, '');
      setFiles(data.slice(0, 4));
    } catch (e) {
      console.error(e);
    }
  };

  const runAnalysis = async () => {
    if (!accessToken) {
      alert('Please connect your Google account in Mail or Drive tab to generate a briefing.');
      return;
    }
    setLoadingBriefing(true);
    setBriefing('');
    setBriefingSections([]);
    try {
      const [emails, driveFiles] = await Promise.all([
        fetchRecentEmails(accessToken, 'is:unread'),
        fetchRecentDriveFiles(accessToken, ''),
      ]);
      const result = await generateBriefing(emails, driveFiles);
      setBriefing(result);
      setBriefingSections(parseBriefing(result));
      setBriefingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setBriefing('Error generating briefing: ' + e.message);
      setBriefingSections([]);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const runMeetingIntelligence = async () => {
    if (!accessToken) {
      alert('Please connect your Google account in Mail or Drive tab.');
      return;
    }
    setIsMeetingLoading(true);
    setMeetingLogicOutput('');
    try {
      const [emails, driveFiles] = await Promise.all([
        fetchRecentEmails(accessToken, 'meeting OR notes'),
        fetchRecentDriveFiles(accessToken, 'name contains "meeting"'),
      ]);
      const result = await generateMeetingIntelligence(driveFiles, emails);
      setMeetingLogicOutput(result);
    } catch (e: any) {
      setMeetingLogicOutput('Error generating meeting synthesis: ' + e.message);
    } finally {
      setIsMeetingLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12 space-y-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted mb-1">{today}</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Nexus Hub</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${accessToken ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
            <span className="text-xs text-muted font-medium">{accessToken ? 'Google connected' : 'Not connected'}</span>
          </div>
        </div>

        {/* ── Daily Synthesis Card ── */}
        <div className="border border-border rounded-sm overflow-hidden bg-background shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
            <div className="flex items-center space-x-2.5">
              <Cpu size={16} className="text-foreground" />
              <span className="font-semibold text-sm text-foreground tracking-tight">Daily Synthesis</span>
              {briefingTime && (
                <span className="text-[10px] text-muted font-medium tracking-widest uppercase">· {briefingTime}</span>
              )}
            </div>
            <button
              onClick={runAnalysis}
              disabled={loadingBriefing}
              className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground border border-border hover:border-border-strong bg-background hover:bg-surface px-3 py-1.5 rounded-sm transition-all disabled:opacity-40"
            >
              {loadingBriefing
                ? <Loader2 size={12} className="animate-spin" />
                : <RefreshCw size={12} className={briefing ? 'opacity-100' : 'opacity-60'} />
              }
              <span>{briefing ? 'Refresh' : 'Run Synthesis'}</span>
            </button>
          </div>

          {/* Card body */}
          <div className="px-6 py-5 min-h-[120px]">
            {loadingBriefing ? (
              /* ── Loading state ── */
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-border animate-spin border-t-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">Analyzing your workspace…</p>
                  <p className="text-xs text-muted">Reading emails and Drive activity</p>
                </div>
              </div>

            ) : briefingSections.length > 0 ? (
              /* ── Parsed sections ── */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {briefingSections.map((section, i) => {
                  const cfg = SECTION_CONFIG[section.icon];
                  return (
                    <div
                      key={i}
                      className={`rounded-sm border bg-gradient-to-b ${cfg.color} p-4 flex flex-col gap-3`}
                    >
                      {/* Section header */}
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                          <SectionIcon type={section.icon} />
                          <span>{section.title}</span>
                        </span>
                      </div>
                      {/* Section content */}
                      <div className="text-xs text-foreground-muted leading-relaxed prose prose-xs dark:prose-invert max-w-none
                        prose-p:my-1 prose-li:my-0.5 prose-ul:pl-4 prose-strong:text-foreground prose-headings:text-foreground">
                        <Markdown>{section.content}</Markdown>
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : briefing && !briefingSections.length ? (
              /* ── Fallback: no ## headings, show raw markdown nicely ── */
              <div className="prose dark:prose-invert prose-sm max-w-none text-foreground-muted
                prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-headings:text-foreground">
                <Markdown>{briefing}</Markdown>
              </div>

            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-sm bg-surface border border-border flex items-center justify-center">
                  <Cpu size={20} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">No briefing yet</p>
                  <p className="text-xs text-muted max-w-xs">
                    Run Synthesis to analyze your unread emails and recent Drive activity.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── System Status + Quick actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* System Core */}
          <div className="border border-border rounded-sm p-5 bg-background flex flex-col">
            <div className="flex justify-between items-center mb-5 text-foreground">
              <h3 className="font-semibold text-sm">System Core</h3>
              <Activity size={15} className="text-muted" />
            </div>
            <div className="space-y-3 flex-1 text-sm">
              {[
                { label: 'Google Mail',     ok: !!accessToken },
                { label: 'Google Drive',    ok: !!accessToken },
                { label: 'Workspace Auth',  ok: true          },
              ].map(({ label, ok }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <span className="text-muted">{label}</span>
                  <span className={`flex items-center space-x-1.5 font-medium text-xs ${ok ? 'text-emerald-600' : 'text-muted'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                    <span>{ok ? 'Connected' : 'Offline'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Synthesis */}
          <div
            onClick={() => setIsMeetingModalOpen(true)}
            className="border border-border rounded-sm p-5 bg-background hover:bg-surface transition-all cursor-pointer flex flex-col group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-9 h-9 rounded-sm bg-surface border border-border flex items-center justify-center group-hover:bg-background transition-colors">
                <FileText size={16} className="text-foreground" />
              </div>
              <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">Workflow</span>
            </div>
            <h4 className="font-semibold text-sm mb-1.5 text-foreground">Meeting Synthesis</h4>
            <p className="text-muted text-xs leading-relaxed flex-1">
              Synthesize meeting notes and email threads into a structured brief.
            </p>
            <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-foreground transition-colors space-x-1">
              <span>Run</span><ChevronRight size={12} />
            </div>
          </div>

          {/* Recent Drive */}
          <div className="border border-border rounded-sm p-5 bg-background flex flex-col">
            <h4 className="font-semibold text-sm mb-4 text-foreground">Recent Drive</h4>
            <div className="space-y-2.5 flex-1">
              {files.length > 0 ? files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => window.open(file.webViewLink, '_blank')}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <HardDrive size={13} className="text-muted flex-shrink-0" />
                    <span className="text-xs text-foreground-muted truncate group-hover:text-foreground transition-colors">{file.name}</span>
                  </div>
                  <ChevronRight size={12} className="text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )) : (
                <p className="text-xs text-muted">No recent files found.</p>
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

        {/* ── Draft Document CTA ── */}
        <div
          onClick={() => navigate('/docs')}
          className="border border-border rounded-sm p-5 bg-background hover:bg-surface transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 rounded-sm bg-surface border border-border flex items-center justify-center group-hover:bg-background transition-colors">
              <Activity size={16} className="text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Draft Document</h4>
              <p className="text-xs text-muted mt-0.5">Open the minimalist editor to write without distractions.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted group-hover:text-foreground transition-colors flex-shrink-0" />
        </div>

      </div>

      {/* ── Meeting Intelligence Modal ── */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
          <div className="bg-background border border-border shadow-xl w-full max-w-4xl h-full md:h-auto md:min-h-[50vh] flex flex-col relative rounded-sm overflow-hidden">
            <button
              onClick={() => setIsMeetingModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-2 z-10"
            >
              <X size={18} />
            </button>

            <div className="p-6 md:p-8 border-b border-border">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Meeting Synthesis</h2>
              <p className="text-sm text-muted mt-1">Scanning Drive and Mail for meeting context…</p>
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col bg-surface overflow-y-auto">
              {!meetingLogicOutput && !isMeetingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-sm border border-border bg-background flex items-center justify-center">
                    <FileText size={22} className="text-muted" />
                  </div>
                  <p className="text-sm text-muted max-w-xs">Click below to scan your recent emails and Drive files for meeting context.</p>
                  <button
                    onClick={runMeetingIntelligence}
                    className="bg-foreground text-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-foreground-hover transition-colors"
                  >
                    Execute Synthesis
                  </button>
                </div>
              ) : isMeetingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-2 border-border animate-spin border-t-foreground" />
                  <p className="text-xs uppercase tracking-widest font-semibold text-muted">Processing…</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-background p-6 border border-border rounded-sm">
                  <div className="prose dark:prose-invert prose-sm text-foreground-muted max-w-none
                    prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-headings:text-foreground">
                    <Markdown>{meetingLogicOutput}</Markdown>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border flex justify-end space-x-4">
                    <button
                      onClick={() => setMeetingLogicOutput('')}
                      className="text-muted hover:text-foreground text-xs font-semibold uppercase tracking-widest transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => { alert('Output saved.'); setIsMeetingModalOpen(false); }}
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
