
import React, { useState, useMemo } from 'react';
import { InventoryItem, User } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Search, 
  Printer, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  MapPin,
  ShieldCheck,
  Edit3
} from 'lucide-react';

interface StaffViewProps {
  items: InventoryItem[];
  user: User;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeliverItem: (id: string, date: string) => void;
}

const StaffView: React.FC<StaffViewProps> = ({ items, user, onUpdateItem, onDeliverItem }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempAddress, setTempAddress] = useState('');
  const [bulkMessage, setBulkMessage] = useState('Hello {{name}}, your {{item}} is ready for delivery.');
  const [senderNumber, setSenderNumber] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sentStatus, setSentStatus] = useState<Record<string, 'sent' | 'failed' | 'none'>>({});

  const activeItems = useMemo(() => {
    let filtered = items.filter(i => !i.isDelivered && !i.isTrashed);
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      filtered = filtered.filter(i => 
        (i.address || '').toLowerCase().includes(q) ||
        (i.customerName || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => (a.address || '').localeCompare(b.address || ''));
  }, [items, filterQuery]);

  const handleSendBulk = () => {
    const message = bulkMessage.trim();
    if (!message) {
      alert('Please enter a message.');
      return;
    }

    if (activeItems.length === 0) {
      alert('No undelivered customers found to send messages to.');
      return;
    }

    // Reset selection and status when opening modal
    setSelectedIds([]);
    setSentStatus({});
    setShowBulkModal(true);
  };

  const handleConfirmBulkSend = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one customer.');
      return;
    }

    if (selectedIds.length > 20) {
      alert('You can only select at most 20 numbers at a time.');
      return;
    }

    const selectedItems = activeItems.filter(item => selectedIds.includes(item.id));
    
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        try {
          let cleanPhone = (item.phoneNumber || '').replace(/\D/g, '');
          if (!cleanPhone) return;

          // Ensure Bangladesh country code 88 is present
          if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
            cleanPhone = '88' + cleanPhone;
          } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
            cleanPhone = '880' + cleanPhone;
          } else if (!cleanPhone.startsWith('88') && cleanPhone.length === 11) {
            // Fallback for 11 digit numbers not starting with 0
            cleanPhone = '88' + cleanPhone;
          }

          const personalizedMessage = bulkMessage
            .replace(/{{name}}/gi, item.customerName || 'Customer')
            .replace(/{{item}}/gi, item.category || 'Item');
          
          const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`;
          const newWin = window.open(url, '_blank');
          
          if (newWin) {
            setSentStatus(prev => ({ ...prev, [item.id]: 'sent' }));
          } else {
            setSentStatus(prev => ({ ...prev, [item.id]: 'failed' }));
          }
        } catch (err) {
          console.error('Error sending to item:', err);
          setSentStatus(prev => ({ ...prev, [item.id]: 'failed' }));
        }
      }, index * 2000); // 2 second interval
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 20) {
        alert('Maximum 20 selections allowed at once.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleOpenPDFInNewTab = () => {
    if (activeItems.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const now = new Date();
    const dateTimeStr = now.toLocaleString();

    // Background Watermark
    doc.saveGraphicsState();
    const gState = new (doc as any).GState({ opacity: 0.03 });
    doc.setGState(gState);
    doc.setFontSize(38);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.text("DESIGNED BY TOUFIQ", pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
    doc.restoreGraphicsState();

    // Header Metadata
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL CUSTOMER : ${activeItems.length}`, 14, 15);
    
    doc.setFontSize(14);
    doc.text("STAFF DELIVERY SHEET", pageWidth / 2, 15, { align: 'center' });

    const tableData = activeItems.map(item => [
      item.customerName.toUpperCase(),
      item.category,
      item.phoneNumber ? (item.phoneNumber.startsWith('+') ? item.phoneNumber : `+${item.phoneNumber.startsWith('88') ? '' : '88'}${item.phoneNumber}`) : 'N/A',
      item.address.toUpperCase()
    ]);

    autoTable(doc, {
      head: [['NAME', 'TYPE', 'PHONE', 'ADDRESS']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    doc.setFontSize(8);
    doc.text(`Printed by: ${user.fullName} on ${dateTimeStr}`, 14, pageHeight - 10);
    doc.text("DESIGNED BY TOUFIQ", pageWidth - 14, pageHeight - 10, { align: 'right' });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '88' + cleanPhone;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      cleanPhone = '880' + cleanPhone;
    }
    window.location.href = `tel:+${cleanPhone}`;
  };

  const handleWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '88' + cleanPhone;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      cleanPhone = '880' + cleanPhone;
    }
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const startEditing = (item: InventoryItem) => {
    setEditingId(item.id);
    setTempAddress(item.address);
  };

  const saveAddress = (id: string) => {
    onUpdateItem(id, { address: tempAddress });
    setEditingId(null);
  };

  const handleDeliver = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    onDeliverItem(id, today);
  };

  return (
    <div className="w-full space-y-8 md:space-y-12 animate-slide-up px-2 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2 italic">
            <ShieldCheck className="w-3.5 h-3.5" /> STAFF DELIVERY PORTAL
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic leading-none">STAFF PANEL</h2>
          <p className="text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-widest italic leading-none">
            ACCESS: DELIVERY & LOGISTICS
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              value={filterQuery} 
              onChange={e => setFilterQuery(e.target.value)} 
              className="w-full md:w-80 bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-4 md:py-5 text-sm text-white focus:border-violet-500/50 outline-none shadow-2xl shadow-black/40 uppercase font-medium" 
              placeholder="Filter by Location/Name..." 
            />
          </div>
          <button 
            onClick={handleOpenPDFInNewTab} 
            className="flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
          >
            <Printer className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Bulk WhatsApp Section */}
      <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600/10 text-emerald-500 rounded-2xl">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Bulk WhatsApp Messenger</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Send messages to all {activeItems.length} undelivered customers</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-3">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">Sender WhatsApp Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  value={senderNumber}
                  onChange={e => setSenderNumber(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none font-medium placeholder:text-zinc-700"
                  placeholder="e.g. +8801712345678"
                />
              </div>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                Note: Ensure you are logged into this account on WhatsApp Web.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">Message Content</label>
              <div className="relative">
                <textarea 
                  value={bulkMessage}
                  onChange={e => setBulkMessage(e.target.value)}
                  className="w-full h-32 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 text-sm text-white focus:border-emerald-500/50 outline-none resize-none font-medium placeholder:text-zinc-600"
                  placeholder="Write your message here... Use {{name}} for customer name and {{item}} for item type."
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[8px] font-black text-zinc-500 uppercase tracking-widest">Placeholder: &#123;&#123;name&#125;&#125;</span>
                  <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[8px] font-black text-zinc-500 uppercase tracking-widest">Placeholder: &#123;&#123;item&#125;&#125;</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button 
              onClick={handleSendBulk}
              className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> Send Bulk WhatsApp
            </button>

            {/* Bulk Selection Modal - Fixed Overlay for Mobile & Desktop */}
            {showBulkModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-fade-in">
                <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl shadow-black overflow-hidden relative">
                  <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Select Recipients</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic mt-1">
                        Selected: {selectedIds.length} / 20 (Max 20)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const next20 = activeItems.slice(0, 20).map(i => i.id);
                          setSelectedIds(next20);
                        }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all"
                      >
                        First 20
                      </button>
                      <button 
                        onClick={() => setShowBulkModal(false)}
                        className="p-3 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all"
                      >
                        <ShieldCheck className="w-6 h-6 rotate-45" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                    {activeItems.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                          selectedIds.includes(item.id) 
                            ? 'bg-emerald-600/10 border-emerald-500/30' 
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            selectedIds.includes(item.id) 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'border-white/20 group-hover:border-white/40'
                          }`}>
                            {selectedIds.includes(item.id) && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase italic">{item.customerName}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {item.phoneNumber ? (item.phoneNumber.startsWith('+') ? item.phoneNumber : `+${item.phoneNumber.startsWith('88') ? '' : '88'}${item.phoneNumber}`) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {sentStatus[item.id] === 'sent' && (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/30">
                              SENT
                            </span>
                          )}
                          {sentStatus[item.id] === 'failed' && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-red-500/30">
                              NO WA
                            </span>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSentStatus(prev => ({ ...prev, [item.id]: 'failed' }));
                            }}
                            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 md:p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
                    <button 
                      onClick={() => setShowBulkModal(false)}
                      className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmBulkSend}
                      disabled={selectedIds.length === 0}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      Confirm & Send ({selectedIds.length})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-white/[0.02] text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-8 py-7 md:py-9">Customer Name</th>
                <th className="px-8 py-7 md:py-9">Type</th>
                <th className="px-8 py-7 md:py-9">Phone Number</th>
                <th className="px-8 py-7 md:py-9">Address</th>
                <th className="px-8 py-7 md:py-9 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="px-8 py-8 md:py-10">
                    <p className="text-sm md:text-base font-bold text-white uppercase italic tracking-tight leading-none">{item.customerName}</p>
                  </td>
                  <td className="px-8 py-8 md:py-10">
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border ${CATEGORY_COLORS[item.category]}`}>{item.category}</span>
                  </td>
                  <td className="px-8 py-8 md:py-10">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-mono text-zinc-300 font-bold">
                          {item.phoneNumber ? (item.phoneNumber.startsWith('+') ? item.phoneNumber : `+${item.phoneNumber.startsWith('88') ? '' : '88'}${item.phoneNumber}`) : 'N/A'}
                        </span>
                        {sentStatus[item.id] === 'sent' && (
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-1">Status: Sent</span>
                        )}
                        {sentStatus[item.id] === 'failed' && (
                          <span className="text-[8px] text-red-500 font-black uppercase tracking-widest mt-1">Status: No WhatsApp</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCall(item.phoneNumber)}
                          className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleWhatsApp(item.phoneNumber)}
                          className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 md:py-10">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          value={tempAddress}
                          onChange={e => setTempAddress(e.target.value)}
                          className="bg-zinc-800 border border-violet-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none w-full"
                          autoFocus
                        />
                        <button 
                          onClick={() => saveAddress(item.id)}
                          className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 group/addr">
                        <p className="text-xs md:text-sm font-medium text-zinc-300 italic uppercase leading-relaxed">
                          {item.address || <span className="text-zinc-600">No Address Provided</span>}
                        </p>
                        <button 
                          onClick={() => startEditing(item)}
                          className="p-2 text-zinc-500 hover:text-violet-400 opacity-0 group-hover/addr:opacity-100 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-8 md:py-10 text-right">
                    <button 
                      onClick={() => handleDeliver(item.id)}
                      className="px-5 py-2.5 bg-violet-600/10 text-violet-400 border border-violet-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      Deliver
                    </button>
                  </td>
                </tr>
              ))}
              {activeItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-zinc-600 text-[11px] font-black uppercase tracking-[0.4em] italic">No Delivery Tasks Pending</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffView;
