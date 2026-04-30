import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentEmails, sendEmail } from '../lib/googleApi';
import { Search, Loader2, RefreshCw, PenSquare, Send, X, Save, Sparkles, Mail as MailIcon } from 'lucide-react';
import { summarizeThread } from '../lib/gemini';
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

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#FDFDFD]">
        <h2 className="text-2xl font-semibold mb-4 text-[#111]">Connect Gmail</h2>
        <p className="text-[#666] mb-8 max-w-md">To access Mail Intelligence, please grant access to your Gmail account.</p>
        <button onClick={signIn} className="bg-black text-white px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-[#222] transition-colors">
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF]">
      <div className="h-[64px] border-b border-[#EEEEEE] flex items-center justify-between px-8 bg-[#FFFFFF]">
        <h1 className="text-xl font-semibold text-[#111]">Mail Intelligence</h1>
        <div className="flex items-center space-x-6">
          <form onSubmit={handleSearch} className="relative flex items-center bg-[#F5F5F5] rounded-sm border border-[#EEEEEE] focus-within:border-[#CCCCCC] transition-colors">
            <span className="pl-3 text-[#888]">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emails..." 
              className="w-48 bg-transparent text-sm px-3 py-2 outline-none"
            />
            <div className="border-l border-[#DDD] flex items-center">
              <select 
                 value={searchFilter} 
                 onChange={(e) => setSearchFilter(e.target.value)}
                 className="bg-transparent text-xs text-[#555] outline-none py-2 pr-2 pl-2 border-none focus:ring-0 cursor-pointer"
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
            className="px-4 py-2 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 hover:bg-[#222] transition-colors"
          >
            <PenSquare size={14} />
            <span>Compose</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Email List */}
        <div className="w-[340px] border-r border-[#EEEEEE] bg-[#FDFDFD] overflow-auto flex flex-col shrink-0">
          {error && (
            <div className="mx-4 mt-4 p-4 bg-red-50 text-red-800 text-sm border border-red-100 rounded-sm">
              {error}
            </div>
          )}
          {loading ? (
             <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#888]" /></div>
          ) : emails.length === 0 ? (
             <div className="p-8 text-center text-[#888] text-sm font-medium">No emails found.</div>
          ) : (
            <div className="divide-y divide-[#EEEEEE]">
              {emails.map(email => (
                <div 
                  key={email.id} 
                  onClick={() => {
                    setSelectedEmail(email);
                    setIsComposing(false);
                  }}
                  className={`p-4 cursor-pointer hover:bg-[#F5F5F5] transition-colors ${selectedEmail?.id === email.id && !isComposing ? 'bg-[#F9F9F9] border-l-2 border-[#111]' : 'border-l-2 border-transparent'}`}
                >
                  <div className="font-semibold text-[#111] text-sm truncate mb-0.5">{email.from}</div>
                  <div className="text-sm font-medium text-[#333] truncate mb-1.5">{email.subject}</div>
                  <div className="text-xs text-[#888] line-clamp-2 leading-relaxed">{email.snippet.replace(/&quot;/g, '"')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail & Compose & AI */}
        <div className="flex-1 bg-[#FFFFFF] flex flex-col items-center">
          {isComposing ? (
            <div className="max-w-3xl w-full p-12 overflow-auto h-full flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EEEEEE]">
                <h2 className="text-2xl font-semibold text-[#111]">Compose Draft</h2>
                <div className="flex space-x-4">
                  <button onClick={handleSaveDraft} className="text-xs font-semibold text-[#666] hover:text-[#111] uppercase tracking-wider flex items-center space-x-1 transition-colors">
                    <Save size={14} /> <span>Save Draft</span>
                  </button>
                  <button onClick={() => setIsComposing(false)} className="text-xs font-semibold text-[#666] hover:text-red-500 uppercase tracking-wider flex items-center space-x-1 transition-colors">
                    <X size={14} /> <span>Discard</span>
                  </button>
                </div>
              </div>
              
              {!previewMode ? (
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">To</label>
                    <input 
                      type="email" 
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      placeholder="recipient@example.com" 
                      className="w-full bg-[#F9F9F9] border border-[#EEEEEE] p-3 rounded-sm text-sm focus:border-[#CCCCCC] outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Subject</label>
                    <input 
                      type="text" 
                      value={composeSubject}
                      onChange={e => setComposeSubject(e.target.value)}
                      placeholder="Meeting Notes" 
                      className="w-full bg-[#F9F9F9] border border-[#EEEEEE] p-3 rounded-sm text-sm focus:border-[#CCCCCC] outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Message</label>
                    <textarea 
                      value={composeBody}
                      onChange={e => setComposeBody(e.target.value)}
                      placeholder="Write your email here..." 
                      className="w-full flex-1 bg-[#F9F9F9] border border-[#EEEEEE] p-4 rounded-sm text-sm focus:border-[#CCCCCC] outline-none transition-colors resize-none mb-6"
                    />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-[#EEEEEE]">
                    <button 
                      onClick={() => setPreviewMode(true)}
                      disabled={!composeTo || !composeSubject || !composeBody}
                      className="bg-black text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors hover:bg-[#222] disabled:opacity-50"
                    >
                      Preview before Sending
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="bg-[#F9F9F9] p-6 border border-[#EEEEEE] rounded-sm">
                    <div className="mb-6 pb-4 border-b border-[#EEEEEE]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#888] mb-4">Message Preview</p>
                      <p className="text-sm font-semibold text-[#111] mb-1">To: {composeTo}</p>
                      <p className="text-sm text-[#333]">Subject: {composeSubject}</p>
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-[#333] leading-relaxed">
                      {composeBody}
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 justify-end pt-4 border-t border-[#EEEEEE]">
                    <button 
                      onClick={() => setPreviewMode(false)}
                      className="border border-[#EEEEEE] hover:bg-[#F5F5F5] text-[#111] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
                    >
                      Edit 
                    </button>
                    <button 
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="bg-black text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center space-x-2 hover:bg-[#222] disabled:opacity-50"
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
               <h2 className="text-3xl font-semibold text-[#111] mb-6 tracking-tight">{selectedEmail.subject}</h2>
               <div className="flex items-center justify-between text-xs text-[#888] font-semibold uppercase tracking-wider mb-8 pb-4 border-b border-[#EEEEEE]">
                 <span className="text-[#111]">From: {selectedEmail.from}</span>
                 <span>{selectedEmail.date}</span>
               </div>
               <p className="text-[#333] text-base leading-relaxed mb-8">
                 {selectedEmail.snippet.replace(/&quot;/g, '"')}...
                 <br/><br/>
                 <span className="text-[#888] italic text-sm">(Full content hidden in preview)</span>
               </p>

               <div className="mt-12 pt-8 border-t border-[#EEEEEE]">
                 <div className="flex items-center space-x-4">
                   <button 
                    onClick={() => handleSummarize(selectedEmail)}
                    disabled={isAiLoading}
                    className="bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#111] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center space-x-2 border border-[#EEEEEE]"
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
                     className="bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#111] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center space-x-2 border border-[#EEEEEE]"
                   >
                     <MailIcon size={14} />
                     <span>Reply</span>
                   </button>
                 </div>

                 {aiSummary && (
                   <div className="mt-8 bg-[#F9F9F9] p-6 border border-[#EEEEEE] rounded-sm">
                     <h3 className="text-xs font-semibold text-[#888] mb-4 uppercase tracking-wider flex items-center space-x-2">
                        <Sparkles size={12}/> <span>AI Synthesis</span>
                     </h3>
                     <div className="prose prose-sm text-[#333] max-w-none">
                       <Markdown>{aiSummary}</Markdown>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[#888] font-medium text-sm bg-[#FFFFFF] w-full">
               <div className="text-center">
                 <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#CCC]">
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
