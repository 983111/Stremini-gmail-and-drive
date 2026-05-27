import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Search as SearchIcon, FileText, Database, Mail, X, Loader2, ArrowRight, CornerDownLeft, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchRecentEmails } from '../lib/googleApi';

// Define Search Types
interface UnifiedResult {
  id: string;
  type: 'document' | 'database' | 'record' | 'gmail';
  title: string;
  subtitle?: string;
  body?: string;
  metadata?: any; // e.g. dbId, threadId, etc.
}

export function GlobalSearch() {
  const { user, accessToken, signIn } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'documents' | 'databases' | 'gmail'>('all');
  const [loading, setLoading] = useState(false);

  // Indexes loaded from Firestore on demand
  const [localDocs, setLocalDocs] = useState<any[]>([]);
  const [localDbs, setLocalDbs] = useState<any[]>([]);
  const [localRecords, setLocalRecords] = useState<any[]>([]);
  const [gmailResults, setGmailResults] = useState<any[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Search Results State
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedGmailToken = useRef<any>(null);

  // Utility to escape regex characters safely
  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Safe Highlight text component helper
  const renderHighlightedText = (text: string, queryStr: string) => {
    if (!queryStr.trim()) return <span>{text}</span>;
    try {
      const parts = text.split(new RegExp(`(${escapeRegExp(queryStr)})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === queryStr.toLowerCase() ? (
              <mark key={i} className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 font-semibold px-0.5 rounded-sm">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    } catch (e) {
      return <span>{text}</span>;
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-load Firestore documents, databases, and records into client memory for high-performance indexing
  const loadLocalCache = async () => {
    if (!user || cacheLoaded) return;
    setLoading(true);
    try {
      const uid = user.uid;

      // 1. Fetch Documents
      const docsSnap = await getDocs(query(collection(db, `users/${uid}/documents`)));
      const docsData = docsSnap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Untitled Document',
        content: doc.data().content || '',
        updatedAt: doc.data().updatedAt,
      }));
      setLocalDocs(docsData);

      // 2. Fetch Databases Schema
      const dbsSnap = await getDocs(query(collection(db, `users/${uid}/databases`), orderBy('createdAt', 'desc')));
      const dbsData = dbsSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Untitled Database',
        schema: doc.data().schema ? JSON.parse(doc.data().schema) : [],
        updatedAt: doc.data().updatedAt,
      }));
      setLocalDbs(dbsData);

      // 3. Fetch Records across all Databases recursively
      const allRecords: any[] = [];
      await Promise.all(
        dbsData.map(async (database) => {
          try {
            const recordsSnap = await getDocs(collection(db, `users/${uid}/databases/${database.id}/records`));
            recordsSnap.docs.forEach(doc => {
              allRecords.push({
                id: doc.id,
                databaseId: database.id,
                databaseName: database.name,
                title: doc.data().title || 'Untitled Record',
                properties: doc.data().properties ? JSON.parse(doc.data().properties) : {},
              });
            });
          } catch (e) {
            console.error(`Error loading records for database ${database.id}:`, e);
          }
        })
      );
      setLocalRecords(allRecords);
      setCacheLoaded(true);
    } catch (error) {
      console.error('Error pre-loading search cache:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger cache load on input click/focus
  const handleFocus = () => {
    setIsFocused(true);
    loadLocalCache();
  };

  // In-Memory Global Search Matching across Document Titles, Document Markdown Contents,
  // Database Names, Database Columns, and Database Record cells.
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matches: UnifiedResult[] = [];

    // --- Search Documents ---
    if (activeTab === 'all' || activeTab === 'documents') {
      localDocs.forEach((doc) => {
        const titleMatch = doc.title.toLowerCase().includes(q);
        const contentMatch = doc.content.toLowerCase().includes(q);

        if (titleMatch || contentMatch) {
          // Extract a dynamic snippet of text surrounding the match
          let snippet = '';
          if (contentMatch) {
            const index = doc.content.toLowerCase().indexOf(q);
            const start = Math.max(0, index - 35);
            const end = Math.min(doc.content.length, index + q.length + 55);
            snippet = (start > 0 ? '...' : '') + doc.content.substring(start, end).replace(/\n/g, ' ') + (end < doc.content.length ? '...' : '');
          } else {
            snippet = doc.content.substring(0, 80).replace(/\n/g, ' ') + (doc.content.length > 80 ? '...' : '');
          }

          matches.push({
            id: doc.id,
            type: 'document',
            title: doc.title,
            subtitle: 'Documents',
            body: snippet,
          });
        }
      });
    }

    // --- Search Databases & Records ---
    if (activeTab === 'all' || activeTab === 'databases') {
      // Database names & schemas
      localDbs.forEach((db) => {
        const nameMatch = db.name.toLowerCase().includes(q);
        const columnMatch = db.schema.some((col: any) => col.name.toLowerCase().includes(q));

        if (nameMatch || columnMatch) {
          const colsStr = db.schema.map((col: any) => col.name).join(', ');
          matches.push({
            id: db.id,
            type: 'database',
            title: db.name,
            subtitle: 'Database Table',
            body: colsStr ? `Columns: ${colsStr}` : 'No columns defined',
          });
        }
      });

      // Cell properties
      localRecords.forEach((record) => {
        const titleMatch = record.title.toLowerCase().includes(q);
        let cellMatchLabel = '';

        // Match record primary cell values
        Object.entries(record.properties).forEach(([key, val]) => {
          if (val && String(val).toLowerCase().includes(q)) {
            cellMatchLabel += `${key}: ${val}; `;
          }
        });

        if (titleMatch || cellMatchLabel) {
          matches.push({
            id: record.id,
            type: 'record',
            title: record.title || 'Untitled Row',
            subtitle: `Database Row in "${record.databaseName}"`,
            body: cellMatchLabel || 'No filled fields match',
            metadata: { databaseId: record.databaseId },
          });
        }
      });
    }

    // Combine local results and set index
    setResults((prev) => {
      // Preserve current gmail results in current filter if they match the query
      const preservedGmail = activeTab === 'all' || activeTab === 'gmail' ? gmailResults : [];
      return [...matches, ...preservedGmail];
    });
    setSelectedIndex(0);
  }, [searchQuery, localDocs, localDbs, localRecords, gmailResults, activeTab]);

  // Live Gmail searching with dynamic API debounced call (300ms)
  useEffect(() => {
    if (!accessToken || !searchQuery.trim() || (activeTab !== 'all' && activeTab !== 'gmail')) {
      setGmailResults([]);
      return;
    }

    if (debouncedGmailToken.current) {
      clearTimeout(debouncedGmailToken.current);
    }

    debouncedGmailToken.current = setTimeout(async () => {
      try {
        setLoading(true);
        // Query the Gmail search API directly
        const searchVal = searchQuery.trim();
        const emails = await fetchRecentEmails(accessToken, searchVal);

        const mapped: UnifiedResult[] = emails.map((msg: any) => ({
          id: msg.id,
          type: 'gmail',
          title: msg.subject || 'No Subject',
          subtitle: `Gmail Inbox from ${msg.from.split('<')[0]}`,
          body: msg.snippet || '',
          metadata: { sender: msg.from, date: msg.date },
        }));

        setGmailResults(mapped);
      } catch (err) {
        console.error('Unified Gmail search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debouncedGmailToken.current) clearTimeout(debouncedGmailToken.current);
    };
  }, [searchQuery, accessToken, activeTab]);

  // Reset Gmail results list when the query changes to prevent stale results showing briefly
  useEffect(() => {
    setGmailResults([]);
  }, [searchQuery]);

  // Handle Result click Selection / Navigation router redirections
  const handleSelectResult = (item: UnifiedResult) => {
    setIsFocused(false);
    setSearchQuery('');

    if (item.type === 'document') {
      navigate(`/docs?id=${item.id}`);
    } else if (item.type === 'database') {
      navigate(`/databases?id=${item.id}`);
    } else if (item.type === 'record') {
      navigate(`/databases?id=${item.metadata?.databaseId}`);
    } else if (item.type === 'gmail') {
      navigate(`/mail?id=${item.id}`);
    }
  };

  // Keyboard controls for power-users (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <SearchIcon size={14} className="text-muted" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search documents, tables, emails..."
          className="w-full bg-surface text-foreground placeholder-muted text-sm rounded-sm pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-ring border border-transparent focus:border-border transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          id="search-input"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5 rounded-full hover:bg-surface-hover"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-background border border-border shadow-2xl rounded-md z-50 flex flex-col overflow-hidden max-h-[500px]"
          >
            {/* Navigational Tabs & Filters */}
            <div className="flex border-b border-border bg-surface shrink-0 p-1.5 gap-1">
              {(['all', 'documents', 'databases', 'gmail'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1 text-xs font-semibold capitalize rounded-sm transition-colors ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted hover:bg-surface-hover hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
              {loading && (
                <div className="ml-auto flex items-center space-x-1.5 text-muted text-[10px] pr-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Indexing...</span>
                </div>
              )}
            </div>

            {/* Results Output List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[350px]">
              {results.length === 0 ? (
                <div className="p-8 text-center">
                  {searchQuery.trim() ? (
                    <div>
                      <p className="text-sm font-semibold text-muted">No results found for "{searchQuery}"</p>
                      <p className="text-xs text-muted mt-1">Refine your keyword search parameters or adjust categories.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center p-2.5 bg-surface rounded-full text-muted">
                        <Sparkles size={18} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Workspace Quick Search</p>
                      <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                        Start typing to search instantly across workspace documents, cloud connected database tables, and your Gmail inbox.
                      </p>
                    </div>
                  )}

                  {/* Connect Google check */}
                  {!accessToken && searchQuery.trim() && (activeTab === 'all' || activeTab === 'gmail') && (
                    <div className="mt-4 p-3 border border-border bg-surface rounded-sm max-w-sm mx-auto">
                      <p className="text-xs text-muted mb-2">Connect Gmail to search emails directly in real-time.</p>
                      <button
                        onClick={signIn}
                        className="px-3 py-1 bg-foreground text-background text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-foreground-hover"
                      >
                        Connect Google Account
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                results.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id + '_' + item.type + '_' + index}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => handleSelectResult(item)}
                      className={`flex items-start gap-3 p-3 rounded-sm cursor-pointer transition-colors border ${
                        isSelected
                          ? 'bg-surface border-border-strong'
                          : 'border-transparent hover:bg-surface/50'
                      }`}
                    >
                      {/* Icon Container */}
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'document' && <FileText size={16} className="text-blue-500" />}
                        {item.type === 'database' && <Database size={16} className="text-purple-500" />}
                        {item.type === 'record' && <Database size={16} className="text-indigo-500" />}
                        {item.type === 'gmail' && <Mail size={16} className="text-red-500" />}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                            {item.subtitle}
                          </span>
                          {item.type === 'gmail' && item.metadata?.date && (
                            <span className="text-[10px] text-muted">
                              {new Date(item.metadata.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {renderHighlightedText(item.title, searchQuery)}
                        </h4>
                        {item.body && (
                          <p className="text-xs text-muted leading-relaxed line-clamp-1 mt-0.5">
                            {renderHighlightedText(item.body, searchQuery)}
                          </p>
                        )}
                      </div>

                      {/* Selector Shortcut Help */}
                      {isSelected && (
                        <div className="self-center shrink-0 text-muted opacity-80 flex items-center bg-background border border-border p-1 rounded-sm gap-0.5">
                          <CornerDownLeft size={10} />
                          <span className="text-[8px] font-bold tracking-wider">ENTER</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Keyboard Shortcuts Help Banner */}
            {results.length > 0 && (
              <div className="bg-surface border-t border-border p-2 px-3 text-[10px] text-muted flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <span>
                    Use <kbd className="border border-border bg-background px-1 rounded-sm">↑</kbd>{' '}
                    <kbd className="border border-border bg-background px-1 rounded-sm">↓</kbd> to navigate
                  </span>
                  <span>
                    <kbd className="border border-border bg-background px-1 rounded-sm">Enter</kbd> to open
                  </span>
                </div>
                <span>
                  <kbd className="border border-border bg-background px-1 rounded-sm">Esc</kbd> to exit
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
