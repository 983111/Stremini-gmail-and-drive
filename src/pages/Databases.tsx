import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import Papa from 'papaparse';
import { 
  Database as DatabaseIcon, 
  Plus, 
  Trash2, 
  Table2, 
  Layout, 
  Calendar as CalendarIcon, 
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
  CheckSquare,
  Download as DownloadIcon,
  Upload as UploadIcon,
  MoreVertical,
  Settings2,
  ColumnsIcon,
  Target,
  ArrowRight
} from 'lucide-react';
import { generateDatabaseSchema, generateDatabaseRecords } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

const TEMPLATES = [
  {
    name: 'Generate custom with AI',
    description: 'Describe your idea and let AI build the table, columns, and data for you.',
    isAi: true,
    schema: []
  },
  {
    name: 'Weekly Planner',
    description: 'Structure your week with tasks, priorities, and deadlines.',
    schema: [
      { name: 'Task', type: 'text' },
      { name: 'Day', type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      { name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
      { name: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Done'] },
      { name: 'Due Date', type: 'date' }
    ]
  },
  {
    name: 'Project Tasker',
    description: 'Manage complex projects with assignees and progress tracking.',
    schema: [
      { name: 'Action Item', type: 'text' },
      { name: 'Module', type: 'text' },
      { name: 'Assignee', type: 'text' },
      { name: 'Status', type: 'select', options: ['Backlog', 'Todo', 'In Progress', 'Under Review', 'Archive'] },
      { name: 'Estimation (h)', type: 'number' }
    ]
  },
  {
    name: 'Personal Habit Tracker',
    description: 'Track your daily wins and build consistency.',
    schema: [
      { name: 'Habit', type: 'text' },
      { name: 'Morning', type: 'checkbox' },
      { name: 'Afternoon', type: 'checkbox' },
      { name: 'Evening', type: 'checkbox' },
      { name: 'Notes', type: 'text' }
    ]
  },
  {
    name: 'Expense Tracker',
    description: 'Keep your finances in check with categorized spending.',
    schema: [
      { name: 'Description', type: 'text' },
      { name: 'Amount', type: 'number' },
      { name: 'Category', type: 'select', options: ['Rent', 'Food', 'Transport', 'SaaS', 'Misc'] },
      { name: 'Date', type: 'date' },
      { name: 'Reimbursed?', type: 'checkbox' }
    ]
  }
];

export function Databases() {
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [editingCell, setEditingCell] = useState<{recordId: string, field: string} | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: '', type: 'text', options: '' });

  const handleTemplateClick = (tpl: any) => {
    if (tpl.isAi) {
      setIsAiMode(true);
      setShowTemplates(false);
    } else {
      createDatabase(tpl.name, tpl.schema);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/databases`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      }));
      setDatabases(dbData);
      
      // Select the first one if none selected and there are databases
      if (!selectedDb && dbData.length > 0) {
        setSelectedDb(dbData[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/databases`);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !selectedDb) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      }));
      setRecords(recordData);
      setLoadingRecords(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `records of ${selectedDb.id}`);
      setLoadingRecords(false);
    });
    return () => unsubscribe();
  }, [selectedDb?.id]);

  const createDatabase = async (name = 'Untitled Database', schema = [{ name: 'Name', type: 'text' }]) => {
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
      setShowTemplates(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/databases`);
    }
  };

  const handleAiGeneration = async () => {
    if (!generationPrompt) return;
    setIsGenerating(true);
    try {
      const schema = await generateDatabaseSchema(generationPrompt);
      if (schema && schema.length > 0) {
        const name = generationPrompt.length > 30 ? generationPrompt.substring(0, 30) + '...' : generationPrompt;
        const newDbData = {
          name,
          schema: JSON.stringify(schema),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: auth.currentUser!.uid
        };
        const docRef = await addDoc(collection(db, `users/${auth.currentUser!.uid}/databases`), newDbData);
        const dbId = docRef.id;
        
        const recordsData = await generateDatabaseRecords(generationPrompt, JSON.stringify(schema));
        if (recordsData && recordsData.length > 0) {
          for (const record of recordsData) {
            await addDoc(collection(db, `users/${auth.currentUser!.uid}/databases/${dbId}/records`), {
              ...record,
              createdAt: serverTimestamp()
            });
          }
        }
        
        setSelectedDb({ id: dbId, ...newDbData });
        setGenerationPrompt('');
        setShowTemplates(false);
        setIsAiMode(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDatabase = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!auth.currentUser || !window.confirm("Delete this entire database?")) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/databases/${id}`));
      if (selectedDb?.id === id) setSelectedDb(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/databases/${id}`);
    }
  };

  const addRecord = async () => {
    if (!auth.currentUser || !selectedDb) return;
    const schema = JSON.parse(selectedDb.schema);
    const initialData: any = {};
    schema.forEach((field: any) => {
      if (field.type === 'checkbox') initialData[field.name] = false;
      else if (field.type === 'number') initialData[field.name] = 0;
      else if (field.type === 'select') initialData[field.name] = field.options?.[0] || '';
      else initialData[field.name] = '';
    });

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`), {
        ...initialData,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `record in ${selectedDb.id}`);
    }
  };

  const updateRecord = async (recordId: string, field: string, value: any) => {
    if (!auth.currentUser || !selectedDb) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records/${recordId}`), {
        [field]: value
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `record ${recordId} in ${selectedDb.id}`);
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!auth.currentUser || !selectedDb) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records/${recordId}`));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `record ${recordId} in ${selectedDb.id}`);
    }
  };

  const handleAddColumn = async () => {
    if (!auth.currentUser || !selectedDb || !newColumn.name) return;
    try {
      const currentSchema = JSON.parse(selectedDb.schema);
      const newSchema = [...currentSchema, { 
        name: newColumn.name, 
        type: newColumn.type, 
        options: newColumn.type === 'select' ? newColumn.options.split(',').map(o => o.trim()) : undefined 
      }];
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}`), {
        schema: JSON.stringify(newSchema),
        updatedAt: serverTimestamp()
      });
      setSelectedDb({ ...selectedDb, schema: JSON.stringify(newSchema) });
      setIsAddingColumn(false);
      setNewColumn({ name: '', type: 'text', options: '' });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `schema update for ${selectedDb.id}`);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={12} />;
      case 'number': return <Hash size={12} />;
      case 'select': return <List size={12} />;
      case 'date': return <CalendarIcon size={12} />;
      case 'checkbox': return <CheckSquare size={12} />;
      default: return <Type size={12} />;
    }
  };

  const renderCell = (record: any, field: any) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === field.name;
    const value = record[field.name];

    if (field.type === 'checkbox') {
      return (
        <div className="flex items-center justify-center h-full">
          <input 
            type="checkbox" 
            checked={!!value}
            onChange={(e) => updateRecord(record.id, field.name, e.target.checked)}
            className="w-4 h-4 rounded border-border text-foreground focus:ring-0 focus:ring-offset-0"
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <select 
          value={value || ''}
          onChange={(e) => updateRecord(record.id, field.name, e.target.value)}
          className="w-full h-full bg-transparent border-none outline-none text-xs px-2 appearance-none cursor-pointer hover:bg-surface-hover rounded-sm"
        >
          <option value="" disabled>Select...</option>
          {field.options?.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (isEditing) {
      return (
        <input 
          autoFocus
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={value ?? ''}
          onChange={(e) => updateRecord(record.id, field.name, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null); }}
          className="w-full h-full bg-surface border border-foreground/20 rounded-sm outline-none px-2 text-xs font-medium"
        />
      );
    }

    return (
      <div 
        onClick={() => setEditingCell({ recordId: record.id, field: field.name })}
        className="w-full h-full min-h-[32px] flex items-center px-3 text-xs text-foreground cursor-text hover:bg-surface-hover/50 transition-colors"
      >
        {field.type === 'date' && value ? new Date(value).toLocaleDateString() : value}
        {!value && value !== 0 && <span className="text-muted/30">...</span>}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-background font-sans overflow-hidden">
      {/* Sidebar - Notion style - Hidden on mobile */}
      <div className="hidden lg:flex w-64 border-r border-border bg-[#FBFBFA] dark:bg-[#0B0B0B] flex-col shrink-0">
        <div className="p-4 flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <DatabaseIcon size={14} className="text-muted" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Databases</span>
          </div>
          <button 
            onClick={() => setShowTemplates(true)}
            className="p-1 hover:bg-surface-hover rounded-sm text-muted transition-colors"
            title="Templates"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-2 space-y-0.5">
          {databases.length > 0 ? (
            databases.map(db => (
              <div 
                key={db.id}
                onClick={() => { setSelectedDb(db); setIsAiMode(false); }}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-sm cursor-pointer text-[13px] transition-all ${selectedDb?.id === db.id && !isAiMode ? 'bg-surface text-foreground font-semibold' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Table2 size={14} className={selectedDb?.id === db.id && !isAiMode ? 'text-amber-500' : 'text-muted'} />
                  <span className="truncate">{db.name}</span>
                </div>
                <button 
                  onClick={(e) => deleteDatabase(db.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : null}
          
          <div 
            onClick={() => { setIsAiMode(true); setSelectedDb(null); }}
            className={`group flex items-center space-x-2 px-3 py-1.5 rounded-sm cursor-pointer text-[13px] transition-all ${isAiMode ? 'bg-surface text-foreground font-semibold' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`}
          >
            <Sparkles size={14} className={isAiMode ? 'text-amber-500' : 'text-muted'} />
            <span>Generate with AI</span>
          </div>
        </div>

        <div className="p-4">
          <button 
             onClick={() => createDatabase()}
             className="w-full flex items-center justify-center space-x-2 p-2 rounded-sm text-[11px] font-bold uppercase tracking-widest text-muted hover:bg-surface-hover hover:text-foreground transition-all"
          >
            <Plus size={12} />
            <span>Empty Table</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-background">
        {selectedDb && !isAiMode ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Context Header */}
            <div className="px-4 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-surface rounded-md border border-border">
                  <Table2 size={24} className="text-amber-500" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground truncate">{selectedDb.name}</h1>
              </div>

              <div className="flex items-center space-x-4 sm:space-x-6 border-b border-border pb-2 mb-6 overflow-x-auto scrollbar-hide">
                 <button className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-foreground pb-2 border-b-2 border-foreground whitespace-nowrap">
                   <Table2 size={14} />
                   <span>Table View</span>
                 </button>
                 <button className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted pb-2 border-b-2 border-transparent hover:text-foreground transition-all opacity-50 whitespace-nowrap">
                   <Kanban size={14} />
                   <span>Kanban</span>
                 </button>
                 <button className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted pb-2 border-b-2 border-transparent hover:text-foreground transition-all opacity-50 whitespace-nowrap">
                   <CalendarIcon size={14} />
                   <span>Timeline</span>
                 </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="relative flex-1 sm:flex-none">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="text" 
                      placeholder="Find..." 
                      className="w-full bg-surface border border-border rounded-sm py-1.5 pl-9 pr-4 text-xs outline-none focus:border-foreground/20 transition-all sm:min-w-[200px]"
                    />
                  </div>
                  <button className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground flex items-center space-x-2 px-3 py-1.5 rounded-sm hover:bg-surface-hover transition-all">
                    <Filter size={14} />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                   <div className="flex items-center bg-surface border border-border rounded-sm shrink-0">
                      <button 
                        onClick={() => setIsAddingColumn(true)}
                        className="p-1 px-2.5 sm:px-3 border-r border-border hover:bg-surface-hover text-muted"
                        title="Add Column"
                      >
                         <ColumnsIcon size={14} />
                      </button>
                      <label className="p-1 px-2.5 sm:px-3 border-r border-border hover:bg-surface-hover text-muted cursor-pointer">
                        <UploadIcon size={14} />
                        <input type="file" accept=".csv" className="hidden" />
                      </label>
                      <button className="p-1 px-2.5 sm:px-3 hover:bg-surface-hover text-muted">
                         <Settings2 size={14} />
                      </button>
                   </div>
                   <button 
                    onClick={addRecord}
                    className="flex-1 sm:flex-none bg-foreground text-background px-4 py-2 rounded-sm text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2"
                  >
                    <Plus size={14} />
                    <span>New Entry</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-4 sm:px-8 lg:px-12 pb-12">
               <div className="border border-border border-b-0 rounded-sm overflow-x-auto bg-background shadow-sm">
                 <table className="w-full border-collapse min-w-[600px]">
                   <thead>
                     <tr className="bg-surface/50 border-b border-border">
                       {JSON.parse(selectedDb.schema).map((field: any, idx: number) => (
                         <th key={idx} className="h-10 px-4 border-r border-border last:border-r-0 text-left">
                           <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                             {getFieldIcon(field.type)}
                             <span>{field.name}</span>
                           </div>
                         </th>
                       ))}
                       <th className="w-12 h-10 border-l border-border bg-surface/50"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {loadingRecords ? (
                       <tr>
                         <td colSpan={100} className="py-20 text-center">
                           <div className="flex flex-col items-center space-y-4">
                             <Loader2 size={24} className="animate-spin text-muted/40" />
                             <span className="text-[10px] font-bold text-muted uppercase tracking-widest animate-pulse">Accessing records...</span>
                           </div>
                         </td>
                       </tr>
                     ) : records.length > 0 ? (
                        records.map(record => (
                          <tr key={record.id} className="group border-b border-border hover:bg-surface/30 transition-colors">
                            {JSON.parse(selectedDb.schema).map((field: any, idx: number) => (
                              <td key={idx} className="h-10 border-r border-border last:border-r-0 p-0 align-middle">
                                {renderCell(record, field)}
                              </td>
                            ))}
                            <td className="w-12 h-10 border-l border-border align-middle text-center">
                               <button 
                                onClick={() => deleteRecord(record.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-red-500 rounded-sm hover:bg-surface transition-all"
                               >
                                 <Trash2 size={12} />
                               </button>
                            </td>
                          </tr>
                        ))
                     ) : (
                       <tr>
                         <td colSpan={100} className="py-20 text-center">
                           <div className="max-w-xs mx-auto space-y-4">
                             <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto border border-border">
                               <Plus size={20} className="text-muted/50" />
                             </div>
                             <div>
                               <h3 className="text-sm font-bold text-foreground">Empty Database</h3>
                               <p className="text-xs text-muted leading-relaxed">Start by adding your first entry manually or use the AI to generate sample data.</p>
                             </div>
                             <button 
                              onClick={addRecord}
                              className="px-4 py-2 bg-foreground text-background rounded-sm text-[10px] font-bold uppercase tracking-widest"
                             >
                               Add Entry
                             </button>
                           </div>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
                 {records.length > 0 && (
                   <div 
                    onClick={addRecord}
                    className="h-10 border-b border-border flex items-center px-4 space-x-2 text-muted hover:bg-surface/50 cursor-pointer transition-all border-t-0"
                   >
                     <Plus size={14} className="text-muted/40" />
                     <span className="text-[11px] font-medium">New</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-background p-4 sm:p-12 overflow-y-auto">
            <div className="w-full max-w-2xl px-4">
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 sm:space-y-12 py-8"
               >
                  <div className="space-y-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto border border-border">
                      <Sparkles size={24} className="text-amber-500" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">AI Database Generator</h1>
                    <p className="text-sm text-muted font-medium max-w-md mx-auto leading-relaxed">
                      Describe your dream workspace, and I'll architect the tables, properties, and sample data in seconds.
                    </p>
                  </div>

                  <div className="bg-surface rounded-xl border border-border p-4 sm:p-8 text-center relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <div className="flex flex-col space-y-4">
                        <textarea 
                          value={generationPrompt}
                          onChange={(e) => setGenerationPrompt(e.target.value)}
                          placeholder="e.g. A content calendar for high-growth startups..."
                          className="w-full bg-background border border-border rounded-md py-4 px-4 text-sm outline-none focus:border-foreground/10 transition-all min-h-[100px] sm:min-h-[120px] resize-none"
                        />
                        <button 
                          onClick={handleAiGeneration}
                          disabled={!generationPrompt || isGenerating}
                          className="w-full bg-foreground text-background py-3 rounded-md text-sm font-bold uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                          <span>{isGenerating ? 'Building...' : 'Build Workspace'}</span>
                        </button>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Try these</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {['Product Roadmap', 'CRM', 'Study Planner'].map(p => (
                            <button 
                              key={p} 
                              onClick={() => setGenerationPrompt(p)}
                              className="text-[10px] sm:text-[11px] font-medium text-muted border border-border px-3 py-1.5 rounded-full hover:border-foreground transition-all"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!databases.length && (
                    <div className="pt-8 sm:pt-12 text-center pb-8">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">Or start with a preset</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                        {TEMPLATES.filter(t => !t.isAi).map(tpl => (
                          <div 
                            key={tpl.name}
                            onClick={() => createDatabase(tpl.name, tpl.schema)}
                            className="p-4 sm:p-5 bg-surface border border-border rounded-lg text-left hover:border-foreground transition-all group"
                          >
                            <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
                                {tpl.name}
                                <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                            </h3>
                            <p className="text-[11px] text-muted mt-1 leading-normal">{tpl.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </motion.div>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        <AnimatePresence>
          {showTemplates && (
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#00000020] backdrop-blur-[2px] z-50 flex items-center justify-center p-8"
             >
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  className="bg-background border border-border shadow-huge w-full max-w-4xl overflow-hidden rounded-xl flex flex-col max-h-[85vh]"
                >
                  <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Templates</h2>
                    <button 
                      onClick={() => setShowTemplates(false)}
                      className="text-muted hover:text-foreground transition-all p-1 hover:bg-surface rounded-md"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-4 sm:p-6 bg-surface/30">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {TEMPLATES.map((tpl, i) => (
                           <div 
                            key={i} 
                            onClick={() => handleTemplateClick(tpl)}
                            className={`group border border-border p-6 rounded-xl hover:bg-background transition-all cursor-pointer relative overflow-hidden ${tpl.isAi ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background'}`}
                           >
                             {tpl.isAi && (
                               <div className="absolute top-0 right-0 p-3 text-amber-500/20">
                                 <Sparkles size={48} />
                               </div>
                             )}
                             <h3 className="text-base font-bold text-foreground mb-1 flex items-center space-x-2">
                               {tpl.isAi && <Sparkles size={14} className="text-amber-500" />}
                               <span>{tpl.name}</span>
                             </h3>
                             <p className="text-xs text-muted leading-relaxed mb-4">{tpl.description}</p>
                             <div className="flex flex-wrap gap-2 text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                                {tpl.schema.map(f => (<span key={f.name}>• {f.name}</span>))}
                             </div>
                           </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Add Column Modal */}
        <AnimatePresence>
          {isAddingColumn && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-[#00000040] backdrop-blur-sm z-50 flex items-center justify-center p-8"
             >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-background border border-border shadow-2xl w-full max-w-md overflow-hidden rounded-md flex flex-col"
                >
                  <div className="p-6 border-b border-border flex justify-between items-center bg-[#FBFBFA] dark:bg-[#0B0B0B]">
                    <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">Add Variable</h2>
                    <button onClick={() => setIsAddingColumn(false)} className="text-muted">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Variable Name</label>
                        <input 
                          type="text" 
                          value={newColumn.name}
                          onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                          className="w-full bg-surface border border-border p-3 rounded-sm text-sm outline-none focus:border-foreground/20"
                          placeholder="e.g. Priority, Category, etc."
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Data Type</label>
                        <select 
                          value={newColumn.type}
                          onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value })}
                          className="w-full bg-surface border border-border p-3 rounded-sm text-sm outline-none"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select (Multi-option)</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                     </div>
                     {newColumn.type === 'select' && (
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Options (Comma separated)</label>
                          <input 
                            type="text" 
                            value={newColumn.options}
                            onChange={(e) => setNewColumn({ ...newColumn, options: e.target.value })}
                            className="w-full bg-surface border border-border p-3 rounded-sm text-sm outline-none focus:border-foreground/20"
                            placeholder="To Do, In Progress, Done"
                          />
                       </div>
                     )}
                     <button 
                      onClick={handleAddColumn}
                      disabled={!newColumn.name}
                      className="w-full bg-foreground text-background py-3 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-50"
                     >
                       Confirm Addition
                     </button>
                  </div>
                </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
