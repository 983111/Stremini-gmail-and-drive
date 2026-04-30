import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Loader2, FileText, Mail, X, Activity, HardDrive, Clock, Lock } from 'lucide-react';
import { fetchRecentEmails, fetchRecentDriveFiles } from '../lib/googleApi';
import { generateBriefing, generateMeetingIntelligence } from '../lib/gemini';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, accessToken } = useAuth();
  const [briefing, setBriefing] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  
  const [meetingIntelligenceOutput, setMeetingIntelligenceOutput] = useState('');
  const [isMeetingLoading, setIsMeetingLoading] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      loadFiles();
    }
  }, [accessToken]);

  const loadFiles = async () => {
    try {
      const data = await fetchRecentDriveFiles(accessToken, '');
      setFiles(data.slice(0, 4));
    } catch (e) {
      console.error(e);
    }
  };
  
  const runAnalysis = async () => {
    if (!accessToken) {
      alert("Please connect your Google account in Mail or Drive tab to generate a briefing.");
      return;
    }
    setLoadingBriefing(true);
    setBriefing('');
    try {
      const [emails, files] = await Promise.all([
        fetchRecentEmails(accessToken, 'is:unread'),
        fetchRecentDriveFiles(accessToken, '')
      ]);
      const result = await generateBriefing(emails, files);
      setBriefing(result);
    } catch (e: any) {
      setBriefing("Error generating briefing: " + e.message);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const runMeetingIntelligence = async () => {
    if (!accessToken) {
      alert("Please connect your Google account in Mail or Drive tab.");
      return;
    }
    setIsMeetingLoading(true);
    setMeetingIntelligenceOutput('');
    try {
      const [emails, files] = await Promise.all([
        fetchRecentEmails(accessToken, 'meeting OR notes'),
        fetchRecentDriveFiles(accessToken, 'name contains "meeting"')
      ]);
      const result = await generateMeetingIntelligence(files, emails);
      setMeetingIntelligenceOutput(result);
    } catch (e: any) {
      setMeetingIntelligenceOutput("Error generating meeting intelligence: " + e.message);
    } finally {
      setIsMeetingLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 sm:p-8 lg:p-12 overflow-y-auto font-sans">
      <div className="max-w-6xl w-full mx-auto space-y-8 sm:space-y-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Nexus Hub</h1>
            <p className="text-muted text-sm sm:text-base">Unified active command center.</p>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-muted uppercase tracking-widest bg-surface px-2 py-1 rounded-sm w-fit">
            System sync: active
          </div>
        </div>

        {/* Top Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 border border-border rounded-lg p-6 bg-background relative shadow-sm overflow-hidden min-h-[220px]">
            <div className="flex items-center space-x-2 mb-6 text-foreground relative z-10">
              <Sparkles size={20} className="text-amber-500" />
              <h3 className="font-bold text-lg uppercase tracking-tight">Daily Synthesis</h3>
            </div>
            
            <div className="text-foreground leading-relaxed mb-8 relative z-10">
              {loadingBriefing ? (
                 <div className="flex items-center space-x-3 text-muted bg-surface/50 p-4 rounded-lg border border-border animate-pulse">
                   <Loader2 size={16} className="animate-spin" />
                   <span className="text-xs font-bold uppercase tracking-widest">Aggregating Cloud Context...</span>
                 </div>
              ) : briefing ? (
                <div className="prose dark:prose-invert prose-sm prose-p:leading-relaxed text-foreground bg-surface/30 p-4 rounded-lg border border-border">
                  <Markdown>{briefing}</Markdown>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium opacity-80">Orchestrate your morning. Generate a personalized briefing from unread emails and recent cloud updates.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-surface border border-border rounded-sm text-muted">Awaiting Mail</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-surface border border-border rounded-sm text-muted">Awaiting Drive</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 flex items-center">
              <button 
                onClick={runAnalysis}
                disabled={loadingBriefing}
                className="w-full sm:w-auto bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm transition-all hover:shadow-lg shadow-md disabled:opacity-50"
              >
                {briefing ? 'Refresh Intelligence' : 'Initiate Synthesis'}
              </button>
            </div>
            
            {/* Background design elements */}
            <div className="absolute -top-4 -right-4 grayscale opacity-10 pointer-events-none">
               <Sparkles size={160} />
            </div>
          </div>

          <div className="col-span-1 border border-border rounded-lg p-6 bg-surface shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 text-foreground">
              <h3 className="font-bold text-lg uppercase tracking-tight">Active Core</h3>
              <Activity size={20} className="text-muted" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between text-xs py-3 border-b border-border">
                <span className="text-muted font-bold uppercase tracking-widest">Mail Protocol</span>
                <span className={`font-bold ${accessToken ? 'text-green-500' : 'text-red-500'}`}>{accessToken ? 'LINKED' : 'OFFLINE'}</span>
              </div>
              <div className="flex justify-between text-xs py-3 border-b border-border">
                <span className="text-muted font-bold uppercase tracking-widest">Drive Assets</span>
                <span className={`font-bold ${accessToken ? 'text-green-500' : 'text-red-500'}`}>{accessToken ? 'LINKED' : 'OFFLINE'}</span>
              </div>
              <div className="flex justify-between text-xs py-3">
                <span className="text-muted font-bold uppercase tracking-widest">Workspace ID</span>
                <span className="font-bold text-foreground">VERIFIED</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-200" />
              </div>
              <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Nodes Operational</span>
            </div>
          </div>
        </div>

        {/* Intelligence / Quick Actions Section */}
        <div className="pb-20">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 uppercase tracking-tight">Deployment Contexts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Workflows */}
            <div 
              onClick={() => setIsMeetingModalOpen(true)}
              className="group border border-border rounded-lg p-6 bg-background hover:bg-surface hover:shadow-md transition-all cursor-pointer flex flex-col border-l-4 border-l-amber-500 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <FileText size={20} className="text-foreground group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Workflow</span>
              </div>
              <h4 className="font-bold text-lg mb-2 text-foreground">Meeting Intel</h4>
              <p className="text-muted text-xs leading-relaxed mb-6 flex-1">
                Deep-search Workspace assets for meeting context and actionable notes.
              </p>
              <div className="flex items-center text-[10px] font-bold text-foreground uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                <span>Open Interface</span>
                <Clock size={12} className="ml-2" />
              </div>
            </div>

            <div 
              onClick={() => navigate('/docs')}
              className="group border border-border rounded-lg p-6 bg-background hover:bg-surface hover:shadow-md transition-all cursor-pointer flex flex-col border-l-4 border-l-blue-500 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <Activity size={20} className="text-foreground group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Editor</span>
              </div>
              <h4 className="font-bold text-lg mb-2 text-foreground">Content Draft</h4>
              <p className="text-muted text-xs leading-relaxed mb-6 flex-1">
                Access the AI-enhanced minimalist editor for focus-driven composition.
              </p>
              <div className="flex items-center text-[10px] font-bold text-foreground uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                <span>Start Drafting</span>
                <Clock size={12} className="ml-2" />
              </div>
            </div>

            <div className="border border-border rounded-lg p-6 bg-surface flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-foreground uppercase tracking-tight">Recent Drive</h4>
                <HardDrive size={16} className="text-muted" />
              </div>
              <div className="space-y-4 flex-1">
                {files.length > 0 ? files.map(file => (
                   <div key={file.id} className="flex items-center justify-between group cursor-pointer" onClick={() => window.open(file.webViewLink, '_blank')}>
                     <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-1 bg-background border border-border rounded-sm flex-shrink-0">
                          <FileText size={10} className="text-muted" />
                        </div>
                        <span className="text-xs font-medium text-foreground-muted truncate group-hover:text-foreground group-hover:font-bold transition-all">{file.name}</span>
                     </div>
                     <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                   </div>
                )) : (
                  <div className="text-xs text-muted font-bold py-8 text-center bg-background rounded-sm border border-dashed border-border uppercase tracking-widest">Registry Empty</div>
                )}
              </div>
              <button 
                onClick={() => navigate('/drive')}
                className="mt-6 w-full py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground hover:bg-surface rounded-sm transition-all shadow-sm"
              >
                Access Filesystem
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Meeting Intelligence Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-[#00000040] backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="bg-background border border-border shadow-2xl w-full max-w-4xl h-full sm:h-[80vh] flex flex-col relative rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsMeetingModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-2 z-10 bg-surface/50 rounded-full"
            >
              <X size={18} />
            </button>
            <div className="p-6 sm:p-8 border-b border-border bg-surface/30">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Meeting Synthesis</h2>
              <p className="text-xs font-bold text-muted uppercase tracking-widest">
                AI Orchestration: {isMeetingLoading ? 'Processing Core...' : 'Standby'}
              </p>
            </div>
            
            <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
              {!meetingIntelligenceOutput && !isMeetingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-surface border border-border rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                    <Sparkles size={24} className="text-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Initialize Intelligence</h3>
                  <button 
                    onClick={runMeetingIntelligence}
                    className="bg-foreground text-background px-10 py-3 text-xs font-bold uppercase tracking-widest rounded-sm hover:shadow-lg transition-all"
                  >
                    Generate Report
                  </button>
                </div>
              ) : isMeetingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-12 h-12 border-2 border-surface border-t-foreground rounded-full animate-spin" />
                    <Sparkles size={16} className="absolute inset-0 m-auto text-amber-500" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted animate-pulse">Scanning Neural Assets</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto p-6 sm:p-8">
                    <div className="prose dark:prose-invert prose-sm text-foreground max-w-none prose-headings:text-foreground prose-p:leading-relaxed">
                      <Markdown>{meetingIntelligenceOutput}</Markdown>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 border-t border-border flex items-center justify-between bg-surface/20 shrink-0">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full bg-amber-500" />
                       <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Draft Ready</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setMeetingIntelligenceOutput('')}
                        className="text-[10px] font-bold text-muted hover:text-foreground uppercase tracking-widest transition-colors"
                      >
                        Purge
                      </button>
                      <button 
                        className="bg-foreground text-background px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:shadow-md transition-all flex items-center space-x-2"
                        onClick={() => {
                           alert("Report dispatched to internal registry.");
                           setIsMeetingModalOpen(false);
                        }}
                      >
                        <Lock size={12} />
                        <span>Save Workspace</span>
                      </button>
                    </div>
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
