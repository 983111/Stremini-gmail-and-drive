import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp, writeBatch, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Plus, Trash2, Loader2, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { generateDatabaseSchema } from '../lib/gemini';
import { cn } from '../lib/utils';

interface DbSchema {
  key: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: string[];
}

interface AppDatabase {
  id: string;
  name: string;
  schema: string;
  createdAt: any;
  updatedAt: any;
}

interface DatabaseRecord {
  id: string;
  title: string;
  properties: string;
  order: number;
}

const TYPE_BADGE: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Select',
  checkbox: 'Bool',
};

export function Databases() {
  const [databases, setDatabases] = useState<AppDatabase[]>([]);
  const [selectedDb, setSelectedDb] = useState<AppDatabase | null>(null);
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/databases`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setDatabases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDatabase)));
    }, error => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/databases`);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !selectedDb) { setRecords([]); return; }
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`),
      orderBy('order', 'asc')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DatabaseRecord)));
    }, error => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/databases/${selectedDb?.id}/records`);
    });
    return () => unsubscribe();
  }, [selectedDb]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || !auth.currentUser) return;
    setIsGenerating(true);
    try {
      const result = await generateDatabaseSchema(prompt);
      const batch = writeBatch(db);
      const dbRef = doc(collection(db, `users/${auth.currentUser.uid}/databases`));
      const dbData = {
        name: result.databaseTitle || 'New Database',
        schema: JSON.stringify(result.columns || []),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser.uid,
      };
      batch.set(dbRef, dbData);
      (result.rows || []).forEach((row: any, index: number) => {
        const recordRef = doc(collection(db, `users/${auth.currentUser.uid}/databases/${dbRef.id}/records`));
        const firstColKey = result.columns?.[0]?.key || 'title';
        batch.set(recordRef, {
          title: String(row[firstColKey] || 'Untitled'),
          properties: JSON.stringify(row),
          order: index,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setPrompt('');
      setSelectedDb({ id: dbRef.id, ...dbData });
    } catch (e: any) {
      alert('Failed to generate database: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDb = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser || !confirm('Delete this database and all records?')) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/databases/${id}`));
      if (selectedDb?.id === id) setSelectedDb(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser?.uid}/databases/${id}`);
    }
  };

  const updateCell = async (recordId: string, key: string, value: any) => {
    if (!auth.currentUser || !selectedDb) return;
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    const props = JSON.parse(record.properties);
    props[key] = value;
    const updateData: any = { properties: JSON.stringify(props), updatedAt: serverTimestamp() };
    const schema: DbSchema[] = JSON.parse(selectedDb.schema);
    if (schema[0]?.key === key) updateData.title = String(value);
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records/${recordId}`), updateData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser?.uid}/databases/${selectedDb.id}/records/${recordId}`);
    }
  };

  const renderCell = (record: DatabaseRecord, col: DbSchema) => {
    const props = JSON.parse(record.properties);
    const value = props[col.key];
    const base = 'w-full bg-transparent border-none text-sm text-foreground focus:outline-none focus:ring-0 p-0';

    switch (col.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => updateCell(record.id, col.key, e.target.checked)}
            className="w-4 h-4 rounded-sm border-border accent-foreground cursor-pointer"
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={e => updateCell(record.id, col.key, e.target.value)}
            className={cn(base, 'cursor-pointer')}
          >
            <option value="">—</option>
            {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={e => updateCell(record.id, col.key, Number(e.target.value))}
            className={base}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={e => updateCell(record.id, col.key, e.target.value)}
            className={cn(base, 'cursor-pointer')}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => updateCell(record.id, col.key, e.target.value)}
            className={base}
            placeholder="—"
          />
        );
    }
  };

  // Sorted + filtered records
  const schema: DbSchema[] = selectedDb ? JSON.parse(selectedDb.schema) : [];
  const filteredRecords = records.filter(r => {
    if (!search) return true;
    const props = JSON.parse(r.properties);
    return Object.values(props).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
  });
  const sortedRecords = sortCol
    ? [...filteredRecords].sort((a, b) => {
        const pa = JSON.parse(a.properties)[sortCol];
        const pb = JSON.parse(b.properties)[sortCol];
        const cmp = String(pa ?? '').localeCompare(String(pb ?? ''), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filteredRecords;

  const toggleSort = (key: string) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={cn(
        'w-full md:w-60 border-r border-border bg-background flex flex-col shrink-0 overflow-hidden',
        selectedDb && 'hidden md:flex'
      )}>
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted">Databases</p>
        </div>

        {/* DB list */}
        <div className="flex-1 overflow-y-auto py-2">
          {databases.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted leading-relaxed">No databases yet. Use the prompt to build one.</p>
            </div>
          ) : (
            databases.map(database => (
              <button
                key={database.id}
                onClick={() => setSelectedDb(database)}
                className={cn(
                  'w-full group flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                  selectedDb?.id === database.id
                    ? 'bg-surface text-foreground'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ChevronRight size={12} className={cn('shrink-0 transition-transform', selectedDb?.id === database.id && 'rotate-90')} />
                  <span className="text-sm truncate font-medium">{database.name}</span>
                </div>
                <button
                  onClick={e => deleteDb(database.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-foreground transition-all rounded-sm shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Prompt bar */}
        <div className="px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe a database — e.g. startup tracker, 30-day diet plan, inventory system..."
              className="flex-1 bg-surface border border-border text-foreground text-sm rounded-sm px-4 py-2.5 outline-none focus:border-border-strong transition-colors placeholder:text-muted"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover disabled:opacity-30 transition-colors shrink-0"
            >
              {isGenerating ? <Loader2 size={13} className="animate-spin" /> : null}
              {isGenerating ? 'Building...' : 'Build'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background">
          {selectedDb ? (
            <div className="h-full flex flex-col">

              {/* Table toolbar */}
              <div className="px-6 py-3 border-b border-border flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground">{selectedDb.name}</h2>
                  <span className="text-[10px] font-bold text-muted bg-surface border border-border px-2 py-0.5 rounded-sm">
                    {sortedRecords.length} rows
                  </span>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Filter records..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-surface border border-border rounded-sm pl-8 pr-4 py-1.5 text-xs text-foreground focus:border-border-strong outline-none transition-colors w-48"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-surface border-b border-border">
                      <th className="w-8 px-3 py-3 border-r border-border">
                        <span className="text-[10px] font-bold text-muted">#</span>
                      </th>
                      {schema.map(col => (
                        <th
                          key={col.key}
                          className="px-4 py-3 border-r border-border last:border-r-0 min-w-[140px] cursor-pointer group select-none"
                          onClick={() => toggleSort(col.key)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted group-hover:text-foreground transition-colors">
                              {col.name}
                            </span>
                            <span className="text-[9px] text-muted/60 font-normal normal-case tracking-normal bg-background border border-border px-1.5 py-0.5 rounded-sm">
                              {TYPE_BADGE[col.type] || col.type}
                            </span>
                            <ArrowUpDown
                              size={10}
                              className={cn(
                                'ml-auto transition-opacity',
                                sortCol === col.key ? 'opacity-100 text-foreground' : 'opacity-0 group-hover:opacity-40 text-muted'
                              )}
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record, i) => (
                      <tr
                        key={record.id}
                        className="border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors group"
                      >
                        <td className="px-3 py-2.5 border-r border-border text-[10px] text-muted font-mono">
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        {schema.map(col => (
                          <td key={col.key} className="px-4 py-2.5 border-r border-border last:border-r-0">
                            {renderCell(record, col)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add row */}
                <div className="px-4 py-2.5 border-t border-border bg-background">
                  <button
                    onClick={async () => {
                      if (!auth.currentUser || !selectedDb) return;
                      const initialProps: any = {};
                      schema.forEach(s => initialProps[s.key] = s.type === 'checkbox' ? false : s.type === 'number' ? 0 : '');
                      try {
                        await addDoc(collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`), {
                          title: 'New Row',
                          properties: JSON.stringify(initialProps),
                          order: records.length,
                          createdAt: serverTimestamp(),
                          updatedAt: serverTimestamp(),
                        });
                      } catch (e) { console.error(e); }
                    }}
                    className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors py-1"
                  >
                    <Plus size={13} />
                    Add row
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="max-w-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">Structured Data Engine</h2>
                  <p className="text-sm text-muted leading-relaxed">
                    Describe any dataset in plain language. AI will architect the schema and populate it with realistic sample data.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    'Startup product launch tracker',
                    '30-day corporate diet protocol',
                    'Content strategy calendar',
                    'E-commerce inventory',
                  ].map(ex => (
                    <button
                      key={ex}
                      onClick={() => { setPrompt(ex); }}
                      className="p-3 bg-surface border border-border rounded-sm text-xs text-muted hover:text-foreground hover:border-border-strong transition-all text-left leading-relaxed"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
