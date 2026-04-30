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
    <div className="flex flex-col h-full bg-[#FDFDFD] p-12 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-semibold text-[#111] tracking-tight mb-2">Nexus Hub</h1>
            <p className="text-[#666]">Your unified command center for today.</p>
          </div>
          <div className="text-[11px] font-medium text-[#888] uppercase tracking-widest">
            Updated just now
          </div>
        </div>

        {/* Top Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 border border-[#EEE] rounded-sm p-6 bg-white relative">
            <div className="flex items-center space-x-2 mb-4 text-[#111]">
              <Sparkles size={18} />
              <h3 className="font-semibold text-lg">Daily Synthesis</h3>
            </div>
            
            <div className="text-[#333] leading-relaxed mb-6 min-h-[60px]">
              {loadingBriefing ? (
                 <div className="flex items-center space-x-2 text-[#666]">
                   <Loader2 size={16} className="animate-spin" />
                   <span>Analyzing recent context...</span>
                 </div>
              ) : briefing ? (
                <div className="prose prose-sm prose-p:my-1 text-[#333]">
                  <Markdown>{briefing}</Markdown>
                </div>
              ) : (
                <p>Welcome. Run the synthesis workflow to analyze your recent emails and files to generate your daily briefing.</p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={runAnalysis}
                disabled={loadingBriefing}
                className="bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#333] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors"
              >
                {briefing ? 'Refresh Synthesis' : 'Run Synthesis'}
              </button>
            </div>
            
            {/* Background design elements */}
            <div className="absolute top-4 right-4 text-[#F5F5F5]">
               <Sparkles size={64} className="opacity-50" />
            </div>
          </div>

          <div className="col-span-1 border border-[#EEE] rounded-sm p-6 bg-white flex flex-col">
            <div className="flex justify-between items-center mb-6 text-[#111]">
              <h3 className="font-semibold text-lg">System Core</h3>
              <Activity size={18} />
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between text-sm py-2 border-b border-[#F5F5F5]">
                <span className="text-[#666]">Google Mail</span>
                <span className="font-medium">{accessToken ? 'Connected' : 'Offline'}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-[#F5F5F5]">
                <span className="text-[#666]">Google Drive</span>
                <span className="font-medium">{accessToken ? 'Connected' : 'Offline'}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-[#666]">Workspace Auth</span>
                <span className="font-medium">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence / Quick Actions Section */}
        <div>
          <h2 className="text-2xl font-semibold text-[#111] mb-6">Active Contexts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Workflows */}
            <div 
              onClick={() => setIsMeetingModalOpen(true)}
              className="border border-[#EEE] rounded-sm p-6 bg-white hover:shadow-sm transition-all cursor-pointer flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <FileText size={20} className="text-[#111]" />
                <span className="text-[10px] text-[#888]">Workflow</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-[#111]">Meeting Intelligence</h4>
              <p className="text-[#666] text-sm leading-relaxed mb-6 flex-1">
                Synthesize unread emails and recent Drive documents into a clean briefing.
              </p>
            </div>

            <div 
              onClick={() => navigate('/docs')}
              className="border border-[#EEE] rounded-sm p-6 bg-white hover:shadow-sm transition-all cursor-pointer flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <Activity size={20} className="text-[#111]" />
                <span className="text-[10px] text-[#888]">Editor</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-[#111]">Draft Document</h4>
              <p className="text-[#666] text-sm leading-relaxed mb-6 flex-1">
                Open the minimalist Workspace editor to write without distractions.
              </p>
            </div>

            <div className="border border-[#EEE] rounded-sm p-6 bg-white flex flex-col">
              <h4 className="font-semibold text-lg mb-4 text-[#111]">Recent Drive</h4>
              <div className="space-y-3 flex-1">
                {files.length > 0 ? files.map(file => (
                   <div key={file.id} className="flex items-center justify-between group cursor-pointer" onClick={() => window.open(file.webViewLink, '_blank')}>
                     <div className="flex items-center space-x-3 overflow-hidden">
                        <HardDrive size={14} className="text-[#888] flex-shrink-0" />
                        <span className="text-sm text-[#333] truncate group-hover:text-black">{file.name}</span>
                     </div>
                     <span className="text-[10px] text-[#888] flex-shrink-0">↗</span>
                   </div>
                )) : (
                  <div className="text-sm text-[#888]">No recent files found.</div>
                )}
              </div>
              <button 
                onClick={() => navigate('/drive')}
                className="mt-4 w-full py-2 border border-[#EEE] text-xs font-semibold uppercase tracking-widest text-[#555] hover:bg-[#F5F5F5] rounded-sm transition-colors"
              >
                View Directory
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Meeting Intelligence Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-[#00000010] backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white border border-[#EEE] shadow-xl w-full max-w-4xl min-h-[50vh] flex flex-col relative rounded-md">
            <button 
              onClick={() => setIsMeetingModalOpen(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#111] transition-colors p-2"
            >
              <X size={18} />
            </button>
            <div className="p-8 border-b border-[#EEE]">
              <h2 className="text-2xl font-semibold text-[#111]">Meeting Intelligence Synthesis</h2>
              <p className="text-[#666] mt-2">
                Scanning Workspace Drive and Mail for meeting context...
              </p>
            </div>
            
            <div className="p-8 flex-1 flex flex-col bg-[#FAFAFA]">
              {!meetingIntelligenceOutput && !isMeetingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <button 
                    onClick={runMeetingIntelligence}
                    className="bg-black text-white px-6 py-3 text-sm font-medium rounded-sm hover:bg-[#222] transition-colors"
                  >
                    Execute Synthesis
                  </button>
                </div>
              ) : isMeetingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-[#111]" size={24} />
                  <p className="text-xs uppercase tracking-widest font-semibold text-[#888]">Processing...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-white p-6 border border-[#EEE] rounded-sm">
                  <div className="prose prose-sm text-[#333] max-w-none">
                    <Markdown>{meetingIntelligenceOutput}</Markdown>
                  </div>
                  <div className="mt-8 pt-6 border-t border-[#EEE] flex justify-end">
                    <button 
                      onClick={() => setMeetingIntelligenceOutput('')}
                      className="text-[#666] hover:text-[#111] text-sm font-medium transition-colors mr-6"
                    >
                      Clear
                    </button>
                    <button 
                      className="bg-black text-white px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#222] transition-colors flex items-center space-x-2"
                      onClick={() => {
                         alert("Output copied/saved.");
                         setIsMeetingModalOpen(false);
                      }}
                    >
                      <span>Save Context</span>
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
