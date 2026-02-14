
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Search, CornerDownLeft, User, Calendar, MapPin, Hash, Package } from 'lucide-react';

interface MasterSearchProps {
  items: InventoryItem[];
}

const MasterSearch: React.FC<MasterSearchProps> = ({ items = [] }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const fullText = "SEARCH YOUR DOCUMENT POWERED BY TOUFIQ...";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setPlaceholder(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        index = 0;
        clearInterval(interval);
        setTimeout(() => {
           const newInterval = setInterval(() => {
             setPlaceholder(fullText.slice(0, index));
             index++;
             if (index > fullText.length) index = 0;
           }, 100);
        }, 2000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items.filter(item => 
      item.customerName.toLowerCase().includes(q) ||
      (item.phoneNumber && item.phoneNumber.toLowerCase().includes(q)) ||
      (item.address && item.address.toLowerCase().includes(q)) ||
      (item.accountNumber && item.accountNumber.toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <div className="w-full mt-6 md:mt-12 mb-16 md:mb-24 px-0">
      {/* Floating Command Bar */}
      <div className={`max-w-3xl mx-auto glass rounded-2xl md:rounded-[2rem] p-2 md:p-3 transition-all duration-500 relative z-30 ${isFocused ? 'ring-2 ring-violet-500/50 shadow-[0_0_60px_rgba(139,92,246,0.3)] border-violet-500/30' : ''}`}>
        <div className="flex items-center gap-3 md:gap-5 px-3 md:px-6">
          <Search className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isFocused ? 'text-violet-400 scale-110' : 'text-zinc-500'}`} />
          <input 
            type="text" 
            value={query}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 md:h-14 bg-transparent border-none outline-none text-base md:text-xl font-bold text-white placeholder:text-zinc-700 uppercase tracking-tight"
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* Results Dropdown Style */}
      {query && (
        <div className="max-w-3xl mx-auto mt-4 animate-in slide-in-from-top-4 duration-500">
          <div className="glass rounded-2xl md:rounded-[2.5rem] border-white/10 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <div className="bg-zinc-900/80 px-4 md:px-8 py-3 md:py-5 border-b border-white/5 flex justify-between items-center backdrop-blur-xl">
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-zinc-500 italic">Registry Hits</span>
              <span className="text-[8px] md:text-[10px] font-black text-violet-400 bg-violet-400/10 px-2 md:px-3 py-1 rounded-full border border-violet-400/20">{results.length} MATCHES</span>
            </div>
            
            <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto overflow-x-hidden">
              {results.map((item) => (
                <div key={item.id} className="p-4 md:p-6 lg:p-8 hover:bg-white/[0.03] transition-all group cursor-default">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 md:gap-6 w-full min-w-0">
                      <div className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 rounded-xl md:rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:border-violet-500/30 transition-colors shadow-inner">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1">
                          <h4 className="text-sm md:text-lg font-black text-white italic tracking-tight uppercase truncate">{item.customerName}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-widest border whitespace-nowrap ${CATEGORY_COLORS[item.category] || 'border-zinc-800'}`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap md:flex-row md:items-center gap-2 md:gap-6 text-[9px] md:text-xs font-bold text-zinc-500 tracking-wider">
                          <span className="flex items-center gap-1.5"><Hash className="w-3 md:w-3.5 h-3 md:h-3.5 text-zinc-700" /> {item.accountNumber}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 md:w-3.5 h-3 md:h-3.5 text-zinc-700" /> {item.receiveDate}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3 md:w-3.5 h-3 md:h-3.5 text-zinc-700" /> {item.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {item.isDelivered ? (
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 whitespace-nowrap">
                          DELIVERED
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-lg bg-violet-600/20 text-violet-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-violet-600/30 whitespace-nowrap">
                          PENDING
                        </div>
                      )}
                      <span className="text-[8px] md:text-[10px] text-zinc-600 font-bold uppercase">{item.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.length === 0 && (
                <div className="p-16 text-center">
                  <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-white mb-2 uppercase italic tracking-tighter">Zero Hits</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No matching registry records found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterSearch;
