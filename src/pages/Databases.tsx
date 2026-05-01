import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import Papa from 'papaparse';
import { 
  Database as DatabaseIcon, 
  Plus, 
  Trash2, 
  Table2, 
  Layout, 
  Calendar, 
  Kanban, 
  Sparkles, 
  Filter, 
  Search, 
  MoreHorizontal, 
  ChevronDown, 
  X,
  Loader2,
  Check,
  Type,
  Hash,
  List,
  Calendar as CalendarIcon,
  CheckSquare,
  Download as DownloadIcon,
  Upload as UploadIcon
} from 'lucide-react';
import { generateDatabaseSchema } from '../lib/gemini';
import { DatabaseView } from '../components/DatabaseView';

export function Databases() {
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState<any | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/databases`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      }));
      setDatabases(dbData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/databases`);
    });
    return () => unsubscribe();
  }, []);

  const createDatabase = async (name = 'Untitled Database', schema = [{ key: 'name', name: 'Name', type: 'text', options: [] }]) => {
    if (!auth.currentUser) return;
    try {
      const newDb = {
        name,
        schema: JSON.stringify(schema),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser.uid
      };
      const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/databases`), newDb);
      setSelectedDb({ id: docRef.id, ...newDb });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/databases`);
    }
  };

  const deleteDatabase = async (id: string) => {
    if (!auth.currentUser || !window.confirm("Are you sure you want to delete this database?")) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/databases/${id}`));
      if (selectedDb?.id === id) setSelectedDb(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/databases/${id}`);
    }
  };

  return (
    <div className="flex h-full bg-background font-sans antialiased">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DatabaseIcon size={16} className="text-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted">Databases</span>
          </div>
          <button 
            onClick={() => createDatabase()}
            className="flex items-center space-x-1 px-2 py-1 hover:bg-surface-hover rounded-sm text-muted hover:text-foreground transition-colors border border-border"
          >
            <Plus size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">New</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-1">
          {databases.map(db => (
            <div 
              key={db.id}
              onClick={() => setSelectedDb(db)}
              className={`group flex items-center justify-between p-2 rounded-sm cursor-pointer text-sm transition-all border ${selectedDb?.id === db.id ? 'bg-background border-border-strong text-foreground font-medium shadow-sm' : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground'}`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Table2 size={14} className={selectedDb?.id === db.id ? 'text-foreground' : 'text-muted'} />
                <span className="truncate">{db.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteDatabase(db.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 rounded-sm hover:bg-surface transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {selectedDb ? (
          <DatabaseView pageId={selectedDb.id} />
        ) : (
          <div className="flex items-center justify-center flex-1 h-full flex-col text-center bg-background">
             <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-[#CCC]">
                <DatabaseIcon size={24} />
             </div>
             <p className="text-lg text-foreground font-semibold mb-2">No Database Selected</p>
             <p className="text-muted text-sm max-w-sm">Select an existing database from the sidebar or click + to create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
