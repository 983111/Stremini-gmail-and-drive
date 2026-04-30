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
    <div className="flex flex-col h-full bg-background">
      <div className="h-[64px] border-b border-border flex items-center justify-between px-8 bg-background">
        <h1 className="text-xl font-semibold text-foreground">Mail Intelligence</h1>
        <div className="flex items-center space-x-6">
          <form onSubmit={handleSearch} className="relative flex items-center bg-surface rounded-sm border border-border focus-within:border-border-strong transition-colors">
            <span className="pl-3 text-muted">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emails..." 
              className="w-48 bg-transparent text-sm px-3 py-2 outline-none"
            />
            <div className="border-l border-border-strong flex items-center">
              <select 
                 value={searchFilter} 
                 onChange={(e) => setSearchFilter(e.target.value)}
                 className="bg-transparent text-xs text-muted outline-none py-2 pr-2 pl-2 border-none focus:ring-0 cursor-pointer"
              >
                <option value="all">Everywhere</option>
                <option value="from">From</option>
                <option value="to">To</option>
                <option value="subject">Subject</option>
                <option value="after">After (Date)</option>
              </select>
            </div>
          </form>
          <button 
            onClick={() => {
              setIsComposing(true);
              setPreviewMode(false);
              setSelectedEmail(null);
            }} 
            className="px-4 py-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 hover:bg-foreground-hover transition-colors"
          >
            <PenSquare size={14} />
            <span>Compose</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Email List */}
        <div className="w-[340px] border-r border-border bg-background overflow-auto flex flex-col shrink-0">
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
            <div className="divide-y divide-[#EEEEEE]">
              {emails.map(email => (
                <div 
                  key={email.id} 
                  onClick={() => {
                    setSelectedEmail(email);
                    setIsComposing(false);
                  }}
                  className={`p-4 cursor-pointer hover:bg-surface transition-colors ${selectedEmail?.id === email.id && !isComposing ? 'bg-surface border-l-2 border-[#111]' : 'border-l-2 border-transparent'}`}
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
        <div className="flex-1 bg-background flex flex-col items-center">
          {isComposing ? (
            <div className="max-w-3xl w-full p-12 overflow-auto h-full flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <h2 className="text-2xl font-semibold text-foreground">Compose Draft</h2>
                <div className="flex space-x-4">
                  <button onClick={handleSaveDraft} className="text-xs font-semibold text-muted hover:text-foreground uppercase tracking-wider flex items-center space-x-1 transition-colors">
                    <Save size={14} /> <span>Save Draft</span>
                  </button>
                  <button onClick={handleDiscard} className="text-xs font-semibold text-muted hover:text-red-500 uppercase tracking-wider flex items-center space-x-1 transition-colors">
                    <X size={14} /> <span>Discard</span>
                  </button>
                </div>
              </div>
              
              {!previewMode ? (
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">To</label>
                    <input 
                      type="email" 
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      placeholder="recipient@example.com" 
                      className="w-full bg-surface border border-border p-3 rounded-sm text-sm focus:border-border-strong outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Subject</label>
                    <input 
                      type="text" 
                      value={composeSubject}
                      onChange={e => setComposeSubject(e.target.value)}
                      placeholder="Meeting Notes" 
                      className="w-full bg-surface border border-border p-3 rounded-sm text-sm focus:border-border-strong outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs font-semibold uppercase tracking-wider text-muted">Message</label>
                       <div className="flex border border-border rounded-sm overflow-hidden bg-surface focus-within:border-border-strong w-64 transition-colors">
                          <input 
                            type="text" 
                            className="bg-transparent text-xs px-2 py-1 outline-none flex-1 text-foreground" 
                            placeholder="Draft with AI..." 
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
                      placeholder="Write your email here..." 
                      className="w-full flex-1 bg-surface border border-border p-4 rounded-sm text-sm focus:border-border-strong outline-none transition-colors resize-none mb-6 text-foreground"
                    />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-border">
                    <button 
                      onClick={() => setPreviewMode(true)}
                      disabled={!composeTo || !composeSubject || !composeBody}
                      className="bg-foreground text-background px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors hover:bg-foreground-hover disabled:opacity-50"
                    >
                      Preview before Sending
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="bg-surface p-6 border border-border rounded-sm">
                    <div className="mb-6 pb-4 border-b border-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Message Preview</p>
                      <p className="text-sm font-semibold text-foreground mb-1">To: {composeTo}</p>
                      <p className="text-sm text-foreground-muted">Subject: {composeSubject}</p>
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-foreground-muted leading-relaxed">
                      {composeBody}
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 justify-end pt-4 border-t border-border">
                    <button 
                      onClick={() => setPreviewMode(false)}
                      className="border border-border hover:bg-surface text-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
                    >
                      Edit 
                    </button>
                    <button 
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="bg-foreground text-background px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center space-x-2 hover:bg-foreground-hover disabled:opacity-50"
                    >
                      {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>{isSending ? 'Sending...' : 'Confirm & Send'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : selectedEmail ? (
             <div className="max-w-3xl w-full p-12 overflow-auto">
               <h2 className="text-3xl font-semibold text-foreground mb-6 tracking-tight">{selectedEmail.subject}</h2>
               <div className="flex items-center justify-between text-xs text-muted font-semibold uppercase tracking-wider mb-8 pb-4 border-b border-border">
                 <span className="text-foreground">From: {selectedEmail.from}</span>
                 <span>{selectedEmail.date}</span>
               </div>
               <p className="text-foreground-muted text-base leading-relaxed mb-8">
                 {selectedEmail.snippet.replace(/&quot;/g, '"')}...
                 <br/><br/>
                 <span className="text-muted italic text-sm">(Full content hidden in preview)</span>
               </p>

               <div className="mt-12 pt-8 border-t border-border">
                 <div className="flex items-center space-x-4">
                   <button 
                    onClick={() => handleSummarize(selectedEmail)}
                    disabled={isAiLoading}
                    className="bg-surface hover:bg-surface-hover text-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center space-x-2 border border-border"
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
                     className="bg-surface hover:bg-surface-hover text-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center space-x-2 border border-border"
                   >
                     <MailIcon size={14} />
                     <span>Reply</span>
                   </button>
                 </div>

                 {aiSummary && (
                   <div className="mt-8 bg-surface p-6 border border-border rounded-sm">
                     <h3 className="text-xs font-semibold text-muted mb-4 uppercase tracking-wider flex items-center space-x-2">
                        <Sparkles size={12}/> <span>AI Synthesis</span>
                     </h3>
                     <div className="prose dark:prose-invert prose-sm text-foreground-muted max-w-none">
                       <Markdown>{aiSummary}</Markdown>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted font-medium text-sm bg-background w-full">
               <div className="text-center">
                 <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-[#CCC]">
                    <MailIcon size={20} />
                 </div>
                 Select an email to view or tap Compose to draft a new message.
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
