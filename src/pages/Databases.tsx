import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp, writeBatch, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Database, Plus, Trash2, Cpu, Loader2, X, Search, Filter, ArrowUpDown, ChevronDown, ChevronRight, Save, Table as TableIcon } from 'lucide-react';
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
  schema: string; // JSON string of DbSchema[]
  createdAt: any;
  updatedAt: any;
}

interface DatabaseRecord {
  id: string;
  title: string;
  properties: string; // JSON string of Record<string, any>
  order: number;
}

export function Databases() {
  const [databases, setDatabases] = useState<AppDatabase[]>([]);
  const [selectedDb, setSelectedDb] = useState<AppDatabase | null>(null);
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [search, setSearch] = useState('');

  // Load databases
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/databases`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDatabase));
      setDatabases(dbs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/databases`);
    });
    return () => unsubscribe();
  }, []);

  // Load records for selected database
  useEffect(() => {
    if (!auth.currentUser || !selectedDb) {
      setRecords([]);
      return;
    }
    const q = query(collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DatabaseRecord));
      setRecords(recs);
    }, (error) => {
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
      
      // Create database
      const dbRef = doc(collection(db, `users/${auth.currentUser.uid}/databases`));
      const dbData = {
        name: result.databaseTitle || "New Database",
        schema: JSON.stringify(result.columns || []),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser.uid
      };
      batch.set(dbRef, dbData);

      // Create records
      (result.rows || []).forEach((row: any, index: number) => {
        const recordRef = doc(collection(db, `users/${auth.currentUser.uid}/databases/${dbRef.id}/records`));
        const firstColKey = result.columns?.[0]?.key || 'title';
        batch.set(recordRef, {
          title: String(row[firstColKey] || 'Untitled'),
          properties: JSON.stringify(row),
          order: index,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      setPrompt('');
      setSelectedDb({ id: dbRef.id, ...dbData });
    } catch (e: any) {
      alert("Failed to generate database: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDb = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser || !confirm("Delete this database and all records?")) return;
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
    
    const updateData: any = {
      properties: JSON.stringify(props),
      updatedAt: serverTimestamp()
    };

    // If it's the title column, update the title field too
    const schema: DbSchema[] = JSON.parse(selectedDb.schema);
    if (schema[0]?.key === key) {
      updateData.title = String(value);
    }

    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records/${recordId}`), updateData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser?.uid}/databases/${selectedDb.id}/records/${recordId}`);
    }
  };

  const renderCell = (record: DatabaseRecord, col: DbSchema) => {
    const props = JSON.parse(record.properties);
    const value = props[col.key];

    switch (col.type) {
      case 'checkbox':
        return (
          <input 
            type="checkbox" 
            checked={!!value} 
            onChange={(e) => updateCell(record.id, col.key, e.target.checked)}
            className="rounded-sm border-border bg-surface text-foreground focus:ring-0 focus:ring-offset-0" 
          />
        );
      case 'select':
        return (
          <select 
            value={value || ''} 
            onChange={(e) => updateCell(record.id, col.key, e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:ring-0 outline-none p-0 cursor-pointer text-foreground"
          >
            <option value="">None</option>
            {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'number':
        return (
          <input 
            type="number" 
            value={value ?? ''} 
            onChange={(e) => updateCell(record.id, col.key, Number(e.target.value))}
            className="bg-transparent border-none text-xs w-full focus:ring-0 outline-none p-0 text-foreground"
          />
        );
      case 'date':
        return (
          <input 
            type="date" 
            value={value || ''} 
            onChange={(e) => updateCell(record.id, col.key, e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:ring-0 outline-none p-0 cursor-pointer text-foreground"
          />
        );
      default:
        return (
          <input 
            type="text" 
            value={value || ''} 
            onChange={(e) => updateCell(record.id, col.key, e.target.value)}
            className="bg-transparent border-none text-xs w-full focus:ring-0 outline-none p-0 text-foreground"
          />
        );
    }
  };

  return (
    <div className="flex h-full bg-background relative overflow-hidden font-sans">
      {/* Sidebar - Database List */}
      <div className={cn(
        "w-full md:w-64 border-r border-border bg-background flex flex-col shrink-0 overflow-y-auto z-20",
        selectedDb && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-background shrink-0">
          <h2 className="font-semibold text-[10px] text-muted uppercase tracking-[0.2em]">Databases</h2>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {databases.map(db => (
            <div 
              key={db.id}
              onClick={() => setSelectedDb(db)}
              className={cn(
                "group flex items-center justify-between p-2.5 rounded-sm cursor-pointer text-sm transition-all duration-200",
                selectedDb?.id === db.id ? 'bg-surface text-foreground font-semibold shadow-sm' : 'text-muted hover:bg-surface hover:text-foreground'
              )}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <TableIcon size={14} className={selectedDb?.id === db.id ? "text-foreground" : "text-muted"} />
                <span className="truncate">{db.name}</span>
              </div>
              <button 
                onClick={(e) => deleteDb(db.id, e)} 
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1 rounded-sm"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {databases.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-[10px] text-muted uppercase tracking-widest leading-loose">No systems built yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background h-full h-full relative">
        {/* Prompt Input Header */}
        <div className="p-6 border-b border-border bg-background z-10 shrink-0">
           <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  {isGenerating ? <Loader2 size={18} className="text-foreground animate-spin" /> : <Cpu size={18} className="text-foreground" />}
                </div>
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="Describe a database to build... (e.g., '3 day diet plan', 'startup tracker')"
                  className="w-full bg-surface border border-border focus:border-border-strong text-foreground text-sm rounded-sm pl-12 pr-32 py-4 outline-none transition-all placeholder-muted tracking-tight"
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-foreground text-background px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-foreground-hover disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  {isGenerating ? "Building..." : "Build System"}
                </button>
              </div>
           </div>
        </div>

        {/* Database Table or Placeholder */}
        <div className="flex-1 overflow-auto bg-background p-6 md:p-10">
          {selectedDb ? (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                 <div>
                    <div className="flex items-center space-x-3 mb-1">
                       <TableIcon size={20} className="text-foreground" />
                       <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{selectedDb.name}</h1>
                    </div>
                    <p className="text-xs text-muted font-medium uppercase tracking-widest">Active Workspace System</p>
                 </div>
                 
                 <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        type="text" 
                        placeholder="Search records..."
                        className="bg-surface border border-border rounded-sm pl-9 pr-4 py-2 text-xs text-foreground focus:border-border-strong transition-all outline-none w-48 lg:w-64"
                      />
                    </div>
                    <button className="p-2 border border-border rounded-sm hover:bg-surface text-muted transition-colors">
                      <Filter size={16} />
                    </button>
                 </div>
               </div>

               {/* Professional Table Representation */}
               <div className="border border-border rounded-sm bg-background overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-surface border-b border-border">
                          {JSON.parse(selectedDb.schema).map((col: DbSchema) => (
                            <th key={col.key} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted border-r border-border last:border-r-0 min-w-[150px]">
                              <div className="flex items-center justify-between group">
                                <span>{col.name}</span>
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={record.id} className="border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors group">
                            {JSON.parse(selectedDb.schema).map((col: DbSchema) => (
                              <td key={col.key} className="px-5 py-3.5 text-sm border-r border-border last:border-r-0">
                                {renderCell(record, col)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Add Row Button at bottom of table */}
                  <div className="p-4 bg-background flex justify-start">
                     <button 
                        onClick={async () => {
                          if (!auth.currentUser || !selectedDb) return;
                          const schema: DbSchema[] = JSON.parse(selectedDb.schema);
                          const initialProps: any = {};
                          schema.forEach(s => initialProps[s.key] = s.type === 'checkbox' ? false : s.type === 'number' ? 0 : '');
                          
                          try {
                            await addDoc(collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`), {
                              title: 'New Item',
                              properties: JSON.stringify(initialProps),
                              order: records.length,
                              createdAt: serverTimestamp(),
                              updatedAt: serverTimestamp()
                            });
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors px-3 py-1 bg-surface rounded-sm"
                     >
                       <Plus size={14} />
                       <span>Add Row</span>
                     </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-700">
               <div className="w-20 h-20 bg-surface rounded-sm flex items-center justify-center mb-8 border border-border shadow-sm">
                  <Database size={32} className="text-muted" />
               </div>
               <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">Structured Systems Engine</h2>
               <p className="text-sm text-muted leading-relaxed mb-8">
                 Enter a high-level requirement to synthesize a fully structured database. 
                 AI will architect columns, select types, and generate detailed initial records.
               </p>
               <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => { setPrompt("Startup product launch tracker"); handleGenerate(); }}
                    className="p-3 bg-surface border border-border rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground hover:border-border-strong transition-all"
                  >
                    Startup Tracker
                  </button>
                  <button 
                    onClick={() => { setPrompt("30-day corporate diet protocol"); handleGenerate(); }}
                    className="p-3 bg-surface border border-border rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground hover:border-border-strong transition-all"
                  >
                    Diet Protocol
                  </button>
                  <button 
                    onClick={() => { setPrompt("Professional content strategy calendar"); handleGenerate(); }}
                    className="p-3 bg-surface border border-border rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground hover:border-border-strong transition-all"
                  >
                    Content Calendar
                  </button>
                  <button 
                    onClick={() => { setPrompt("E-commerce inventory management"); handleGenerate(); }}
                    className="p-3 bg-surface border border-border rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground hover:border-border-strong transition-all"
                  >
                    Inventory
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
