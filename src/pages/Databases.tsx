import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Database, Plus, Trash2, Edit2, Table2 } from 'lucide-react';

export function Databases() {
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState<any | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/databases`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt
        };
      });
      setDatabases(dbData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/databases`);
    });
    return () => unsubscribe();
  }, []);

  const createDatabase = async () => {
    if (!auth.currentUser) return;
    try {
      const newDb = {
        name: 'Untitled Database',
        schema: JSON.stringify([{ name: 'Name', type: 'text' }]),
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
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/databases/${id}`));
      if (selectedDb?.id === id) setSelectedDb(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/databases/${id}`);
    }
  };

  return (
    <div className="flex h-full bg-[#FBFBFA]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#E8E6E1] bg-[#F5F4F0] flex flex-col">
        <div className="p-4 border-b border-[#E8E6E1] flex justify-between items-center">
          <h2 className="font-bold text-[10px] text-[#A19E95] uppercase tracking-widest">Databases</h2>
          <button onClick={createDatabase} className="p-1 hover:bg-background rounded text-[#A19E95] hover:text-black hover:border-black border border-transparent transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {databases.map(d => (
            <div 
              key={d.id}
              onClick={() => setSelectedDb(d)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors border ${selectedDb?.id === d.id ? 'bg-background border-[#E8E6E1] text-black font-semibold shadow-sm' : 'border-transparent text-[#6B685E] hover:bg-background/50'}`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="truncate">{d.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteDatabase(d.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Database View */}
      <div className="flex-1 overflow-auto relative p-8">
        {selectedDb ? (
          <div className="max-w-5xl mx-auto border border-[#E8E6E1] bg-background p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif italic text-xl text-[#1A1A1A]">{selectedDb.name}</h3>
              <div className="flex space-y-0 space-x-4 text-[10px] font-bold uppercase tracking-widest">
                <span className="cursor-pointer border-b border-black text-[#1A1A1A]">Grid</span>
                <span className="cursor-pointer text-[#A19E95] hover:text-[#1A1A1A]">Board</span>
                <span className="cursor-pointer text-[#A19E95] hover:text-[#1A1A1A]">Timeline</span>
              </div>
            </div>
            
            <div className="w-full">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-widest text-[#A19E95] border-b border-[#F5F4F0]">
                  <tr>
                    <th className="pb-2 font-semibold w-1/3">Name</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-[#F5F4F0]">
                    <td className="py-4 font-semibold text-[#1A1A1A]">Example Record 1</td>
                    <td className="py-4"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-sm border border-blue-200 text-[9px] font-bold">TEXT</span></td>
                    <td className="py-4 font-mono text-muted">Today</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-4 text-[#A19E95] italic">Use the AI Planner (Planned feature) to generate records and schema structure automatically.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#A19E95] font-serif italic text-lg">
            Select or create a database.
          </div>
        )}
      </div>
    </div>
  );
}
