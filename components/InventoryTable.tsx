
import React, { useState, useMemo } from 'react';
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
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  allStoredItems?: InventoryItem[];
  title: string;
  category: InventoryCategory;
  isArchive?: boolean;
  isTrashBin?: boolean;
  onDeliver?: (id: string, date: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onAdd?: (data: Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>) => void;
  onUpdate?: (id: string, data: Partial<Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>>) => void;
  onSyncSheet?: (sheetId: string, category: InventoryCategory) => Promise<{ success: boolean }>;
  user?: User | null;
  readOnly?: boolean;
}

const SHEET_CONFIG: Record<InventoryCategory, { id: string }> = {
  'DEBIT CARD': { id: '1e_22aHpRoJYBe9J0ohT-PzwHmXGhrOtNlsQeOVHg67M' },
  'CHEQUE BOOK': { id: '1cakIYc79gR-YVnqKe4-i8J95AEuIKa4Q' },
  'DPS SLIP': { id: '1Ah7wHvJDbzAF9VUJLlBs6YHKfInY6ZWeXlmyZtlUj9Q' },
  'PIN': { id: '1voTnPN_6crhBoev-5mLg9pLRMREWp7alpMNM8SwhL6k' }
};

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, 
  allStoredItems = [],
  title, 
  category, 
  isArchive, 
  isTrashBin,
  onDeliver, 
  onDelete, 
  onRestore,
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
  
  const getToday = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    accountNumber: '',
    customerName: '',
    phoneNumber: '',
    address: '',
    receiveDate: getToday(),
  });

  const categorySheetId = SHEET_CONFIG[category]?.id;
  const SHEET_EDIT_URL = `https://docs.google.com/spreadsheets/d/${categorySheetId}/edit?usp=sharing`;
  const deliveredCount = useMemo(() => allStoredItems.filter(i => i.category === category && i.isDelivered && !i.isTrashed).length, [allStoredItems, category]);

  const handleSync = async () => {
    if (!onSyncSheet || !categorySheetId) return;
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

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      accountNumber: item.accountNumber,
      customerName: item.customerName,
      phoneNumber: item.phoneNumber,
      address: item.address,
      receiveDate: item.receiveDate || getToday(),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountNumber.trim()) return;

    const dataToSave = { 
      ...formData, 
      customerName: (formData.customerName || 'UNKNOWN').toUpperCase(), 
      address: (formData.address || '').toUpperCase(),
      receiveDate: formData.receiveDate || getToday()
    };

    if (editingId && onUpdate) {
      onUpdate(editingId, dataToSave);
      setEditingId(null);
    } else if (onAdd) {
      onAdd({ ...dataToSave, category });
    }

    setShowForm(false);
    setFormData({ accountNumber: '', customerName: '', phoneNumber: '', address: '', receiveDate: getToday() });
  };

  return (
    <div className="w-full space-y-4 md:space-y-8 animate-slide-up">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter italic uppercase">{title}</h2>
            <div className="flex gap-2 mt-1">
              {!isTrashBin ? (
                <>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{items.length} ACTIVE</span>
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">•</span>
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{deliveredCount} DELIVERED</span>
                </>
              ) : (
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{items.length} TRASHED ENTITIES</span>
              )}
            </div>
          </div>

          {!isArchive && !readOnly && !isTrashBin && (
            <div className="flex items-center gap-2">
              <a 
                href={SHEET_EDIT_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-violet-400 hover:text-white transition-all flex items-center justify-center gap-2"
                title="Open Entry Sheet"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Entry Sheet</span>
              </a>
              <button onClick={handleSync} disabled={isSyncing} className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-violet-400 disabled:opacity-50 hover:text-white transition-all">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
              </button>
              <button onClick={() => setShowForm(!showForm)} className="p-3 bg-violet-600 text-white rounded-xl shadow-lg hover:bg-violet-500 transition-all">
                {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="glass rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 border-violet-500/20">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">A/C Number</label>
              <input required value={formData.accountNumber} onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-violet-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Entity Name</label>
              <input value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none uppercase focus:border-violet-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Phone</label>
              <input value={formData.phoneNumber} onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Entry Date</label>
              <input type="date" value={formData.receiveDate} onChange={e => setFormData(p => ({ ...p, receiveDate: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none [color-scheme:dark] focus:border-violet-500/50" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Location / Meta</label>
              <textarea value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs outline-none uppercase h-20 resize-none focus:border-violet-500/50" />
            </div>
            <button type="submit" className="md:col-span-2 w-full py-4 bg-violet-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Commit Record
            </button>
          </form>
        </div>
      )}

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder={`Search ${category}...`} className="w-full bg-zinc-900 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-violet-500/30 transition-all uppercase" />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white/[0.02] text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-10 py-6">Entity Profile</th>
                <th className="px-10 py-6">Contact Node</th>
                <th className="px-10 py-6">Audit Info</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="px-10 py-8">
                    <p className="text-base font-bold text-white uppercase italic tracking-tight">{item.customerName}</p>
                    <p className="text-[10px] font-mono text-zinc-500">#{item.accountNumber}</p>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-sm text-zinc-300 font-bold">{item.phoneNumber || 'N/A'}</p>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[200px] uppercase">{item.address}</p>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">RCV: {item.receiveDate}</p>
                    <p className="text-[9px] font-black text-rose-500 uppercase">EXP: {item.destroyDate}</p>
                  </td>
                  <td className="px-10 py-8 text-right space-x-2">
                    {isTrashBin && onRestore && (
                      <button onClick={() => onRestore(item.id)} className="p-3 text-emerald-500 bg-zinc-900 rounded-xl border border-white/5"><RefreshCw className="w-4 h-4" /></button>
                    )}
                    {!isArchive && !readOnly && onDeliver && !isTrashBin && (
                      <button onClick={() => onDeliver(item.id, getToday())} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">Deliver</button>
                    )}
                    {!readOnly && onUpdate && !isTrashBin && (
                      <button onClick={() => handleEdit(item)} className="p-3 text-zinc-500 hover:text-white bg-zinc-900 rounded-xl border border-white/5"><Edit2 className="w-4 h-4" /></button>
                    )}
                    {!readOnly && onDelete && (
                      <button onClick={() => onDelete(item.id)} className={`p-3 text-zinc-600 bg-zinc-900 rounded-xl border border-white/5 ${isTrashBin ? 'hover:text-rose-500' : 'hover:text-orange-500'}`}><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {processedItems.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-5 border border-white/5 shadow-xl relative overflow-hidden active:scale-[0.98] transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter truncate">{item.customerName}</h4>
                <p className="text-[9px] font-mono text-violet-400 font-bold">#{item.accountNumber}</p>
              </div>
              <div className={`shrink-0 px-2 py-0.5 rounded text-[7px] font-black uppercase border border-white/10 ${item.isDelivered ? 'bg-emerald-500/10 text-emerald-500' : 'bg-violet-500/10 text-violet-500'}`}>
                {item.isDelivered ? 'Delivered' : 'In Branch'}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-zinc-400">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{item.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-3 text-zinc-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] uppercase font-medium leading-relaxed">{item.address || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-zinc-500 uppercase">RCV: {item.receiveDate}</span>
                  <span className="text-zinc-700 font-black">•</span>
                  <span className="text-[8px] font-black text-rose-500 uppercase">EXP: {item.destroyDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
              {isTrashBin ? (
                <>
                  <button onClick={() => onRestore && onRestore(item.id)} className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Restore
                  </button>
                  <button onClick={() => onDelete && onDelete(item.id)} className="flex-1 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                    <Trash2 className="w-3 h-3" /> Purge
                  </button>
                </>
              ) : (
                <>
                  {!isArchive && !readOnly && onDeliver && (
                    <button onClick={() => onDeliver(item.id, getToday())} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-900/20">Deliver</button>
                  )}
                  {!readOnly && onUpdate && (
                    <button onClick={() => handleEdit(item)} className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400"><Edit2 className="w-4 h-4" /></button>
                  )}
                  {!readOnly && onDelete && (
                    <button onClick={() => onDelete(item.id)} className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {processedItems.length === 0 && (
          <div className="py-20 text-center glass rounded-2xl border border-white/5">
            <UserIcon className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">Registry Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTable;
