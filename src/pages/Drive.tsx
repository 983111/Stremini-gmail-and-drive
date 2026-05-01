import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentDriveFiles, fetchDriveFileContent, createDriveFolder, deleteDriveFile, uploadDriveFile } from '../lib/googleApi';
import { Search, Loader2, File, ExternalLink, Sparkles, HardDrive, Folder, Plus, Trash2, X, Upload } from 'lucide-react';
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
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName || !accessToken) return;
    setLoading(true);
    try {
      await createDriveFolder(accessToken, newFolderName, currentFolderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFiles(query, currentFolderId);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    
    setIsUploading(true);
    try {
      await uploadDriveFile(accessToken, file, currentFolderId);
      loadFiles(query, currentFolderId);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!accessToken || !window.confirm("Are you sure you want to delete this item? This action is irreversible.")) return;
    setLoading(true);
    try {
      await deleteDriveFile(accessToken, fileId);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
      loadFiles(query, currentFolderId);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Connect Google Drive</h2>
        <p className="text-muted mb-8 max-w-md">To access drive intelligence, please grant access to your Google Drive account.</p>
        <button onClick={signIn} className="bg-foreground text-background px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-foreground-hover transition-colors">
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-[64px] border-b border-border flex items-center justify-between px-8 bg-background">
        <h1 className="text-xl font-semibold text-foreground">Drive Sync</h1>
        <form onSubmit={handleSearch} className="relative w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drive files..." 
            className="w-full bg-surface text-sm pl-9 pr-4 py-2 rounded-sm border border-border focus:border-border-strong outline-none transition-colors"
          />
        </form>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Drive List */}
        <div className="w-[340px] border-r border-border bg-background flex flex-col shrink-0">
          {/* Breadcrumbs */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-1 overflow-x-auto whitespace-nowrap flex-1">
              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center space-x-1">
                  <button 
                    onClick={() => navigateUp(index)}
                    className={`text-xs ${index === folderPath.length - 1 ? 'text-foreground font-semibold' : 'text-muted hover:text-foreground'} transition-colors`}
                  >
                    {folder.name}
                  </button>
                  {index < folderPath.length - 1 && <span className="text-muted text-xs">/</span>}
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
                <Upload size={16} />
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
              </label>
              <button 
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="text-muted hover:text-foreground transition-colors p-1"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-1.5 flex flex-col pt-2">
          {isUploading && (
            <div className="mb-2 p-2 bg-surface border border-border rounded-sm flex items-center space-x-2">
              <Loader2 size={14} className="animate-spin text-muted" />
              <span className="text-xs text-muted">Uploading file...</span>
            </div>
          )}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="mb-2 flex items-center space-x-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="New folder name..." 
                autoFocus
                className="w-full bg-surface text-sm px-3 py-1.5 rounded-sm border border-border focus:border-border-strong outline-none transition-colors"
                disabled={loading}
              />
              <button type="submit" disabled={!newFolderName || loading} className="p-1.5 bg-foreground text-background rounded-sm hover:bg-foreground-hover disabled:opacity-50">
                <Plus size={14} />
              </button>
              <button type="button" onClick={() => setIsCreatingFolder(false)} className="p-1.5 text-muted hover:text-foreground">
                <X size={14} />
              </button>
            </form>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 text-sm border border-red-100 rounded-sm">
              {error}
            </div>
          )}
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted" /></div>
          ) : files.length === 0 ? (
             <div className="text-center text-muted text-sm font-medium p-8">No files found.</div>
          ) : (
            files.map(file => (
              <div 
                key={file.id} 
                className={`p-3 cursor-pointer hover:bg-surface transition-colors rounded-sm flex items-center space-x-3 group ${selectedFile?.id === file.id ? 'bg-surface-hover border border-border-strong shadow-sm text-foreground' : 'border border-transparent text-muted'}`}
                onClick={() => {
                  if (file.mimeType === 'application/vnd.google-apps.folder') {
                    navigateToFolder(file);
                  } else {
                    setSelectedFile(file);
                  }
                }}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${selectedFile?.id === file.id ? "text-foreground" : "text-muted"}`}>
                  {file.mimeType === 'application/vnd.google-apps.folder' ? <Folder size={16} /> : <File size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${selectedFile?.id === file.id ? "text-foreground" : "text-foreground-muted"}`}>{file.name}</div>
                  <div className="text-[10px] text-muted font-semibold uppercase tracking-widest truncate mt-0.5">
                    {new Date(file.modifiedTime).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteFile(file.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-red-500 transition-all rounded-sm hover:bg-surface"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex-1 bg-background flex flex-col items-center">
          {selectedFile ? (
             <div className="max-w-2xl w-full p-12 overflow-y-auto">
               <div className="w-16 h-16 bg-surface rounded-sm flex items-center justify-center mb-6 text-foreground">
                 <File size={24} />
               </div>
               <h2 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">{selectedFile.name}</h2>
               <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-8">
                 Last modified: {new Date(selectedFile.modifiedTime).toLocaleString()}
               </div>

               <div className="flex space-x-3 mb-12">
                 <a 
                   href={selectedFile.webViewLink} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center space-x-2 bg-background border border-border px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-surface transition-colors text-foreground"
                 >
                   <ExternalLink size={14} />
                   <span>Open in Drive</span>
                 </a>
                 <button 
                  onClick={() => handleAnalze(selectedFile)}
                  disabled={isAiLoading}
                  className="bg-foreground text-background px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-foreground-hover transition-colors flex items-center space-x-2 disabled:opacity-50"
                 >
                   {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                   <span>Analyze with AI</span>
                 </button>
               </div>

               {isPreviewLoading ? (
                 <div className="flex items-center space-x-2 text-muted mb-8 text-sm">
                   <Loader2 size={14} className="animate-spin" />
                   <span>Loading preview...</span>
                 </div>
               ) : filePreview ? (
                 <div className="mb-12">
                   <h3 className="text-xs font-semibold text-muted mb-4 uppercase tracking-wider">File Content Preview</h3>
                   <div className="bg-surface border border-border rounded-sm p-6 max-h-64 overflow-y-auto w-full">
                     <pre className="text-sm font-mono text-foreground-muted whitespace-pre-wrap">{filePreview}</pre>
                   </div>
                 </div>
               ) : null}

               {aiSummary && (
                 <div className="bg-surface p-8 border border-border rounded-sm">
                   <h3 className="text-xs font-semibold text-muted mb-6 uppercase tracking-wider flex items-center space-x-2">
                       <Sparkles size={12}/> <span>AI Analysis Result</span>
                   </h3>
                   <div className="prose dark:prose-invert prose-sm text-foreground-muted max-w-none">
                     <Markdown>{aiSummary}</Markdown>
                   </div>
                 </div>
               )}
             </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted font-medium text-sm w-full bg-background">
               <div className="text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-4 text-muted">
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
