import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/errorHandlers";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Settings2, GripVertical, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DatabaseView({ pageId }: { pageId: string }) {
  const { user } = useAuth();
  const [page, setPage] = useState<any>(null);
  const [schema, setSchema] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  
  const [isColDialogOpen, setIsColDialogOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [newColOptions, setNewColOptions] = useState('');

  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId || !user) return;
    
    // We fetch the database "page" from the existing hierarchy
    const unsubPage = onSnapshot(doc(db, `users/${user.uid}/databases/${pageId}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPage({ id: docSnap.id, ...data });
        try {
          const parsed = JSON.parse(data.schema || '[]');
          setSchema(Array.isArray(parsed) ? parsed : []);
        } catch(e) {
          setSchema([]);
        }
      }
    });

    const q = query(collection(db, `users/${user.uid}/databases/${pageId}/records`));
    const unsubRecords = onSnapshot(q, (snapshot) => {
       setRecords((prevRecords) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
          const sorted = data.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return aTime - bTime;
          });
          
          if (!editingCellId) return sorted;
          
          return sorted.map(newRec => {
            if (editingCellId.startsWith(newRec.id)) {
              const oldRec = prevRecords.find(r => r.id === newRec.id);
              return oldRec ? oldRec : newRec;
            }
            return newRec;
          });
       });
    }, (err) => handleFirestoreError(err, OperationType.LIST, `records`));

    return () => {
      unsubPage();
      unsubRecords();
    };
  }, [pageId, user, editingCellId]);

  const updateTitle = async (newTitle: string) => {
    if (!pageId || !user) return;
    setPage({...page, name: newTitle});
    await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}`), { name: newTitle, updatedAt: serverTimestamp() });
  };

  const addRecord = async () => {
    if (!user || !pageId) return;
    try {
      const initProps: any = {};
      schema.forEach(col => {
         initProps[col.key] = col.type === 'select' || col.type === 'status' ? (col.options?.[0] || '') : '';
      });
      await addDoc(collection(db, `users/${user.uid}/databases/${pageId}/records`), {
        title: '',
        properties: JSON.stringify(initProps),
        order: records.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch(e) {
      console.error(e);
    }
  };

  const updateRecordTitle = async (recordId: string, title: string) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}/records/${recordId}`), { title, updatedAt: serverTimestamp() });
  };

  const updateRecordProp = async (recordId: string, currentPropsRaw: string, key: string, value: string) => {
    if (!user) return;
    try {
      const props = JSON.parse(currentPropsRaw || '{}');
      props[key] = value;
      await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}/records/${recordId}`), { properties: JSON.stringify(props), updatedAt: serverTimestamp() });
    } catch(e) {
      console.error(e);
    }
  };

  const addColumn = async () => {
    if (!pageId || !newColName || !user) return;
    const newSchema = [...schema, {
      key: newColName.toLowerCase().replace(/\s+/g, ''),
      name: newColName,
      type: newColType,
      options: newColType === 'select' || newColType === 'status' ? newColOptions.split(',').map(o => o.trim()).filter(Boolean) : []
    }];
    try {
      await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}`), { schema: JSON.stringify(newSchema), updatedAt: serverTimestamp() });
      setIsColDialogOpen(false);
      setNewColName('');
      setNewColOptions('');
    } catch (e: any) {
      console.error(e);
      alert('Failed: ' + e.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedRowId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverRowId(id);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverRowId(null);
    if (!draggedRowId || draggedRowId === targetId || !user) return;

    const newRecords = [...records];
    const draggedIndex = newRecords.findIndex(r => r.id === draggedRowId);
    const dropIndex = newRecords.findIndex(r => r.id === targetId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const [draggedRecord] = newRecords.splice(draggedIndex, 1);
    newRecords.splice(dropIndex, 0, draggedRecord);
    
    // Update local state immediately for fast feedback
    newRecords.forEach((r, i) => r.order = i);
    setRecords(newRecords);
    setDraggedRowId(null);

    // Persist order
    try {
      await Promise.all(newRecords.map((r, i) => updateDoc(doc(db, `users/${user.uid}/databases/${pageId}/records/${r.id}`), { order: i })));
    } catch (e) {
      console.error('Failed to update order', e);
    }
  };

  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const handleColDragStart = (e: React.DragEvent, key: string) => {
    setDraggedColId(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDragOverColId(key);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColDrop = async (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedColId || draggedColId === targetKey || !pageId || !user) return;
    
    const newSchema = [...schema];
    const draggedIdx = newSchema.findIndex(c => c.key === draggedColId);
    const dropIdx = newSchema.findIndex(c => c.key === targetKey);

    if (draggedIdx === -1 || dropIdx === -1) return;

    const [draggedCol] = newSchema.splice(draggedIdx, 1);
    newSchema.splice(dropIdx, 0, draggedCol);

    setSchema(newSchema);
    setDraggedColId(null);
    await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}`), { schema: JSON.stringify(newSchema), updatedAt: serverTimestamp() });
  };

  const renameColumn = async (oldKey: string, newName: string) => {
    if (!pageId || !newName.trim() || !user) return;
    const newSchema = schema.map(c => c.key === oldKey ? { ...c, name: newName } : c);
    setSchema(newSchema);
    await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}`), { schema: JSON.stringify(newSchema), updatedAt: serverTimestamp() });
  };

  const deleteColumn = async (key: string) => {
    if (!pageId || !user) return;
    if (confirm("Are you sure you want to delete this column?")) {
      const newSchema = schema.filter(c => c.key !== key);
      setSchema(newSchema);
      await updateDoc(doc(db, `users/${user.uid}/databases/${pageId}`), { schema: JSON.stringify(newSchema), updatedAt: serverTimestamp() });
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/databases/${pageId}/records/${recordId}`));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'records');
      }
    }
  };

  if (!page) return null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col mb-12 bg-background">
      <div className="p-12 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto w-full">
        <div className="mt-4 mb-4">
        </div>
        
        <input 
          className="w-full text-5xl font-bold tracking-tight text-foreground mb-10 bg-transparent outline-none placeholder-muted"
          placeholder="Untitled Database"
          value={page.name || ''}
          onChange={e => updateTitle(e.target.value)}
        />

        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
          <div className="flex items-center space-x-4 text-sm font-medium">
            <button className="border-b-2 border-foreground pb-2 text-foreground">Table</button>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setIsColDialogOpen(true)} className="text-xs font-medium text-foreground bg-surface border border-border px-3 py-1.5 rounded-sm hover:bg-surface-hover flex items-center transition-colors">
              <Settings2 className="w-3 h-3 mr-1.5" /> Add Column
            </button>
            <button onClick={addRecord} className="text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-sm hover:bg-foreground-hover transition-colors flex items-center">
              <Plus className="w-3 h-3 mr-1" /> New Record
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto text-sm border border-border rounded-sm bg-surface shadow-sm">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-background text-muted text-xs font-medium uppercase tracking-wider">
                <th className="py-2.5 px-4 w-64 min-w-[200px] border-r border-border">Primary Field</th>
                {schema.map(col => (
                  <th 
                    key={col.key} 
                    draggable
                    onDragStart={(e) => handleColDragStart(e, col.key)}
                    onDragOver={(e) => handleColDragOver(e, col.key)}
                    onDragLeave={() => setDragOverColId(null)}
                    onDrop={(e) => handleColDrop(e, col.key)}
                    className={`py-2.5 px-4 min-w-[150px] border-r border-border last:border-0 relative group cursor-grab active:cursor-grabbing transition-opacity ${draggedColId === col.key ? 'opacity-30' : 'opacity-100'}`}
                  >
                    {dragOverColId === col.key && (
                       <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-foreground z-10" />
                    )}
                    <div className="flex items-center justify-between">
                      <input 
                         className="bg-transparent outline-none font-medium text-muted uppercase flex-1 min-w-0 mr-2"
                         value={col.name}
                         onChange={e => {
                            const newSchema = [...schema];
                            const idx = newSchema.findIndex(c => c.key === col.key);
                            if (idx >= 0) {
                              newSchema[idx].name = e.target.value;
                              setSchema(newSchema);
                            }
                         }}
                         onBlur={e => renameColumn(col.key, e.target.value)}
                         onClick={e => e.stopPropagation()}
                      />
                      <button onClick={(e) => { e.stopPropagation(); deleteColumn(col.key); }} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity">
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-10 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map(record => {
                let props: any = {};
                try { props = JSON.parse(record.properties || '{}'); } catch(e) {}
                
                return (
                  <tr 
                     key={record.id} 
                     draggable
                     onDragStart={(e) => handleDragStart(e, record.id)}
                     onDragOver={(e) => handleDragOver(e, record.id)}
                     onDragLeave={() => setDragOverRowId(null)}
                     onDrop={(e) => handleDrop(e, record.id)}
                     onDragEnd={() => setDraggedRowId(null)}
                     className={`hover:bg-background transition-all group relative ${draggedRowId === record.id ? 'opacity-30' : 'opacity-100'}`}
                  >
                    <td className="py-2 px-4 font-medium text-foreground border-r border-border min-w-[200px] relative">
                       {dragOverRowId === record.id && (
                         <div className="absolute top-0 left-0 right-0 h-0.5 bg-foreground z-10" />
                       )}
                       <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted hover:text-foreground">
                         <GripVertical className="w-3.5 h-3.5" />
                       </div>
                       <input 
                         className="w-full bg-transparent outline-none placeholder-muted focus:bg-background focus:ring-2 ring-border rounded-sm px-2 py-1 pl-4 transition-all" 
                         value={record.title || ''}
                         placeholder="Empty"
                         onFocus={() => setEditingCellId(`${record.id}-title`)}
                         onChange={e => {
                           const newRecords = [...records];
                           const idx = newRecords.findIndex(r => r.id === record.id);
                           if(idx >= 0) {
                             newRecords[idx].title = e.target.value;
                             setRecords(newRecords);
                           }
                         }}
                         onBlur={e => {
                           updateRecordTitle(record.id, e.target.value);
                           setEditingCellId(null);
                         }}
                       />
                    </td>
                    {schema.map(col => (
                      <td key={col.key} className="py-2 px-4 border-r border-border last:border-0 relative">
                        {col.type === 'select' || col.type === 'status' ? (
                           <div className="relative">
                             <select 
                               className="appearance-none w-[calc(100%+0.5rem)] bg-transparent outline-none cursor-pointer hover:bg-surface-hover rounded-sm px-2 py-1 -ml-2 transition-colors text-foreground"
                               value={props[col.key] || ''}
                               onChange={e => updateRecordProp(record.id, record.properties, col.key, e.target.value)}
                             >
                               <option value="">Empty</option>
                               {col.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                           </div>
                        ) : col.type === 'date' ? (
                          <input 
                            type="date"
                            className="w-full text-foreground bg-transparent outline-none cursor-pointer hover:bg-surface-hover px-2 py-1 -ml-2 rounded-sm transition-colors"
                            value={props[col.key] || ''}
                            onChange={e => updateRecordProp(record.id, record.properties, col.key, e.target.value)}
                          />
                        ) : col.type === 'checkbox' ? (
                          <div className="flex items-center h-full pt-1 px-2">
                            <input 
                              type="checkbox"
                              className="w-4 h-4 accent-foreground cursor-pointer transition-colors"
                              checked={props[col.key] === 'true' || props[col.key] === true}
                              onChange={e => updateRecordProp(record.id, record.properties, col.key, String(e.target.checked))}
                            />
                          </div>
                        ) : col.type === 'number' ? (
                          <input 
                            type="number"
                            className="w-full text-foreground bg-transparent outline-none focus:bg-background focus:ring-2 ring-border rounded-sm px-2 py-1 -ml-2 placeholder-muted transition-all"
                            value={props[col.key] || ''}
                            onFocus={() => setEditingCellId(`${record.id}-${col.key}`)}
                            onBlur={e => {
                               updateRecordProp(record.id, record.properties, col.key, e.target.value);
                               setEditingCellId(null);
                            }}
                            onChange={(e) => {
                              const newRecords = [...records];
                               const idx = newRecords.findIndex(r => r.id === record.id);
                               try {
                                 const p = JSON.parse(newRecords[idx].properties || '{}');
                                 p[col.key] = e.target.value;
                                 newRecords[idx].properties = JSON.stringify(p);
                                 setRecords(newRecords);
                               } catch(er) {}
                            }}
                          />
                        ) : (
                          <input 
                            className="w-full text-foreground bg-transparent outline-none focus:bg-background focus:ring-2 ring-border rounded-sm px-2 py-1 -ml-2 placeholder-muted transition-all"
                            placeholder="Empty"
                            value={props[col.key] || ''}
                            onFocus={() => setEditingCellId(`${record.id}-${col.key}`)}
                            onChange={(e) => {
                              const newRecords = [...records];
                               const idx = newRecords.findIndex(r => r.id === record.id);
                               try {
                                 const p = JSON.parse(newRecords[idx].properties || '{}');
                                 p[col.key] = e.target.value;
                                 newRecords[idx].properties = JSON.stringify(p);
                                 setRecords(newRecords);
                               } catch(er) {}
                            }}
                            onBlur={e => {
                               updateRecordProp(record.id, record.properties, col.key, e.target.value);
                               setEditingCellId(null);
                            }}
                          />
                        )}
                      </td>
                    ))}
                    <td className="w-10 text-center opacity-0 group-hover:opacity-100 transition-opacity p-2 border-l border-border">
                       <button onClick={() => deleteRecord(record.id)} className="text-muted hover:text-red-500 hover:bg-surface-hover p-1.5 rounded-sm transition-colors flex items-center justify-center">
                           <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      <Dialog open={isColDialogOpen} onOpenChange={setIsColDialogOpen}>
        <DialogContent className="bg-background text-foreground border border-border">
          <DialogHeader>
            <DialogTitle>Add Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Column Name</label>
              <Input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="e.g. Priority" className="bg-surface border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Column Type</label>
              <Select value={newColType} onValueChange={setNewColType}>
                <SelectTrigger className="bg-surface border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="select">Select / Status</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newColType === 'select' || newColType === 'status') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Options (comma separated)</label>
                <Input value={newColOptions} onChange={e => setNewColOptions(e.target.value)} placeholder="e.g. High, Medium, Low" className="bg-surface border-border" />
              </div>
            )}
            <Button className="w-full bg-foreground text-background hover:bg-foreground-hover" onClick={addColumn} disabled={!newColName}>Add Column</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
