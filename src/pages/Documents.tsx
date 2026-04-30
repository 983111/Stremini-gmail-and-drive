import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { FileText, Plus, Trash2, Sparkles, Loader2, Eye, Edit3, X, RefreshCw, Send, MoveRight, Link as LinkIcon, File, User } from 'lucide-react';
import { rewriteDocument, summarizeDocumentContent, askDocumentQuestion } from '../lib/gemini';
import Markdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentDriveFiles } from '../lib/googleApi';

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

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
    <div className="flex h-full bg-[#FFFFFF]">
      {/* Sidebar list */}
      <div className="w-64 border-r border-[#EEEEEE] bg-[#FDFDFD] flex flex-col flex-shrink-0 z-0">
        <div className="p-4 border-b border-[#EEEEEE] flex justify-between items-center bg-[#FFFFFF]">
          <h2 className="font-semibold text-xs text-[#888] uppercase tracking-wider">Workspace</h2>
          <button onClick={createDoc} className="p-1 hover:bg-[#F5F5F5] rounded-sm text-[#888] hover:text-[#111] transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {docs.map(d => (
            <div 
              key={d.id}
              onClick={() => setSelectedDoc(d)}
              className={`group flex items-center justify-between p-2 rounded-sm cursor-pointer text-sm transition-colors ${selectedDoc?.id === d.id ? 'bg-[#F5F5F5] text-[#111] font-medium' : 'text-[#555] hover:bg-[#FAFAFA]'}`}
            >
              <div className="flex items-center space-x-2 truncate">
                <FileText size={14} className={selectedDoc?.id === d.id ? "text-[#111]" : "text-[#888]"} />
                <span className="truncate">{d.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteDocument(d.id); }} 
                className={`opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1 rounded-sm hover:bg-white`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 overflow-auto relative bg-[#FFFFFF] flex">
        {selectedDoc ? (
          <>
            <div className="flex-1 p-16 overflow-y-auto max-w-4xl mx-auto flex flex-col">
              <div className="flex justify-between items-start mb-12 group">
                <input 
                  type="text"
                  value={selectedDoc.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setSelectedDoc({ ...selectedDoc, title: newTitle });
                    updateDocument(selectedDoc.id, newTitle, selectedDoc.content);
                  }}
                  className="w-full text-4xl font-semibold bg-transparent border-none focus:outline-none placeholder-[#DDD] text-[#111] tracking-tight"
                  placeholder="Document Title"
                />
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 bg-[#F5F5F5] p-1 rounded-sm border border-[#EEEEEE] transition-opacity shrink-0">
                  <button 
                    onClick={() => setIsPreview(false)}
                    className={`p-1.5 rounded-sm transition-colors flex items-center justify-center ${!isPreview ? 'bg-white shadow-sm text-[#111]' : 'text-[#888] hover:text-[#111]'}`}
                    title="Edit Mode"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => setIsPreview(true)}
                    className={`p-1.5 rounded-sm transition-colors flex items-center justify-center ${isPreview ? 'bg-white shadow-sm text-[#111]' : 'text-[#888] hover:text-[#111]'}`}
                    title="Preview Mode"
                  >
                    <Eye size={14} />
                  </button>
                  <div className="w-[1px] h-4 bg-[#EEEEEE] mx-1"></div>
                  <button 
                    onClick={handleOpenLinkModal}
                    className="p-1.5 rounded-sm transition-colors flex items-center justify-center text-[#888] hover:text-[#111] hover:bg-[#EAEAEA]"
                    title="Insert Drive Link"
                  >
                    <LinkIcon size={14} />
                  </button>
                </div>
              </div>

              {!isPreview ? (
                <textarea
                  value={selectedDoc.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    setSelectedDoc({ ...selectedDoc, content: newContent });
                    updateDocument(selectedDoc.id, selectedDoc.title, newContent);
                  }}
                  className="w-full flex-1 min-h-[60vh] bg-transparent border-none focus:outline-none text-[#333] text-base resize-none leading-relaxed placeholder-[#DDD]"
                  placeholder="Start typing..."
                />
              ) : (
                <div className="w-full flex-1 min-h-[60vh] prose prose-sm text-[#333] max-w-none">
                  <Markdown>{selectedDoc.content}</Markdown>
                </div>
              )}
            </div>
            
            {/* AI Panel (Right Sidebar) */}
            <div className="w-[340px] bg-[#FDFDFD] border-l border-[#EEEEEE] flex flex-col shrink-0 relative shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
              {/* Header */}
              <div className="h-14 px-4 border-b border-[#EEEEEE] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-[#111]" />
                  <h3 className="text-sm font-semibold text-[#111]">Assistant</h3>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => setChatMessages([])}
                    className="p-1.5 text-[#888] hover:bg-[#F5F5F5] rounded-sm transition-colors"
                    title="Clear Chat"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button className="p-1.5 text-[#888] hover:bg-[#F5F5F5] rounded-sm transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Chat / Output Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                 
                 {/* System context state */}
                 <div className="flex justify-center shrink-0">
                   <div className="bg-[#EAEAEA] text-[#555] text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm flex items-center space-x-1">
                     <FileText size={10} /> <span>Context Linked</span>
                   </div>
                 </div>

                 {chatMessages.length === 0 && (
                   <div className="bg-white border border-[#EEE] rounded-sm p-4 shadow-sm shrink-0">
                     <p className="text-sm text-[#111] font-medium mb-3">How can I help you refine this?</p>
                     <div className="space-y-2">
                       <button onClick={() => handleRewrite('formal')} className="w-full text-left px-3 py-2 text-xs text-[#555] bg-[#F5F5F5] hover:bg-[#EEE] border border-transparent rounded-sm transition-colors flex justify-between items-center group">
                         <span>Make it authoritative</span>
                         <MoveRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                       <button onClick={() => handleRewrite('casual')} className="w-full text-left px-3 py-2 text-xs text-[#555] bg-[#F5F5F5] hover:bg-[#EEE] border border-transparent rounded-sm transition-colors flex justify-between items-center group">
                         <span>Simplify formatting</span>
                         <MoveRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                       <button onClick={handleSummarize} className="w-full text-left px-3 py-2 text-xs text-[#555] bg-[#F5F5F5] hover:bg-[#EEE] border border-transparent rounded-sm transition-colors flex justify-between items-center group">
                         <span>Generate brief summary</span>
                         <MoveRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                     </div>
                   </div>
                 )}

                 <div className="flex-1 flex flex-col space-y-4">
                   {chatMessages.map((msg, i) => (
                     <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[85%] p-3 rounded-sm text-sm ${msg.role === 'user' ? 'bg-[#111] text-white' : 'bg-[#F5F5F5] border border-[#EEE] text-[#333]'}`}>
                         <div className="prose prose-sm prose-invert max-w-none">
                           <Markdown>{msg.content}</Markdown>
                         </div>
                       </div>
                       {msg.role === 'assistant' && !isAiLoading && i === chatMessages.length - 1 && (
                         <button 
                           onClick={() => replaceContent(msg.content)}
                           className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-[#111] flex items-center space-x-1"
                         >
                           <RefreshCw size={10} /> <span>Apply to Document</span>
                         </button>
                       )}
                     </div>
                   ))}
                 </div>

                 {isAiLoading && (
                   <div className="flex items-center space-x-3 text-[#666] bg-[#F5F5F5] p-3 rounded-sm text-sm shrink-0">
                     <Loader2 className="animate-spin" size={16} />
                     <span>Processing...</span>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-[#EEEEEE] bg-white shrink-0">
                <div className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask about this document..."
                    className="w-full bg-[#F5F5F5] border border-[#EEEEEE] focus:border-[#CCCCCC] focus:outline-none rounded-sm pl-3 pr-10 py-2.5 text-sm text-[#111] transition-colors"
                  />
                  <button 
                    onClick={handleChat}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#111] p-1 disabled:opacity-30"
                  >
                     <Send size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 px-1 text-xs text-[#888]">
                  <span className="flex items-center space-x-1 tracking-widest uppercase text-[9px] font-semibold"><Sparkles size={10} /> <span>Parameters</span></span>
                  <span className="tracking-widest uppercase text-[9px] font-semibold">Gemini Pro</span>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 h-full flex-col text-center bg-[#FDFDFD]">
             <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4 text-[#CCC]">
                <FileText size={24} />
             </div>
             <p className="text-lg text-[#111] font-semibold mb-2">No Document Selected</p>
             <p className="text-[#888] text-sm max-w-sm">Select an existing workspace document from the sidebar or draft a new entry.</p>
          </div>
        )}
      </div>

      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-[#00000020] backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white border border-[#EEE] shadow-xl w-full max-w-lg min-h-[50vh] max-h-[80vh] flex flex-col relative rounded-md">
            <button 
              onClick={() => setIsLinkModalOpen(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#111] transition-colors p-2"
            >
              <X size={18} />
            </button>
            <div className="p-6 border-b border-[#EEE]">
              <h2 className="text-xl font-semibold text-[#111]">Insert Drive Link</h2>
              <p className="text-[#666] text-sm mt-1">Select a recent file to insert into your document.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {isDriveLoading ? (
                <div className="flex-1 flex items-center justify-center text-[#888]">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[#888] text-sm">
                  No recent files found.
                </div>
              ) : (
                <div className="space-y-1">
                  {driveFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => handleInsertLink(file)}
                      className="flex items-center space-x-3 p-3 hover:bg-[#F5F5F5] rounded-sm cursor-pointer transition-colors border border-transparent hover:border-[#EEE]"
                    >
                      <div className="text-[#888] shrink-0"><File size={16} /></div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium text-[#111] truncate">{file.name}</div>
                      </div>
                      <div className="text-[#888] shrink-0 opacity-0 group-hover:opacity-100">
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
    </div>
  );
}
