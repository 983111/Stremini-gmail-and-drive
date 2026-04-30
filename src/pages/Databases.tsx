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

const TEMPLATES = [
  {
    name: 'Simple Task Tracker',
    description: 'Track your daily tasks and their status.',
    schema: [
      { name: 'Task', type: 'text' },
      { name: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'] },
      { name: 'Due Date', type: 'date' },
      { name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] }
    ]
  },
  {
    name: 'Project Roadmap',
    description: 'Overview of high-level project milestones.',
    schema: [
      { name: 'Milestone', type: 'text' },
      { name: 'Quarter', type: 'select', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
      { name: 'Progress', type: 'number' },
      { name: 'Owner', type: 'text' }
    ]
  },
  {
    name: 'Content Calendar',
    description: 'Plan your blog posts and social media content.',
    schema: [
      { name: 'Content Title', type: 'text' },
      { name: 'Platform', type: 'select', options: ['Blog', 'Twitter', 'LinkedIn', 'YouTube'] },
      { name: 'Publish Date', type: 'date' },
      { name: 'Status', type: 'select', options: ['Draft', 'Review', 'Scheduled', 'Published'] }
    ]
  },
  {
    name: 'Simple CRM',
    description: 'Manage your sales pipeline and contacts.',
    schema: [
      { name: 'Company', type: 'text' },
      { name: 'Contact Name', type: 'text' },
      { name: 'Deal Value', type: 'number' },
      { name: 'Stage', type: 'select', options: ['Lead', 'Qualification', 'Proposal', 'Negotiation', 'Closed'] }
    ]
  },
  {
    name: 'Personal Budget',
    description: 'Track your monthly expenses and income.',
    schema: [
      { name: 'Item', type: 'text' },
      { name: 'Category', type: 'select', options: ['Food', 'Rent', 'Transport', 'Entertainment', 'Work'] },
      { name: 'Amount', type: 'number' },
      { name: 'Paid', type: 'checkbox' }
    ]
  },
  {
    name: 'Reading List',
    description: 'Keep track of the books you want to read.',
    schema: [
      { name: 'Title', type: 'text' },
      { name: 'Author', type: 'text' },
      { name: 'Status', type: 'select', options: ['To Read', 'Reading', 'Finished'] },
      { name: 'Rating', type: 'number' }
    ]
  },
  {
    name: 'Recipe Manager',
    description: 'Store and organize your favorite recipes.',
    schema: [
      { name: 'Recipe Name', type: 'text' },
      { name: 'Category', type: 'select', options: ['Breakfast', 'Lunch', 'Dinner', 'Dessert'] },
      { name: 'Effort', type: 'select', options: ['Easy', 'Medium', 'Hard'] },
      { name: 'Reference URL', type: 'text' }
    ]
  },
  {
    name: 'Inventory Tracker',
    description: 'Manage your office or home inventory.',
    schema: [
      { name: 'Item', type: 'text' },
      { name: 'Location', type: 'text' },
      { name: 'Quantity', type: 'number' },
      { name: 'Last Restocked', type: 'date' }
    ]
  },
  {
    name: 'Job Hunt Tracker',
    description: 'Structure your job hunt process and interviews.',
    schema: [
      { name: 'Company', type: 'text' },
      { name: 'Role', type: 'text' },
      { name: 'Stage', type: 'select', options: ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'] },
      { name: 'Applied Date', type: 'date' }
    ]
  },
  {
    name: 'Event Planner',
    description: 'Coordinate your upcoming events and guest lists.',
    schema: [
      { name: 'Task', type: 'text' },
      { name: 'Due Date', type: 'date' },
      { name: 'Budget', type: 'number' },
      { name: 'Completed', type: 'checkbox' }
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
  const [editingCell, setEditingCell] = useState<{recordId: string, field: string} | null>(null);

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

  useEffect(() => {
    if (!auth.currentUser || !selectedDb) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    const q = query(collection(db, `users/${auth.currentUser.uid}/databases/${selectedDb.id}/records`));
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
        await createDatabase(generationPrompt.slice(0, 50), schema);
        setGenerationPrompt('');
      } else {
        alert("Sorry, I couldn't generate a schema for that prompt.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate database schema.");
    } finally {
      setIsGenerating(false);
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

  const addRecord = async () => {
    if (!auth.currentUser || !selectedDb) return;
    const schema = JSON.parse(selectedDb.schema);
    const initialData: any = {};
    schema.forEach((field: any) => {
      if (field.type === 'checkbox') initialData[field.name] = false;
      else if (field.type === 'number') initialData[field.name] = 0;
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

  const handleExport = () => {
    if (records.length === 0) return;
    const exportData = records.map(({ id, createdAt, ...rest }) => rest);
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDb.name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser || !selectedDb) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        for (const row of data as any[]) {
          try {
            await addDoc(collection(db, `users/${auth.currentUser!.uid}/databases/${selectedDb.id}/records`), {
              ...row,
              createdAt: serverTimestamp()
            });
          } catch (err) {
            console.error("Error importing row:", err);
          }
        }
      }
    });
    e.target.value = '';
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
            onClick={() => setShowTemplates(true)}
            className="p-1 hover:bg-surface-hover rounded-sm text-muted hover:text-foreground transition-colors"
          >
            <Plus size={16} />
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
          <>
            {/* Header */}
            <div className="px-8 py-6 bg-background shrink-0">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{selectedDb.name}</h1>
                </div>
                <div className="flex items-center space-x-2 bg-surface p-1 rounded-sm border border-border">
                  <button className="px-3 py-1.5 text-xs font-medium bg-background border border-border-strong shadow-sm rounded-sm text-foreground flex items-center space-x-2">
                    <Table2 size={14} />
                    <span>Table</span>
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-sm flex items-center space-x-2 transition-colors">
                    <Layout size={14} />
                    <span>Board</span>
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-sm flex items-center space-x-2 transition-colors">
                    <CalendarIcon size={14} />
                    <span>Calendar</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="text" 
                      placeholder="Filter records..." 
                      className="bg-surface border border-border rounded-sm py-1.5 pl-8 pr-3 text-xs outline-none focus:border-border-strong transition-colors min-w-[200px]"
                    />
                  </div>
                  <button className="text-xs font-medium text-muted hover:text-foreground flex items-center space-x-1 transition-colors">
                    <Filter size={14} />
                    <span>Filter</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleExport}
                    className="text-xs font-medium text-muted hover:text-foreground flex items-center space-x-1 transition-colors px-2 py-1 rounded-sm hover:bg-surface-hover"
                    title="Export to CSV"
                  >
                    <DownloadIcon size={14} />
                    <span>Export</span>
                  </button>
                  <label className="text-xs font-medium text-muted hover:text-foreground flex items-center space-x-1 transition-colors px-2 py-1 rounded-sm hover:bg-surface-hover cursor-pointer" title="Import from CSV">
                    <UploadIcon size={14} />
                    <span>Import</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                  </label>
                  <button 
                    onClick={addRecord}
                    className="bg-foreground text-background px-4 py-1.5 rounded-sm text-xs font-medium hover:bg-foreground-hover transition-colors flex items-center space-x-2"
                  >
                    <Plus size={14} />
                    <span>New Record</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto px-8 pb-8">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden border border-border rounded-sm shadow-sm bg-surface">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-[#FAFAFA] dark:bg-[#111]">
                      <tr>
                        {JSON.parse(selectedDb.schema).map((field: any, idx: number) => (
                          <th key={idx} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted border-r border-border first:pl-6">
                            <div className="flex items-center space-x-2">
                              {getFieldIcon(field.type)}
                              <span>{field.name}</span>
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {records.length > 0 ? (
                        records.map((record) => (
                          <tr key={record.id} className="hover:bg-surface transition-colors group">
                            {JSON.parse(selectedDb.schema).map((field: any, idx: number) => {
                              const value = record[field.name];
                              const isEditing = editingCell?.recordId === record.id && editingCell?.field === field.name;

                              return (
                                <td 
                                  key={idx} 
                                  className="px-4 py-3 text-sm text-foreground overflow-hidden whitespace-nowrap border-r border-border first:pl-6 relative"
                                  onClick={() => setEditingCell({ recordId: record.id, field: field.name })}
                                >
                                  {field.type === 'checkbox' ? (
                                    <div className="flex justify-center">
                                      <input 
                                        type="checkbox" 
                                        checked={!!value} 
                                        onChange={(e) => updateRecord(record.id, field.name, e.target.checked)}
                                        className="h-4 w-4 rounded-sm border-border text-foreground focus:ring-foreground"
                                      />
                                    </div>
                                  ) : isEditing ? (
                                    field.type === 'select' ? (
                                      <select 
                                        autoFocus
                                        value={value || ''}
                                        onChange={(e) => {
                                          updateRecord(record.id, field.name, e.target.value);
                                          setEditingCell(null);
                                        }}
                                        onBlur={() => setEditingCell(null)}
                                        className="w-full bg-background text-sm p-1 outline-none border border-border-strong rounded-sm"
                                      >
                                        <option value="">Select...</option>
                                        {field.options?.map((opt: string) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input 
                                        autoFocus
                                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                        value={value || ''}
                                        onChange={(e) => updateRecord(record.id, field.name, e.target.value)}
                                        onBlur={() => setEditingCell(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                                        className="w-full bg-background text-sm p-1 outline-none border border-border-strong rounded-sm"
                                      />
                                    )
                                  ) : (
                                    <div className="min-h-[20px] flex items-center">
                                      {field.type === 'date' ? (value ? new Date(value).toLocaleDateString() : '') : 
                                       field.type === 'select' ? (
                                         value ? <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-hover border border-border font-medium">{value}</span> : null
                                       ) : value}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right sticky right-0 bg-background group-hover:bg-surface">
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                                className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={JSON.parse(selectedDb.schema).length + 1} className="px-6 py-12 text-center text-muted italic font-serif">
                            No records yet. Add a row to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <button 
                    onClick={addRecord}
                    className="w-full px-6 py-3 text-left text-sm text-muted hover:bg-surface hover:text-foreground transition-all flex items-center space-x-2"
                  >
                    <Plus size={14} />
                    <span>Add New Row</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            {showTemplates ? (
              <div className="max-w-4xl w-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Choose a Template</h2>
                  <button onClick={() => setShowTemplates(false)} className="text-muted hover:text-foreground">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                  {TEMPLATES.map((t, i) => (
                    <div 
                      key={i}
                      onClick={() => createDatabase(t.name, t.schema)}
                      className="p-6 bg-surface border border-border rounded-sm hover:border-border-strong hover:shadow-md cursor-pointer transition-all text-left"
                    >
                      <div className="bg-background w-10 h-10 rounded-sm flex items-center justify-center border border-border mb-4">
                        <Table2 size={20} className="text-foreground" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted leading-relaxed">{t.description}</p>
                    </div>
                  ))}
                  <div 
                    onClick={() => createDatabase()}
                    className="p-6 border border-dashed border-border rounded-sm hover:border-border-strong hover:bg-surface cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <Plus size={24} className="text-muted group-hover:text-foreground mb-4" />
                    <span className="text-sm font-medium text-muted group-hover:text-foreground">Empty Database</span>
                  </div>
                </div>

                <div className="p-8 bg-surface rounded-sm border border-border relative overflow-hidden">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-foreground text-background p-2 rounded-sm">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">AI Database Architect</h3>
                  </div>
                  <p className="text-sm text-muted mb-8 text-left">
                    Describe what you want to track, and let the AI design the columns and structure for you. 
                    Try "Inventory tracking for a coffee shop" or "Candidate recruitment pipeline."
                  </p>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={generationPrompt}
                      onChange={e => setGenerationPrompt(e.target.value)}
                      placeholder="What would you like to track?"
                      className="flex-1 bg-background border border-border-strong rounded-sm px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                      onKeyDown={e => e.key === 'Enter' && handleAiGeneration()}
                    />
                    <button 
                      onClick={handleAiGeneration}
                      disabled={isGenerating || !generationPrompt}
                      className="bg-foreground text-background px-8 py-3 rounded-sm font-bold text-sm hover:bg-foreground-hover transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      <span>{isGenerating ? 'Architecting...' : 'Build It'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md">
                <div className="bg-surface w-20 h-20 rounded-sm flex items-center justify-center border border-border mb-8 mx-auto shadow-sm">
                  <DatabaseIcon size={40} className="text-muted" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Your Intelligence Workspace</h2>
                <p className="text-muted mb-10 text-lg font-serif italic">
                  Build custom tools to organize tasks, properties, research, and data precisely how you think.
                </p>
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={() => setShowTemplates(true)}
                    className="bg-foreground text-background px-8 py-3 rounded-sm font-bold text-sm hover:bg-foreground-hover transition-all"
                  >
                    Create a New Database
                  </button>
                  <button 
                    onClick={() => setShowTemplates(true)}
                    className="text-muted hover:text-foreground text-sm font-medium transition-colors"
                  >
                    Browse Templates
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
