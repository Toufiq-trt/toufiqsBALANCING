
import React, { useState, useMemo } from 'react';
import { InventoryItem, User } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  MapPin, 
  Search, 
  Calendar,
  User as UserIcon,
  Package,
  Printer,
  X,
  Eye,
  Download,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface MasterDataViewProps {
  items: InventoryItem[];
  user: User;
}

const MasterDataView: React.FC<MasterDataViewProps> = ({ items, user }) => {
  const [filterQuery, setFilterQuery] = useState('');

  const processedItems = useMemo(() => {
    let filtered = [...items];
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.customerName.toLowerCase().includes(q) || 
        i.address.toLowerCase().includes(q) ||
        i.accountNumber.toLowerCase().includes(q) ||
        i.phoneNumber.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const addrA = a.address.toLowerCase();
      const addrB = b.address.toLowerCase();
      if (addrA < addrB) return -1;
      if (addrA > addrB) return 1;
      return 0;
    });
  }, [items, filterQuery]);

  const handleOpenPDFInNewTab = () => {
    if (processedItems.length === 0) return;

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
    const countStr = processedItems.length < 10 ? `0${processedItems.length}` : `${processedItems.length}`;
    doc.text(`TOTAL CUSTOMER : ${countStr}`, 14, 15);
    
    doc.setFontSize(14);
    doc.text("TOUFIQ'S BALANCING SYSTEM", pageWidth / 2, 15, { align: 'center' });

    const tableData = processedItems.map(item => [
      item.category,
      item.accountNumber,
      item.customerName.toUpperCase(),
      item.address.toUpperCase(),
      item.phoneNumber
    ]);

    autoTable(doc, {
      head: [['TYPE', 'AC NUMBER', 'NAME', 'ADDRESS', 'PHONE NUMBER']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 1, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, font: 'helvetica' },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    // Footer - Print details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Printed by: ${user.fullName} on ${dateTimeStr}`, 14, pageHeight - 10);

    // Bottom Right - DESIGNED BY TOUFIQ
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("DESIGNED BY TOUFIQ", pageWidth - 14, pageHeight - 10, { align: 'right' });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="w-full space-y-8 md:space-y-12 animate-slide-up px-2 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2 italic">
            <ShieldCheck className="w-3.5 h-3.5" /> GLOBAL REGISTRY NODE
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic leading-none">MASTER DATA</h2>
          <p className="text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-widest italic leading-none">
            ACCESS: {user.role === 'super_admin' ? 'FULL SYSTEM CONTROL' : 'SEGMENTED READ ACCESS'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={filterQuery} onChange={e => setFilterQuery(e.target.value)} className="w-full md:w-80 bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-4 md:py-5 text-sm text-white focus:border-violet-500/50 outline-none shadow-2xl shadow-black/40 uppercase font-medium" placeholder="Search Master Node..." />
          </div>
          <button 
            onClick={handleOpenPDFInNewTab} 
            className="flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
          >
            <Printer className="w-4 h-4" /> Download PDF Report
          </button>
        </div>
      </div>

      <div className="glass rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-white/[0.02] text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-10 py-7 md:py-9">Identity Profile</th>
                <th className="px-10 py-7 md:py-9">Location</th>
                <th className="px-10 py-7 md:py-9">Metrics</th>
                <th className="px-10 py-7 md:py-9 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="px-10 py-8 md:py-10">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 text-zinc-400 font-bold text-sm uppercase shadow-inner group-hover:border-violet-500/30 transition-all">{item.customerName[0]}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <p className="text-sm md:text-base font-bold text-white uppercase italic tracking-tight leading-none">{item.customerName}</p>
                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border ${CATEGORY_COLORS[item.category]}`}>{item.category}</span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-500 font-bold uppercase leading-none">#{item.accountNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 md:py-10">
                    <p className="text-xs md:text-sm font-medium text-zinc-300 italic uppercase leading-relaxed mb-1">{item.address}</p>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{item.phoneNumber}</p>
                  </td>
                  <td className="px-10 py-8 md:py-10">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1.5">RCV: {item.receiveDate}</p>
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">EXP: {item.destroyDate}</p>
                  </td>
                  <td className="px-10 py-8 md:py-10 text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${item.isDelivered ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-violet-400 bg-violet-400/10 border-violet-400/20 shadow-[0_0_20px_rgba(167,139,250,0.1)]'}`}>
                      {item.isDelivered ? 'Delivered' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {processedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center text-zinc-600 text-[11px] font-black uppercase tracking-[0.4em] italic">No Master Fingerprints Detected</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterDataView;
