import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentEmails, sendEmail } from '../lib/googleApi';
import { Search, Loader2, RefreshCw, PenSquare, Send, X, Save, Sparkles, Mail as MailIcon, Wand2 } from 'lucide-react';
import { summarizeThread, draftEmailWithAI } from '../lib/gemini';
import Markdown from 'react-markdown';

export function Mail() {
  const { accessToken, signIn } = useAuth();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem('stremini_mail_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setComposeTo(parsed.to || '');
        setComposeSubject(parsed.subject || '');
        setComposeBody(parsed.body || '');
      } catch(e) {}
    }
  }, []);

  const loadEmails = async (q: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecentEmails(accessToken, q);
      setEmails(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred fetching emails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadEmails('');
    }
  }, [accessToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let finalQuery = query;
    if (finalQuery && searchFilter !== 'all') {
      finalQuery = `${searchFilter}:${query}`;
    }
    loadEmails(finalQuery);
  };

  const handleSummarize = async (email: any) => {
    setIsAiLoading(true);
    setAiSummary('');
    try {
      const summary = await summarizeThread([email]);
      setAiSummary(summary);
    } catch (e: any) {
      setAiSummary('Error: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!accessToken) return;
    setIsSending(true);
    try {
      await sendEmail(accessToken, composeTo, composeSubject, composeBody);
      localStorage.removeItem('stremini_mail_draft');
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setPreviewMode(false);
      alert('Email sent successfully!');
    } catch (e: any) {
      alert('Failed to send email: ' + e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('stremini_mail_draft', JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }));
    alert('Draft saved locally!');
    setIsComposing(false);
  };

  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard this draft?')) {
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setDraftPrompt('');
      localStorage.removeItem('stremini_mail_draft');
      setIsComposing(false);
      setPreviewMode(false);
    }
  };

  const handleDraftWithAI = async () => {
    if (!draftPrompt) return;
    setIsDrafting(true);
    try {
      const draft = await draftEmailWithAI(draftPrompt, composeBody);
      setComposeBody(prev => (prev ? prev + '\n\n' + draft : draft));
      setDraftPrompt('');
    } catch (e: any) {
      alert("Failed to draft with AI: " + e.message);
    } finally {
      setIsDrafting(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Connect Gmail</h2>
        <p className="text-muted mb-8 max-w-md">To access Mail Intelligence, please grant access to your Gmail account.</p>
        <button onClick={signIn} className="bg-foreground text-background px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-foreground-hover transition-colors">
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
      <div className="h-[64px] border-b border-border flex items-center justify-between px-4 sm:px-8 bg-background flex-shrink-0">
        <h1 className="hidden md:block text-xl font-semibold text-foreground">Mail Intelligence</h1>
        <h1 className="md:hidden text-lg font-bold text-foreground">Mail</h1>
        
        <div className="flex items-center space-x-2 sm:space-x-6">
          <form onSubmit={handleSearch} className="relative flex items-center bg-surface rounded-sm border border-border focus-within:border-border-strong transition-colors min-w-0">
            <span className="pl-2 sm:pl-3 text-muted shrink-0">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..." 
              className="w-24 sm:w-48 bg-transparent text-sm px-2 sm:px-3 py-2 outline-none"
            />
            <div className="hidden sm:flex border-l border-border-strong items-center">
              <select 
                 value={searchFilter} 
                 onChange={(e) => setSearchFilter(e.target.value)}
                 className="bg-transparent text-xs text-muted outline-none py-2 pr-2 pl-2 border-none focus:ring-0 cursor-pointer"
              >
                <option value="all">Everywhere</option>
                <option value="from">From</option>
                <option value="to">To</option>
                <option value="subject">Subject</option>
                <option value="after">Date</option>
              </select>
            </div>
          </form>
          <button 
            onClick={() => {
              setIsComposing(true);
              setPreviewMode(false);
              setSelectedEmail(null);
            }} 
            className="p-2 sm:px-4 sm:py-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 hover:bg-foreground-hover transition-colors shadow-sm"
          >
            <PenSquare size={14} />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative">
        {/* Email List - Mobile: Hide if email selected or composing */}
        <div className={`w-full sm:w-[340px] border-r border-border bg-background overflow-auto flex flex-col shrink-0 ${selectedEmail || isComposing ? 'hidden sm:flex' : 'flex'}`}>
          {error && (
            <div className="mx-4 mt-4 p-4 bg-red-50 text-red-800 text-sm border border-red-100 rounded-sm">
              {error}
            </div>
          )}
          {loading ? (
             <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted" /></div>
          ) : emails.length === 0 ? (
             <div className="p-8 text-center text-muted text-sm font-medium">No emails found.</div>
          ) : (
            <div className="divide-y divide-border">
              {emails.map(email => (
                <div 
                  key={email.id} 
                  onClick={() => {
                    setSelectedEmail(email);
                    setIsComposing(false);
                  }}
                  className={`p-4 cursor-pointer hover:bg-surface transition-colors ${selectedEmail?.id === email.id && !isComposing ? 'bg-surface border-l-2 border-foreground' : 'border-l-2 border-transparent'}`}
                >
                  <div className="font-semibold text-foreground text-sm truncate mb-0.5">{email.from}</div>
                  <div className="text-sm font-medium text-foreground-muted truncate mb-1.5">{email.subject}</div>
                  <div className="text-xs text-muted line-clamp-2 leading-relaxed">{email.snippet.replace(/&quot;/g, '"')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail & Compose & AI */}
        <div className={`flex-1 bg-background flex flex-col items-center overflow-auto ${!selectedEmail && !isComposing ? 'hidden sm:flex' : 'flex'}`}>
          {isComposing ? (
            <div className="w-full max-w-3xl p-4 sm:p-12 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setIsComposing(false)} className="sm:hidden p-1 hover:bg-surface rounded-sm">
                    <X size={18} />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Compose Draft</h2>
                </div>
                <div className="flex space-x-2 sm:space-x-4">
                  <button onClick={handleSaveDraft} className="text-[10px] sm:text-xs font-bold text-muted hover:text-foreground uppercase tracking-widest flex items-center space-x-1 transition-colors">
                    <Save size={14} /> <span className="hidden sm:inline">Save</span>
                  </button>
                  <button onClick={handleDiscard} className="text-[10px] sm:text-xs font-bold text-muted hover:text-red-500 uppercase tracking-widest flex items-center space-x-1 transition-colors">
                    <X size={14} /> <span className="hidden sm:inline">Discard</span>
                  </button>
                </div>
              </div>
              
              {!previewMode ? (
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">To</label>
                    <input 
                      type="email" 
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      placeholder="recipient@example.com" 
                      className="w-full bg-surface border border-border p-3 rounded-sm text-sm focus:border-border-strong outline-none transition-colors shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Subject</label>
                    <input 
                      type="text" 
                      value={composeSubject}
                      onChange={e => setComposeSubject(e.target.value)}
                      placeholder="Subject line" 
                      className="w-full bg-surface border border-border p-3 rounded-sm text-sm focus:border-border-strong outline-none transition-colors shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-h-[300px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Message Content</label>
                       <div className="flex border border-border rounded-sm overflow-hidden bg-surface focus-within:border-border-strong w-full sm:w-64 transition-colors shadow-sm">
                          <input 
                            type="text" 
                            className="bg-transparent text-[11px] px-2 py-1.5 outline-none flex-1 text-foreground" 
                            placeholder="Draft with AI prompt..." 
                            value={draftPrompt}
                            onChange={e => setDraftPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleDraftWithAI()}
                          />
                          <button 
                            onClick={handleDraftWithAI} 
                            disabled={isDrafting || !draftPrompt}
                            className="bg-surface-hover px-2 text-muted hover:text-foreground disabled:opacity-50 transition-colors"
                          >
                            {isDrafting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                          </button>
                       </div>
                    </div>
                    <textarea 
                      value={composeBody}
                      onChange={e => setComposeBody(e.target.value)}
                      placeholder="Brainstorm or draft your email here..." 
                      className="w-full h-full bg-surface border border-border p-4 rounded-sm text-sm focus:border-border-strong outline-none transition-colors resize-none text-foreground shadow-sm"
                    />
                  </div>
                  <div className="flex justify-end pt-8 pb-12 border-t border-border mt-auto">
                    <button 
                      onClick={() => setPreviewMode(true)}
                      disabled={!composeTo || !composeSubject || !composeBody}
                      className="w-full sm:w-auto bg-foreground text-background px-8 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all hover:shadow-md disabled:opacity-50"
                    >
                      Process Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-6 pb-12">
                  <div className="bg-surface p-6 border border-border rounded-lg shadow-sm">
                    <div className="mb-6 pb-4 border-b border-border">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4">Transmission Preview</p>
                      <p className="text-sm font-bold text-foreground mb-1 truncate">To: {composeTo}</p>
                      <p className="text-xs text-foreground-muted truncate">Subject: {composeSubject}</p>
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                      {composeBody}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 justify-end pt-4 border-t border-border">
                    <button 
                      onClick={() => setPreviewMode(false)}
                      className="border border-border bg-background hover:bg-surface text-foreground px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-sm"
                    >
                      Return to Edit 
                    </button>
                    <button 
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="bg-foreground text-background px-8 py-3 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                    >
                      {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>{isSending ? 'Sending...' : 'Confirm Dispatch'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : selectedEmail ? (
             <div className="w-full max-w-3xl p-4 sm:p-8 lg:p-12 overflow-auto h-full">
               <div className="sm:hidden mb-6">
                 <button 
                  onClick={() => setSelectedEmail(null)}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted"
                 >
                   <X size={14} className="rotate-90" />
                   <span>Back to Inbox</span>
                 </button>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 tracking-tight leading-tight">{selectedEmail.subject}</h2>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-muted font-bold uppercase tracking-widest mb-8 pb-4 border-b border-border gap-2">
                 <span className="text-foreground truncate max-w-[250px]">From: {selectedEmail.from}</span>
                 <span className="shrink-0">{selectedEmail.date}</span>
               </div>
               <div className="text-foreground text-base leading-relaxed mb-8 bg-surface/30 p-4 sm:p-6 rounded-lg border border-border">
                 {selectedEmail.snippet.replace(/&quot;/g, '"')}...
                 <div className="mt-6 p-3 bg-background border border-border rounded-sm text-xs italic text-muted text-center">
                   End of snippet. Open in Gmail for full thread.
                 </div>
               </div>

               <div className="mt-12 pt-8 border-t border-border flex flex-col gap-4">
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                   <button 
                    onClick={() => handleSummarize(selectedEmail)}
                    disabled={isAiLoading}
                    className="w-full sm:w-auto bg-foreground text-background px-6 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm flex items-center justify-center space-x-2 shadow-sm"
                   >
                     {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                     <span>Synthesize Thread</span>
                   </button>
                   <button 
                     onClick={() => {
                       setComposeTo(selectedEmail.from);
                       setComposeSubject(selectedEmail.subject.toLowerCase().startsWith('re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
                       setComposeBody(`\n\n\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n> ${selectedEmail.snippet.replace(/&quot;/g, '"')}...`);
                       setIsComposing(true);
                     }}
                     className="w-full sm:w-auto bg-surface hover:bg-surface-hover text-foreground px-6 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm flex items-center justify-center space-x-2 border border-border shadow-sm"
                   >
                     <MailIcon size={14} />
                     <span>Compose Reply</span>
                   </button>
                 </div>

                 {aiSummary && (
                   <div className="mt-4 bg-surface p-6 border border-border rounded-sm">
                     <h3 className="text-[10px] font-bold text-muted mb-4 uppercase tracking-widest flex items-center space-x-2">
                        <Sparkles size={14} className="text-amber-500" /> <span>AI Synthesis</span>
                     </h3>
                     <div className="prose dark:prose-invert prose-sm text-foreground max-w-none prose-p:leading-relaxed">
                       <Markdown>{aiSummary}</Markdown>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted text-center p-8 bg-background w-full">
               <div className="animate-in fade-in zoom-in duration-300">
                 <div className="w-16 h-16 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-6 text-muted border border-border">
                    <MailIcon size={24} />
                 </div>
                 <p className="text-sm font-bold uppercase tracking-widest mb-2">Inbox Empty</p>
                 <p className="text-xs text-muted max-w-xs leading-relaxed">Select a thread to synthesize with AI or compose a fresh message from workspace context.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
