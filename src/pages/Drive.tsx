import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentDriveFiles, fetchDriveFileContent } from '../lib/googleApi';
import { Search, Loader2, File, ExternalLink, Sparkles, HardDrive, Folder } from 'lucide-react';
import { summarizeDocumentContent } from '../lib/gemini';
import Markdown from 'react-markdown';

export function Drive() {
  const { accessToken, signIn } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Drive'}]);

  useEffect(() => {
    if (selectedFile && accessToken) {
      setIsPreviewLoading(true);
      setFilePreview(null);
      fetchDriveFileContent(accessToken, selectedFile.id, selectedFile.mimeType)
        .then(content => {
          if (typeof content === 'string') {
            setFilePreview(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''));
          } else {
            setFilePreview(JSON.stringify(content, null, 2).substring(0, 1000));
          }
        })
        .catch(e => {
          setFilePreview(null);
        })
        .finally(() => setIsPreviewLoading(false));
    } else {
      setFilePreview(null);
    }
  }, [selectedFile, accessToken]);

  const loadFiles = async (searchQuery: string, folderId: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      let qStr = `trashed=false`;
      if (searchQuery) {
        qStr += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      } else {
        qStr += ` and '${folderId}' in parents`;
      }
      const data = await fetchRecentDriveFiles(accessToken, qStr);
      setFiles(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred fetching Drive files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadFiles(query, currentFolderId);
    }
  }, [accessToken, currentFolderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(query, currentFolderId);
  };

  const navigateToFolder = (file: any) => {
    setCurrentFolderId(file.id);
    setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
    setQuery('');
  };

  const navigateUp = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath(prev => prev.slice(0, index + 1));
    setQuery('');
  };

  const handleAnalze = async (file: any) => {
    if (!accessToken) return;
    setIsAiLoading(true);
    setAiSummary('');
    try {
      const content = await fetchDriveFileContent(accessToken, file.id, file.mimeType);
      const summary = await summarizeDocumentContent(content);
      setAiSummary(summary);
    } catch (e: any) {
      setAiSummary('Error extracting or summarizing document: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#FDFDFD]">
        <h2 className="text-2xl font-semibold mb-4 text-[#111]">Connect Google Drive</h2>
        <p className="text-[#666] mb-8 max-w-md">To access drive intelligence, please grant access to your Google Drive account.</p>
        <button onClick={signIn} className="bg-black text-white px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-[#222] transition-colors">
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF]">
      <div className="h-[64px] border-b border-[#EEEEEE] flex items-center justify-between px-8 bg-[#FFFFFF]">
        <h1 className="text-xl font-semibold text-[#111]">Drive Sync</h1>
        <form onSubmit={handleSearch} className="relative w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drive files..." 
            className="w-full bg-[#F5F5F5] text-sm pl-9 pr-4 py-2 rounded-sm border border-[#EEEEEE] focus:border-[#CCCCCC] outline-none transition-colors"
          />
        </form>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Drive List */}
        <div className="w-[340px] border-r border-[#EEEEEE] bg-[#FDFDFD] flex flex-col shrink-0">
          {/* Breadcrumbs */}
          <div className="px-4 py-2 border-b border-[#EEEEEE] flex items-center space-x-1 overflow-x-auto whitespace-nowrap">
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center space-x-1">
                <button 
                  onClick={() => navigateUp(index)}
                  className={`text-xs ${index === folderPath.length - 1 ? 'text-[#111] font-semibold' : 'text-[#888] hover:text-[#111]'} transition-colors`}
                >
                  {folder.name}
                </button>
                {index < folderPath.length - 1 && <span className="text-[#CCC] text-xs">/</span>}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-1.5 flex flex-col pt-2">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 text-sm border border-red-100 rounded-sm">
              {error}
            </div>
          )}
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#888]" /></div>
          ) : files.length === 0 ? (
             <div className="text-center text-[#888] text-sm font-medium p-8">No files found.</div>
          ) : (
            files.map(file => (
              <div 
                key={file.id} 
                className={`p-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors rounded-sm flex items-center space-x-3 ${selectedFile?.id === file.id ? 'bg-[#EEEEEE] border border-[#DDD] shadow-sm text-[#111]' : 'border border-transparent text-[#555]'}`}
                onClick={() => {
                  if (file.mimeType === 'application/vnd.google-apps.folder') {
                    navigateToFolder(file);
                  } else {
                    setSelectedFile(file);
                  }
                }}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${selectedFile?.id === file.id ? "text-[#111]" : "text-[#888]"}`}>
                  {file.mimeType === 'application/vnd.google-apps.folder' ? <Folder size={16} /> : <File size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${selectedFile?.id === file.id ? "text-[#111]" : "text-[#333]"}`}>{file.name}</div>
                  <div className="text-[10px] text-[#888] font-semibold uppercase tracking-widest truncate mt-0.5">
                    {new Date(file.modifiedTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex-1 bg-[#FFFFFF] flex flex-col items-center">
          {selectedFile ? (
             <div className="max-w-2xl w-full p-12 overflow-y-auto">
               <div className="w-16 h-16 bg-[#F5F5F5] rounded-sm flex items-center justify-center mb-6 text-[#111]">
                 <File size={24} />
               </div>
               <h2 className="text-3xl font-semibold text-[#111] mb-2 tracking-tight">{selectedFile.name}</h2>
               <div className="text-xs font-semibold uppercase tracking-wider text-[#888] mb-8">
                 Last modified: {new Date(selectedFile.modifiedTime).toLocaleString()}
               </div>

               <div className="flex space-x-3 mb-12">
                 <a 
                   href={selectedFile.webViewLink} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center space-x-2 bg-white border border-[#EEEEEE] px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-[#F9F9F9] transition-colors text-[#111]"
                 >
                   <ExternalLink size={14} />
                   <span>Open in Drive</span>
                 </a>
                 <button 
                  onClick={() => handleAnalze(selectedFile)}
                  disabled={isAiLoading}
                  className="bg-black text-white px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-[#222] transition-colors flex items-center space-x-2 disabled:opacity-50"
                 >
                   {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                   <span>Analyze with AI</span>
                 </button>
               </div>

               {isPreviewLoading ? (
                 <div className="flex items-center space-x-2 text-[#888] mb-8 text-sm">
                   <Loader2 size={14} className="animate-spin" />
                   <span>Loading preview...</span>
                 </div>
               ) : filePreview ? (
                 <div className="mb-12">
                   <h3 className="text-xs font-semibold text-[#888] mb-4 uppercase tracking-wider">File Content Preview</h3>
                   <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-sm p-6 max-h-64 overflow-y-auto w-full">
                     <pre className="text-sm font-mono text-[#333] whitespace-pre-wrap">{filePreview}</pre>
                   </div>
                 </div>
               ) : null}

               {aiSummary && (
                 <div className="bg-[#F9F9F9] p-8 border border-[#EEEEEE] rounded-sm">
                   <h3 className="text-xs font-semibold text-[#888] mb-6 uppercase tracking-wider flex items-center space-x-2">
                       <Sparkles size={12}/> <span>AI Analysis Result</span>
                   </h3>
                   <div className="prose prose-sm text-[#333] max-w-none">
                     <Markdown>{aiSummary}</Markdown>
                   </div>
                 </div>
               )}
             </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[#888] font-medium text-sm w-full bg-[#FDFDFD]">
               <div className="text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4 text-[#CCC]">
                    <HardDrive size={20} />
                  </div>
                  Select a Google Drive file to sync and analyze
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
