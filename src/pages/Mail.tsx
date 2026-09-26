import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentEmails, sendEmail, fetchEmailThread, fetchEmailBody, fetchRecentDriveFiles, fetchDriveFileBlob } from '../lib/googleApi';
import { Search, Loader2, RefreshCw, PenSquare, Send, X, Save, Cpu, Mail as MailIcon, Edit3, Paperclip, File, Trash2, UploadCloud, Database, Filter, Calendar, User, Tag } from 'lucide-react';
import { summarizeThread, draftEmailWithAI } from '../lib/gemini';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';

interface AttachmentFile {
  id?: string;
  name: string;
  mimeType: string;
  blob?: Blob;
  size?: number;
}

export function Mail() {
  const { accessToken, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const mailIdParam = searchParams.get('id');

  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  // Advanced Search Filter States for Gmail Integration
  const [showFilters, setShowFilters] = useState(false);
  const [filterSender, setFilterSender] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterDateAfter, setFilterDateAfter] = useState('');
  const [filterDateBefore, setFilterDateBefore] = useState('');
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);

  const buildGmailQuery = () => {
    const parts: string[] = [];
    
    // If advanced filters are shown, build the Gmail Query structure
    if (showFilters) {
      if (filterSender.trim()) {
        parts.push(`from:(${filterSender.trim()})`);
      }
      if (filterSubject.trim()) {
        parts.push(`subject:(${filterSubject.trim()})`);
      }
      if (filterKeyword.trim()) {
        parts.push(filterKeyword.trim());
      } else if (query.trim()) {
        parts.push(query.trim());
      }
      if (filterDateAfter) {
        const formatted = filterDateAfter.replace(/-/g, '/');
        parts.push(`after:${formatted}`);
      }
      if (filterDateBefore) {
        const formatted = filterDateBefore.replace(/-/g, '/');
        parts.push(`before:${formatted}`);
      }
      if (filterHasAttachment) {
        parts.push('has:attachment');
      }
    } else {
      // Direct query fallback
      if (query.trim()) {
        parts.push(query.trim());
      }
    }

    return parts.join(' ');
  };

  // Auto-select or fetch email based on search URL routing query parameters
  useEffect(() => {
    if (!accessToken || !mailIdParam) return;

    const selectOrLoadEmail = async () => {
      // 1. Check if email is already in the fetched list
      const found = emails.find(e => e.id === mailIdParam);
      if (found) {
        setSelectedEmail(found);
        setIsComposing(false);
        setAiSummary('');
        loadEmailBody(found);
        return;
      }

      // 2. Fetch from Gmail API if not in the cached array
      setLoading(true);
      try {
        const metadataRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${mailIdParam}?format=metadata`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (metadataRes.ok) {
          const m = await metadataRes.json();
          const parsedEmail = {
            id: m.id,
            snippet: m.snippet,
            subject: m.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
            from: m.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown sender',
            date: m.payload?.headers?.find((h: any) => h.name === 'Date')?.value || 'Unknown date',
            body: ''
          };

          setEmails(prev => {
            const exists = prev.some(e => e.id === parsedEmail.id);
            return exists ? prev : [parsedEmail, ...prev];
          });
          setSelectedEmail(parsedEmail);
          setIsComposing(false);
          setAiSummary('');

          const body = await fetchEmailBody(accessToken, m.id);
          setSelectedEmail((prev: any) => prev?.id === m.id ? { ...prev, body } : prev);
          setEmails(prev => prev.map(e => e.id === m.id ? { ...e, body } : e));
        }
      } catch (e) {
        console.error("Failed to load search link email message details:", e);
      } finally {
        setLoading(false);
      }
    };

    selectOrLoadEmail();
  }, [mailIdParam, accessToken, emails.length === 0]);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBodyLoading, setIsBodyLoading] = useState(false);
  
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveQuery, setDriveQuery] = useState('');

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

  const loadEmailBody = async (email: any) => {
    if (!accessToken || !email || email.body) return;
    setIsBodyLoading(true);
    try {
      const body = await fetchEmailBody(accessToken, email.id);
      setSelectedEmail((prev: any) => ({ ...prev, body }));
      setEmails((prev) => prev.map(e => e.id === email.id ? { ...e, body } : e));
    } catch (e) {
      console.error("Failed to fetch email body:", e);
    } finally {
      setIsBodyLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadEmails('');
    }
  }, [accessToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuery = buildGmailQuery();
    loadEmails(finalQuery);
  };

  const resetAllFilters = () => {
    setQuery('');
    setFilterSender('');
    setFilterSubject('');
    setFilterKeyword('');
    setFilterDateAfter('');
    setFilterDateBefore('');
    setFilterHasAttachment(false);
    loadEmails('');
  };

  const handleSummarize = async (email: any) => {
    if (!accessToken) return;
    setIsAiLoading(true);
    setAiSummary('');
    try {
      let threadData = [email];
      if (email.threadId) {
        try {
          const thread = await fetchEmailThread(accessToken, email.threadId);
          if (thread && thread.messages) {
            threadData = thread.messages.map((m: any) => ({
              snippet: m.snippet,
              from: m.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown',
              date: m.payload?.headers?.find((h: any) => h.name === 'Date')?.value || 'Unknown'
            }));
          }
        } catch (threadError) {
          console.warn("Could not fetch full thread, summarizing single message:", threadError);
        }
      }
      const summary = await summarizeThread(threadData);
      setAiSummary(summary);
    } catch (e: any) {
      setAiSummary('Error: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (showDrivePicker && accessToken) {
      loadDriveFiles('');
    }
  }, [showDrivePicker, accessToken]);

  const loadDriveFiles = async (q: string) => {
    if (!accessToken) return;
    setDriveLoading(true);
    try {
      const files = await fetchRecentDriveFiles(accessToken, q);
      setDriveFiles(files);
    } catch(e) { }
    setDriveLoading(false);
  };

  const handleDriveSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDriveFiles(driveQuery);
  };

  const selectDriveFile = (file: any) => {
    setAttachments(prev => [...prev, {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
    }]);
    setShowDrivePicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
       const newFiles = Array.from(e.target.files).map(file => ({
         name: file.name,
         mimeType: file.type || 'application/octet-stream',
         blob: file,
         size: file.size
       }));
       setAttachments(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const handleSendEmail = async () => {
    if (!accessToken) return;
    setIsSending(true);
    try {
      const processedAttachments = await Promise.all(attachments.map(async (att) => {
         let contentBlob = att.blob;
         let mimeType = att.mimeType;
         let name = att.name;

         if (!contentBlob && att.id) {
           contentBlob = await fetchDriveFileBlob(accessToken, att.id, att.mimeType);
           if (att.mimeType.includes('vnd.google-apps.')) {
             if (att.mimeType === 'application/vnd.google-apps.document') {
               name += '.pdf';
               mimeType = 'application/pdf';
             } else if (att.mimeType === 'application/vnd.google-apps.spreadsheet') {
               name += '.ods';
               mimeType = 'application/x-vnd.oasis.opendocument.spreadsheet';
             } else if (att.mimeType === 'application/vnd.google-apps.presentation') {
               name += '.pdf';
               mimeType = 'application/pdf';
             }
           }
         }
         
         if (!contentBlob) throw new Error("Missing content for attachment: " + att.name);
         
         const base64Content = await new Promise<string>((resolve, reject) => {
           const reader = new FileReader();
           reader.onloadend = () => {
             const result = reader.result as string;
             const base64 = result.split(',')[1];
             resolve(base64);
           };
           reader.onerror = reject;
           reader.readAsDataURL(contentBlob);
         });
         
         return {
           name,
           mimeType,
           content: base64Content
         };
      }));

      await sendEmail(accessToken, composeTo, composeSubject, composeBody, processedAttachments);
      localStorage.removeItem('stremini_mail_draft');
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setAttachments([]);
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

  const handleDraftWithAI = async () => {
    if (!draftPrompt) return;
    setIsDrafting(true);
    try {
      const draft = await draftEmailWithAI(draftPrompt, composeBody);
      setComposeBody(draft);
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
        <p className="text-muted mb-8 max-w-md">To access Mail, please grant access to your Gmail account.</p>
        <button onClick={signIn} className="bg-foreground text-background px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-foreground-hover transition-colors">
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Search Header and Advanced Filters Block for Gmail Integration */}
      <div className="border-b border-border bg-background flex flex-col shrink-0">
        <div className="h-[64px] flex items-center justify-between px-4 md:px-8 bg-background">
          <h1 className="text-lg md:text-xl font-semibold text-foreground truncate flex items-center gap-2">
            <MailIcon size={18} className="text-foreground shrink-0" />
            <span>Mail Inbox</span>
          </h1>

          <div className="flex items-center space-x-2">
            <form onSubmit={handleSearch} className="relative hidden xs:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mail..." 
                className="w-36 sm:w-64 bg-surface text-xs pl-9 pr-4 py-2 rounded-sm border border-border focus:border-border-strong outline-none transition-colors"
              />
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-1.5 border rounded-sm hover:bg-surface transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                showFilters ? "bg-surface border-border-strong text-foreground" : "border-border text-muted"
              )}
              title="Toggle Advanced Search Filters"
            >
              <Filter size={12} />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <button 
              onClick={() => {
                setIsComposing(true);
                setPreviewMode(false);
                setSelectedEmail(null);
              }} 
              className="px-3 py-2 bg-foreground text-background text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center space-x-2 hover:bg-foreground-hover transition-colors"
            >
              <PenSquare size={13} />
              <span className="hidden xs:inline">Compose</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Gmail Filters Section */}
        {showFilters && (
          <div className="px-4 md:px-8 py-4 bg-surface/50 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
            {/* Sender Filter */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <User size={10} />
                <span>Sender Name/Email</span>
              </span>
              <input
                type="text"
                placeholder="e.g. john@example.com"
                value={filterSender}
                onChange={(e) => setFilterSender(e.target.value)}
                className="w-full bg-background border border-border rounded-sm text-xs p-2 outline-none focus:border-border-strong text-foreground placeholder:text-muted/70"
              />
            </div>

            {/* Subject Filter */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <Tag size={10} />
                <span>Subject Contains</span>
              </span>
              <input
                type="text"
                placeholder="e.g. Weekly Update"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full bg-background border border-border rounded-sm text-xs p-2 outline-none focus:border-border-strong text-foreground placeholder:text-muted/70"
              />
            </div>

            {/* Keyword Filter */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <Search size={10} />
                <span>Keyword / Text</span>
              </span>
              <input
                type="text"
                placeholder="e.g. Invoice, Action Required"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                className="w-full bg-background border border-border rounded-sm text-xs p-2 outline-none focus:border-border-strong text-foreground placeholder:text-muted/70"
              />
            </div>

            {/* Extra filters and action trigger buttons */}
            <div className="flex flex-col justify-end gap-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer pb-2 select-none">
                <input
                  type="checkbox"
                  checked={filterHasAttachment}
                  onChange={(e) => setFilterHasAttachment(e.target.checked)}
                  className="rounded-sm accent-foreground border-border h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-[11px] text-muted font-medium">Has attachment</span>
              </label>

              <div className="flex gap-1.5 w-full">
                <button
                  onClick={() => {
                    const finalQuery = buildGmailQuery();
                    loadEmails(finalQuery);
                  }}
                  className="flex-1 bg-foreground text-background text-[10px] font-bold py-2 rounded-sm hover:bg-foreground-hover uppercase tracking-wider transition-all"
                >
                  Search
                </button>
                <button
                  onClick={resetAllFilters}
                  className="p-1 px-3 border border-border hover:bg-surface text-foreground text-[10px] font-bold rounded-sm uppercase tracking-wider transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Date interval controls rendering below in custom row */}
            <div className="sm:col-span-2 md:col-span-4 grid grid-cols-2 gap-3 border-t border-border pt-3 mt-1">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted tracking-wider uppercase font-mono flex items-center gap-1">
                  <Calendar size={10} />
                  <span>After Date (Start)</span>
                </span>
                <input
                  type="date"
                  value={filterDateAfter}
                  onChange={(e) => setFilterDateAfter(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm text-xs p-1.5 outline-none focus:border-border-strong text-foreground cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted tracking-wider uppercase font-mono flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Before Date (End)</span>
                </span>
                <input
                  type="date"
                  value={filterDateBefore}
                  onChange={(e) => setFilterDateBefore(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm text-xs p-1.5 outline-none focus:border-border-strong text-foreground cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex relative">
        {/* Email List */}
        <div className={cn(
          "w-full md:w-[340px] border-r border-border bg-background overflow-auto flex flex-col shrink-0",
          (selectedEmail || isComposing) && "hidden md:flex"
        )}>
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
                    setAiSummary(''); // Clear previous summary
                    loadEmailBody(email);
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
        <div className={cn(
          "flex-1 bg-background flex flex-col items-center overflow-y-auto",
          (!selectedEmail && !isComposing) && "hidden md:flex"
        )}>
          {isComposing ? (
            <div className="max-w-3xl w-full p-4 md:p-12 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border shrink-0">
                <button onClick={() => setIsComposing(false)} className="text-muted hover:text-foreground md:hidden mr-4">
                   <X size={18} />
                </button>
                <h2 className="text-lg md:text-2xl font-semibold text-foreground flex-1 truncate">Compose</h2>
                <div className="flex space-x-2 md:space-x-4">
                  <button onClick={handleSaveDraft} className="text-[10px] md:text-xs font-semibold text-muted hover:text-foreground uppercase tracking-wider flex items-center space-x-1 transition-colors">
                    <Save size={14} /> <span className="hidden xs:inline">Save</span>
                  </button>
                  <button onClick={() => setIsComposing(false)} className="text-[10px] md:text-xs font-semibold text-muted hover:text-red-500 uppercase tracking-wider flex items-center space-x-1 transition-colors">
                    <X size={14} /> <span className="hidden xs:inline">Discard</span>
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
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Message</label>
                    <div className="flex flex-col border border-border rounded-sm bg-surface transition-colors focus-within:border-border-strong flex-1 mb-6">
                      <div className="flex items-center justify-between p-2 border-b border-border bg-background">
                         <div className="flex items-center flex-1 max-w-sm border border-border rounded-sm overflow-hidden bg-surface focus-within:border-border-strong transition-colors mr-4">
                            <Edit3 size={12} className="ml-2 text-muted" />
                            <input 
                              type="text" 
                              className="bg-transparent text-xs px-2 py-1.5 outline-none flex-1 text-foreground" 
                              placeholder="Draft message (e.g. 'Ask for a meeting on Tuesday')" 
                              value={draftPrompt}
                              onChange={e => setDraftPrompt(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleDraftWithAI()}
                            />
                            <button 
                              onClick={handleDraftWithAI} 
                              disabled={isDrafting || !draftPrompt}
                              className="bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:bg-foreground-hover disabled:opacity-50 transition-colors flex items-center space-x-1"
                            >
                              {isDrafting ? <Loader2 size={12} className="animate-spin" /> : <span>Draft</span>}
                            </button>
                         </div>
                      </div>
                      <textarea 
                        value={composeBody}
                        onChange={e => setComposeBody(e.target.value)}
                        placeholder="Write your email here..." 
                        className="w-full h-48 sm:h-auto flex-1 bg-transparent p-4 text-sm outline-none resize-none text-foreground leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 mb-4">
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                           <div key={i} className="flex items-center space-x-2 bg-surface border border-border py-1.5 px-3 rounded-sm text-xs">
                              <File size={14} className="text-muted" />
                              <span className="truncate max-w-[150px] text-foreground">{att.name}</span>
                              <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500 ml-2">
                                <X size={14} />
                              </button>
                           </div>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-2">
                       <button onClick={() => setShowDrivePicker(true)} className="flex items-center space-x-2 text-xs font-semibold text-muted hover:text-foreground bg-surface border border-border px-3 py-1.5 rounded-sm transition-colors">
                         <Database size={14} /> <span>From Drive</span>
                       </button>
                       
                       <label className="flex items-center space-x-2 text-xs font-semibold text-muted hover:text-foreground bg-surface border border-border px-3 py-1.5 rounded-sm transition-colors cursor-pointer">
                         <UploadCloud size={14} /> <span>Upload File</span>
                         <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                       </label>
                    </div>
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
                    {attachments.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Attachments ({attachments.length})</p>
                        <div className="flex flex-col space-y-2">
                          {attachments.map((att, i) => (
                            <div key={i} className="flex items-center space-x-2 text-sm text-foreground">
                              <Paperclip size={14} className="text-muted" />
                              <span className="truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
             <div className="max-w-3xl w-full p-4 md:p-12">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-border gap-4">
                 <div className="flex-1 min-w-0">
                    <button 
                      onClick={() => setSelectedEmail(null)}
                      className="flex items-center space-x-2 text-muted hover:text-foreground mb-4 md:hidden"
                    >
                      <X size={16} /> <span>Back to Thread</span>
                    </button>
                    <h2 className="text-xl md:text-3xl font-semibold text-foreground mb-2 tracking-tight line-break">{selectedEmail.subject}</h2>
                    <div className="flex items-center text-[10px] md:text-xs text-muted font-semibold uppercase tracking-wider gap-4">
                      <span className="text-foreground truncate overflow-hidden">From: {selectedEmail.from}</span>
                      <span className="shrink-0">{selectedEmail.date}</span>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2 shrink-0">
                    <button 
                      onClick={() => handleSummarize(selectedEmail)}
                      disabled={isAiLoading}
                      className="bg-foreground text-background px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-foreground-hover transition-colors flex items-center space-x-2 disabled:opacity-50"
                      title="Summarize thread"
                    >
                      {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
                      <span>Summarize</span>
                    </button>
                    <button 
                      onClick={() => {
                        setComposeTo(selectedEmail.from);
                        setComposeSubject(selectedEmail.subject.toLowerCase().startsWith('re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
                        setComposeBody(`\n\n\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n> ${selectedEmail.snippet.replace(/&quot;/g, '"')}...`);
                        setIsComposing(true);
                      }}
                      className="p-2 border border-border rounded-sm hover:bg-surface text-muted hover:text-foreground transition-colors"
                      title="Reply"
                    >
                      <MailIcon size={16} />
                    </button>
                 </div>
               </div>

               {aiSummary && (
                 <div className="mb-10 bg-surface p-6 border border-border rounded-sm animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center space-x-2">
                         <Cpu size={14} className="text-foreground" /> <span>Thread Synthesis</span>
                      </h3>
                      <button onClick={() => setAiSummary('')} className="text-muted hover:text-foreground">
                        <X size={14} />
                      </button>
                   </div>
                   <div className="prose dark:prose-invert prose-sm text-foreground-muted max-w-none">
                     <Markdown>{aiSummary}</Markdown>
                   </div>
                 </div>
               )}

               <div className="text-foreground-muted text-base leading-relaxed mb-8 min-h-[200px]">
                 {isBodyLoading ? (
                    <div className="flex items-center space-x-2 text-muted animate-pulse">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Retrieving full content...</span>
                    </div>
                 ) : selectedEmail.body ? (
                    <div 
                      className="email-content prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                    />
                 ) : (
                    <p>{selectedEmail.snippet.replace(/&quot;/g, '"')}...</p>
                 )}
               </div>
             </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted font-medium text-sm bg-background w-full">
               <div className="text-center">
                 <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                    <MailIcon size={20} />
                 </div>
                 Select an email to view or tap Compose to draft a new message.
               </div>
            </div>
          )}
        </div>
      </div>
      
      {showDrivePicker && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-2xl rounded-sm shadow-xl flex flex-col max-h-[80vh]">
             <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <Database size={18} className="text-muted" />
                  <span>Select File from Drive</span>
                </h3>
                <button onClick={() => setShowDrivePicker(false)} className="text-muted hover:text-foreground"><X size={18}/></button>
             </div>
             <div className="p-4 border-b border-border">
                <form onSubmit={handleDriveSearch} className="flex space-x-2">
                   <input 
                     type="text" 
                     placeholder="Search drive..." 
                     className="flex-1 bg-background border border-border px-3 py-2 text-sm outline-none focus:border-border-strong rounded-sm"
                     value={driveQuery}
                     onChange={e => setDriveQuery(e.target.value)}
                   />
                   <button type="submit" className="bg-foreground text-background px-4 py-2 font-medium text-sm rounded-sm hover:bg-foreground-hover transition-colors">Search</button>
                </form>
             </div>
             <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-1 min-h-[300px]">
               {driveLoading ? (
                  <div className="flex-1 flex items-center justify-center text-muted"><Loader2 className="animate-spin" size={24} /></div>
               ) : driveFiles.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted text-sm font-medium">No files found.</div>
               ) : (
                  driveFiles.map(f => (
                     <div key={f.id} onClick={() => selectDriveFile(f)} className="flex items-center justify-between p-3 rounded-sm hover:bg-background border border-transparent hover:border-border cursor-pointer transition-colors group">
                       <div className="flex items-center space-x-3 w-full min-w-0">
                          <File size={16} className="text-muted shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                       </div>
                     </div>
                  ))
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
