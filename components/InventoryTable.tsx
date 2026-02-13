
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, InventoryCategory, User } from '../types';
import { 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Search, 
  Edit2, 
  CloudDownload, 
  Loader2, 
  Database, 
  CheckCircle2
} from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  allStoredItems?: InventoryItem[];
  title: string;
  category: InventoryCategory;
  isArchive?: boolean;
  onDeliver?: (id: string, date: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (data: Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>) => void;
  onUpdate?: (id: string, data: Partial<Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>>) => void;
  onSyncSheet?: (sheetId: string, category: InventoryCategory) => Promise<{ success: boolean; count?: number; error?: string; message?: string }>;
  user?: User | null;
  readOnly?: boolean;
}

const SHEET_CONFIG: Record<InventoryCategory, { id: string }> = {
  'DEBIT CARD': { id: '1e_22aHpRoJYBe9J0ohT-PzwHmXGhrOtNlsQeOVHg67M' },
  'CHEQUE BOOK': { id: '1cakIYc79gR-YVnqKe4-i8J95AEuIKa4Q' },
  'DPS SLIP': { id: '1Ah7wHvJDbzAF9VUJLlBs6YHKfInY6ZWeXlmyZtlUj9Q' },
  'PIN': { id: '1voTnPN_6crhBoev-5mLg9pLRMREWp7alpMNM8SwhL6k' }
};

const MASTER_SHEET_ID = '1h7Nmn8alVoWNE_vn3690-yWMvRcXs93_9VXONaAA4po';

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, 
  allStoredItems = [],
  title, 
  category, 
  isArchive, 
  onDeliver, 
  onDelete, 
  onAdd, 
  onUpdate,
  onSyncSheet,
  user,
  readOnly = false
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: '',
    customerName: '',
    phoneNumber: '',
    address: '',
    receiveDate: new Date().toISOString().split('T')[0],
  });

  const categorySheetId = SHEET_CONFIG[category]?.id || MASTER_SHEET_ID;
  const SHEET_EDIT_URL = `https://docs.google.com/spreadsheets/d/${categorySheetId}/edit?usp=sharing`;
  const deliveredCount = useMemo(() => allStoredItems.filter(i => i.category === category && i.isDelivered).length, [allStoredItems, category]);

  const handleSync = async () => {
    if (!onSyncSheet) return;
    setIsSyncing(true);
    await onSyncSheet(categorySheetId, category);
    setIsSyncing(false);
  };

  const processedItems = useMemo(() => {
    let result = [...items];
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(item => 
        item.customerName.toLowerCase().includes(q) ||
        item.accountNumber.toLowerCase().includes(q) ||
        item.phoneNumber.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.receiveDate).getTime() - new Date(a.receiveDate).getTime());
  }, [items, localSearch]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData, customerName: formData.customerName.toUpperCase(), address: formData.address.toUpperCase() };
    if (editingId && onUpdate) {
      onUpdate(editingId, dataToSave);
      setEditingId(null);
      setShowForm(false);
    } else if (onAdd) {
      onAdd({ ...dataToSave, category });
      setShowForm(false);
    }
    setFormData({ accountNumber: '', customerName: '', phoneNumber: '', address: '', receiveDate: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-slide-up px-2 md:px-0">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">{title}</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black uppercase border border-white/5">{items.length} ACTIVE</span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase border border-emerald-500/20">{deliveredCount} DELIVERED</span>
          </div>
        </div>
        
        {!isArchive && !readOnly && (
          <div className="grid grid-cols-1 sm:flex items-center gap-3">
            <button onClick={() => window.open(SHEET_EDIT_URL, '_blank')} className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-lg"><Database className="w-4 h-4" /> Entry in Sheet</button>
            <button onClick={handleSync} disabled={isSyncing} className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 border border-white/10 rounded-2xl text-violet-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50">
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />} Sync
            </button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center gap-3 px-6 py-4 bg-violet-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-violet-600/20 active:scale-95 transition-all">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? 'Close' : 'New Entry'}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Account Number</label>
              <input required value={formData.accountNumber} onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-violet-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Customer Name</label>
              <input required value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold text-sm outline-none uppercase focus:border-violet-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Phone</label>
              <input required value={formData.phoneNumber} onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-violet-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Date</label>
              <input type="date" required value={formData.receiveDate} onChange={e => setFormData(p => ({ ...p, receiveDate: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white text-sm outline-none [color-scheme:dark] focus:border-violet-500/50" />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Address</label>
              <textarea required value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white text-sm outline-none uppercase resize-none h-20 focus:border-violet-500/50" />
            </div>
            <div className="flex flex-col justify-end">
              <button type="submit" className="w-full py-4 md:py-5 bg-violet-600 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"><Save className="w-4 h-4 inline mr-2" /> Save Asset</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative group max-w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
        <input type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder={`Filter registry...`} className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl md:rounded-[2rem] py-4 md:py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all uppercase" />
      </div>

      <div className="glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white/[0.02] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-8 md:px-12 py-5 md:py-7">Identity Profile</th>
                <th className="px-8 md:px-12 py-5 md:py-7">Location & Contact</th>
                <th className="px-8 md:px-12 py-5 md:py-7">Registry Data</th>
                <th className="px-8 md:px-12 py-5 md:py-7 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="px-8 md:px-12 py-7 md:py-9">
                    <p className="text-sm md:text-base font-bold text-white uppercase italic tracking-tight mb-1">{item.customerName}</p>
                    <p className="text-[11px] font-mono text-zinc-500 font-bold">#{item.accountNumber}</p>
                  </td>
                  <td className="px-8 md:px-12 py-7 md:py-9">
                    <p className="text-xs md:text-sm text-zinc-300 font-bold mb-1">{item.phoneNumber}</p>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[200px] uppercase font-medium">{item.address}</p>
                  </td>
                  <td className="px-8 md:px-12 py-7 md:py-9">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">RCVD: {item.receiveDate}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">EXP: {item.destroyDate}</p>
                  </td>
                  <td className="px-8 md:px-12 py-7 md:py-9 text-right space-x-2">
                    {!isArchive && !readOnly && onDeliver && (
                      <button onClick={() => onDeliver(item.id, new Date().toISOString().split('T')[0])} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-900/20">Deliver</button>
                    )}
                    {!readOnly && onDelete && (
                      <button onClick={() => onDelete(item.id)} className="p-3 text-zinc-600 hover:text-rose-500 transition-colors bg-zinc-900/50 rounded-xl border border-white/5 hover:border-rose-500/30"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {processedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-12 py-20 text-center text-zinc-600 text-[11px] font-black uppercase tracking-[0.3em] italic">No cluster records found in this segment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
