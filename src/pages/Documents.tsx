import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { FileText, Plus, Trash2, Sparkles, Loader2, Eye, Edit3, X, RefreshCw, Send, MoveRight, Link as LinkIcon, File, User, Download, PanelRight, Bold, Italic, Strikethrough, Code, Share2, Globe, Lock, Copy, Check } from 'lucide-react';
import { rewriteDocument, summarizeDocumentContent, askDocumentQuestion } from '../lib/gemini';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { shadesOfPurple } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentDriveFiles } from '../lib/googleApi';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function Documents() {
  const { accessToken } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current || isPreview) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    
    const selectedText = value.substring(selectionStart, selectionEnd);
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    
    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`;
    
    if (selectedDoc) {
      setSelectedDoc({ ...selectedDoc, content: newContent });
      updateDocument(selectedDoc.id, selectedDoc.title, newContent);
    }
    
    // Resume focus after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          selectionStart + prefix.length,
          selectionEnd + prefix.length
        );
      }
    }, 0);
  };
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    if (!selectedDoc) return;
    const link = `${window.location.origin}/docs/${selectedDoc.id}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!selectedDoc) return;
    
    const htmlContent = await marked.parse(selectedDoc.content);
    
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #000; background: #fff;">
        <h1 style="margin-bottom: 20px;">${selectedDoc.title}</h1>
        <div style="color: #000; line-height: 1.6;">
          ${htmlContent}
        </div>
      </div>
    `;
    
    // Quick style tweaks for the PDF
    const styles = document.createElement('style');
    styles.innerHTML = `
      h1, h2, h3 { color: #111; }
      p { margin-bottom: 1em; color: #333; }
      a { color: #0066cc; text-decoration: none; }
      ul, ol { margin-bottom: 1em; padding-left: 2em; }
      li { margin-bottom: 0.5em; }
      code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
      pre { background: #f5f5f5; padding: 1em; border-radius: 5px; overflow-x: auto; font-family: monospace; }
      blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin-left: 0; }
    `;
    container.appendChild(styles);

    const opt: any = {
      margin:       1,
      filename:     `${selectedDoc.title || 'Document'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/documents`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt
        };
      });
      setDocs(docsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/documents`);
    });
    return () => unsubscribe();
  }, []);

  const createDoc = async () => {
    if (!auth.currentUser) return;
    try {
      const newDoc = {
        title: 'Untitled Document',
        content: '# New Document\n\nStart typing here... You can use Markdown for **bold**, *italics*, lists, and Checkboxes (- [ ]).\n\n- [ ] Example Task',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser.uid
      };
      const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/documents`), newDoc);
      setSelectedDoc({ id: docRef.id, ...newDoc });
      setIsPreview(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/documents`);
    }
  };

  const updateDocument = async (id: string, title: string, content: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/documents/${id}`), {
        title,
        content,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/documents/${id}`);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/documents/${id}`));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/documents/${id}`);
    }
  };

  const handleRewrite = async (tone: 'formal' | 'casual' | 'persuasive') => {
    if (!selectedDoc || !selectedDoc.content) return;
    setIsAiLoading(true);
    const userMsg = `Rewrite this document to be more ${tone}.`;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const rewritten = await rewriteDocument(selectedDoc.content, tone);
      setChatMessages(prev => [...prev, { role: 'assistant', content: rewritten }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedDoc || !selectedDoc.content) return;
    setIsAiLoading(true);
    setChatMessages(prev => [...prev, { role: 'user', content: 'Summarize this document.' }]);
    try {
      const summary = await summarizeDocumentContent(selectedDoc.content);
      setChatMessages(prev => [...prev, { role: 'assistant', content: summary }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleChat = async () => {
    if (!selectedDoc || !chatInput.trim() || isAiLoading) return;
    
    const question = chatInput.trim();
    setChatInput('');
    setIsAiLoading(true);
    
    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      // Map history to Gemini format
      const geminiHistory = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const answer = await askDocumentQuestion(selectedDoc.content, question, geminiHistory);
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error answering: ' + e.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const replaceContent = (content: string) => {
    if (!selectedDoc) return;
    setSelectedDoc({ ...selectedDoc, content });
    updateDocument(selectedDoc.id, selectedDoc.title, content);
  };

  const handleOpenLinkModal = async () => {
    if (!accessToken) {
      alert("Please connect Google Drive from the Nexus Hub or Drive page first.");
      return;
    }
    setIsLinkModalOpen(true);
    setIsDriveLoading(true);
    try {
      const files = await fetchRecentDriveFiles(accessToken, '');
      setDriveFiles(files);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleInsertLink = (file: any) => {
    if (!selectedDoc) return;
    const linkStr = `\n[${file.name}](${file.webViewLink})`;
    const newContent = selectedDoc.content + linkStr;
    setSelectedDoc({ ...selectedDoc, content: newContent });
    updateDocument(selectedDoc.id, selectedDoc.title, newContent);
    setIsLinkModalOpen(false);
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar list - Hidden on mobile if doc selected */}
      <div className={`w-full lg:w-64 border-r border-border bg-background flex flex-col flex-shrink-0 z-0 ${selectedDoc ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-background">
          <h2 className="font-semibold text-xs text-muted uppercase tracking-wider">Workspace</h2>
          <button onClick={createDoc} className="p-1 hover:bg-surface rounded-sm text-muted hover:text-foreground transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {docs.length === 0 ? (
            <div className="py-20 text-center px-4">
              <p className="text-xs text-muted">No documents yet.</p>
              <button 
                onClick={createDoc}
                className="mt-4 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-surface px-4 py-2 border border-border rounded-sm transition-all"
              >
                Create First Entry
              </button>
            </div>
          ) : (
            docs.map(d => (
              <div 
                key={d.id}
                onClick={() => setSelectedDoc(d)}
                className={`group flex items-center justify-between p-2 rounded-sm cursor-pointer text-sm transition-colors ${selectedDoc?.id === d.id ? 'bg-surface text-foreground font-medium' : 'text-muted hover:bg-surface'}`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText size={14} className={selectedDoc?.id === d.id ? "text-foreground" : "text-muted"} />
                  <span className="truncate">{d.title}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteDocument(d.id); }} 
                  className={`opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1 rounded-sm hover:bg-background`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Main Content */}
      <div className={`flex-1 overflow-hidden relative bg-background flex flex-col ${selectedDoc ? 'flex' : 'hidden lg:flex'}`}>
        {selectedDoc ? (
          <>
            <div className="flex-1 p-4 sm:p-8 lg:p-16 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col">
              {/* Mobile Page Header Buttons */}
              <div className="flex lg:hidden items-center justify-between mb-8">
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted"
                >
                  <MoveRight size={14} className="rotate-180" />
                  <span>Docs</span>
                </button>
                <button 
                  onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-600"
                >
                  <Sparkles size={14} />
                  <span>Assistant</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 sm:mb-12 group gap-4">
                <input 
                  type="text"
                  value={selectedDoc.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setSelectedDoc({ ...selectedDoc, title: newTitle });
                    updateDocument(selectedDoc.id, newTitle, selectedDoc.content);
                  }}
                  className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none focus:outline-none placeholder-muted text-foreground tracking-tighter"
                  placeholder="Document Title"
                />
                <div className="flex items-center space-x-1 bg-surface p-1 rounded-sm border border-border lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 self-start">
                  <button 
                    onClick={() => setIsPreview(false)}
                    className={`p-1.5 rounded-sm transition-colors flex items-center justify-center ${!isPreview ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    title="Edit Mode"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => setIsPreview(true)}
                    className={`p-1.5 rounded-sm transition-colors flex items-center justify-center ${isPreview ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    title="Preview Mode"
                  >
                    <Eye size={14} />
                  </button>
                  <div className="w-[1px] h-4 bg-surface-hover mx-1"></div>
                  <button 
                    onClick={handleOpenLinkModal}
                    className="p-1.5 rounded-sm transition-colors flex items-center justify-center text-muted hover:text-foreground"
                    title="Insert Link"
                  >
                    <LinkIcon size={14} />
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="p-1.5 rounded-sm transition-colors flex items-center justify-center text-muted hover:text-foreground"
                    title="PDF"
                  >
                    <Download size={14} />
                  </button>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-1.5 rounded-sm transition-colors flex items-center justify-center text-muted hover:text-foreground"
                    title="Share"
                  >
                    <Share2 size={14} />
                  </button>
                  <button 
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    className={`hidden lg:flex p-1.5 rounded-sm transition-colors items-center justify-center ${isAssistantOpen ? 'bg-background shadow-sm text-amber-500' : 'text-muted hover:text-foreground'}`}
                    title="Assistant"
                  >
                    <PanelRight size={14} />
                  </button>
                </div>
              </div>

              {!isPreview ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center space-x-2 mb-4 bg-surface p-1 border border-border w-fit rounded-sm overflow-x-auto max-w-full">
                    <button onClick={() => applyFormatting('**')} className="p-1.5 hover:bg-background rounded-sm text-muted hover:text-foreground transition-all shrink-0" title="Bold"><Bold size={16} /></button>
                    <button onClick={() => applyFormatting('*')} className="p-1.5 hover:bg-background rounded-sm text-muted hover:text-foreground transition-all shrink-0" title="Italic"><Italic size={16} /></button>
                    <button onClick={() => applyFormatting('~~')} className="p-1.5 hover:bg-background rounded-sm text-muted hover:text-foreground transition-all shrink-0" title="Strike"><Strikethrough size={16} /></button>
                    <div className="w-[1px] h-4 bg-border mx-1 shrink-0"></div>
                    <button onClick={() => applyFormatting('```\n', '\n```')} className="p-1.5 hover:bg-background rounded-sm text-muted hover:text-foreground transition-all shrink-0" title="Code"><Code size={16} /></button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={selectedDoc.content}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setSelectedDoc({ ...selectedDoc, content: newContent });
                      updateDocument(selectedDoc.id, selectedDoc.title, newContent);
                    }}
                    className="w-full flex-1 min-h-[60vh] bg-transparent border-none focus:outline-none text-foreground text-base resize-none leading-relaxed placeholder-muted font-sans"
                    placeholder="Start typing..."
                  />
                </div>
              ) : (
                <div className="w-full flex-1 min-h-[60vh] prose dark:prose-invert prose-slate prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/90 pb-20">
                  <Markdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="overflow-x-auto">
                            <SyntaxHighlighter
                              style={shadesOfPurple as any}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {selectedDoc.content}
                  </Markdown>
                </div>
              )}
            </div>
            
            {/* AI Panel (Right Sidebar) - Mobile Overlay */}
            {isAssistantOpen && (
            <div className="fixed inset-y-0 right-0 w-full sm:w-[340px] bg-background border-l border-border flex flex-col shrink-0 z-50 lg:relative lg:translate-x-0 shadow-2xl lg:shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
              {/* Header */}
              <div className="h-14 px-4 border-b border-border flex items-center justify-between bg-background shrink-0">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Assistant</h3>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={handleSummarize}
                    className="p-1.5 text-muted hover:bg-surface rounded-sm transition-colors"
                    title="Summarize Document"
                    disabled={isAiLoading}
                  >
                    <FileText size={14} />
                  </button>
                  <button 
                    onClick={() => setChatMessages([])}
                    className="p-1.5 text-muted hover:bg-surface rounded-sm transition-colors"
                    title="Clear Chat"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={() => setIsAssistantOpen(false)} className="p-1.5 text-muted hover:bg-surface rounded-sm transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Chat / Output Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                 
                 {/* System context state */}
                 <div className="flex justify-center shrink-0">
                   <div className="bg-surface-hover text-muted text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm flex items-center space-x-1">
                     <FileText size={10} /> <span>Context Linked</span>
                   </div>
                 </div>

                 {chatMessages.length === 0 && (
                   <div className="bg-background border border-border rounded-sm p-4 shadow-sm shrink-0">
                     <p className="text-sm text-foreground font-medium mb-3">How can I help you refine this?</p>
                     <div className="space-y-2">
                       <button onClick={() => handleRewrite('formal')} className="w-full text-left px-3 py-2 text-xs text-muted bg-surface hover:bg-surface-hover border border-transparent rounded-sm transition-colors flex justify-between items-center group">
                         <span>Make it authoritative</span>
                         <MoveRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                       <button onClick={() => handleRewrite('casual')} className="w-full text-left px-3 py-2 text-xs text-muted bg-surface hover:bg-surface-hover border border-transparent rounded-sm transition-colors flex justify-between items-center group">
                         <span>Simplify formatting</span>
                         <MoveRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                       <button onClick={handleSummarize} className="w-full text-left px-3 py-2 text-xs text-muted bg-surface hover:bg-surface-hover border border-transparent rounded-sm transition-colors flex justify-between items-center group">
                         <span>Generate brief summary</span>
                         <MoveRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                     </div>
                   </div>
                 )}

                 <div className="flex-1 flex flex-col space-y-4">
                   {chatMessages.map((msg, i) => (
                     <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] p-4 rounded-xl text-sm ${msg.role === 'user' ? 'bg-foreground text-background shadow-sm' : 'bg-surface border border-border text-foreground shadow-sm'}`}>
                         <div className="prose dark:prose-invert prose-sm max-w-none text-inherit prose-p:text-inherit">
                           <Markdown>{msg.content}</Markdown>
                         </div>
                       </div>
                       {msg.role === 'assistant' && !isAiLoading && i === chatMessages.length - 1 && (
                         <button 
                           onClick={() => replaceContent(msg.content)}
                           className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground flex items-center space-x-1"
                         >
                           <RefreshCw size={10} /> <span>Apply to Document</span>
                         </button>
                       )}
                     </div>
                   ))}
                 </div>

                 {isAiLoading && (
                   <div className="flex items-center space-x-3 text-muted bg-surface p-3 rounded-sm text-sm shrink-0">
                     <Loader2 className="animate-spin" size={16} />
                     <span>Processing...</span>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border bg-background shrink-0">
                <div className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask about this document..."
                    className="w-full bg-surface border border-border focus:border-border-strong focus:outline-none rounded-sm pl-3 pr-10 py-2.5 text-sm text-foreground transition-colors"
                  />
                  <button 
                    onClick={handleChat}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 disabled:opacity-30"
                  >
                     <Send size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 px-1 text-xs text-muted">
                  <span className="flex items-center space-x-1 tracking-widest uppercase text-[9px] font-semibold"><Sparkles size={10} /> <span>Parameters</span></span>
                  <span className="tracking-widest uppercase text-[9px] font-semibold">Gemini Pro</span>
                </div>
              </div>

            </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 h-full flex-col text-center bg-background">
             <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-[#CCC]">
                <FileText size={24} />
             </div>
             <p className="text-lg text-foreground font-semibold mb-2">No Document Selected</p>
             <p className="text-muted text-sm max-w-sm">Select an existing workspace document from the sidebar or draft a new entry.</p>
          </div>
        )}
      </div>

      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-[#00000020] backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-background border border-border shadow-xl w-full max-w-lg min-h-[50vh] max-h-[80vh] flex flex-col relative rounded-md">
            <button 
              onClick={() => setIsLinkModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-2"
            >
              <X size={18} />
            </button>
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Insert Drive Link</h2>
              <p className="text-muted text-sm mt-1">Select a recent file to insert into your document.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {isDriveLoading ? (
                <div className="flex-1 flex items-center justify-center text-muted">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted text-sm">
                  No recent files found.
                </div>
              ) : (
                <div className="space-y-1">
                  {driveFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => handleInsertLink(file)}
                      className="flex items-center space-x-3 p-3 hover:bg-surface rounded-sm cursor-pointer transition-colors border border-transparent hover:border-border"
                    >
                      <div className="text-muted shrink-0"><File size={16} /></div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                      </div>
                      <div className="text-muted shrink-0 opacity-0 group-hover:opacity-100">
                        <Plus size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isShareModalOpen && selectedDoc && (
        <div className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-background border border-border shadow-2xl w-full max-w-md overflow-hidden rounded-md animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
              <div className="flex items-center space-x-2">
                <Share2 size={18} className="text-foreground" />
                <h2 className="text-lg font-bold text-foreground">Share Document</h2>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-muted hover:text-foreground transition-all p-1 hover:bg-surface rounded-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center p-4 bg-surface border border-border rounded-sm">
                <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center border border-border shrink-0 mr-4">
                  <Globe size={20} className="text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Private Link</h3>
                  <p className="text-[11px] text-muted">Only users with access to this workspace can view this link.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Shareable Link</label>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-surface border border-border rounded-sm px-3 py-2 text-xs text-muted truncate flex items-center">
                    <span className="truncate">{`${window.location.origin}/docs/${selectedDoc.id}`}</span>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-sm font-bold text-xs flex items-center space-x-2 transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-foreground text-background hover:bg-foreground-hover'}`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-2 text-muted">
                  <Lock size={12} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">Workspace Encrypted</span>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-xs font-bold text-foreground hover:underline"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
