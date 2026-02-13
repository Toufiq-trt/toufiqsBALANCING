
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
        // Brief pause at the end before restarting
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
    <div className="w-full mt-12 mb-24 px-4 lg:px-0">
      {/* Floating Command Bar */}
      <div className={`max-w-3xl mx-auto glass rounded-3xl p-3 transition-all duration-500 relative z-30 ${isFocused ? 'ring-2 ring-violet-500/50 shadow-[0_0_60px_rgba(139,92,246,0.3)] border-violet-500/30' : ''}`}>
        <div className="flex items-center gap-5 px-6">
          <Search className={`w-6 h-6 transition-all duration-300 ${isFocused ? 'text-violet-400 scale-110' : 'text-zinc-500'}`} />
          <input 
            type="text" 
            value={query}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-14 bg-transparent border-none outline-none text-xl font-bold text-white placeholder:text-zinc-700 uppercase tracking-tight"
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* Results Dropdown Style */}
      {query && (
        <div className="max-w-3xl mx-auto mt-4 animate-in slide-in-from-top-4 duration-500">
          <div className="glass rounded-[2.5rem] border-white/10 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <div className="bg-zinc-900/80 px-8 py-5 border-b border-white/5 flex justify-between items-center backdrop-blur-xl">
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Core Search Results</span>
              <span className="text-[10px] font-black text-violet-400 bg-violet-400/10 px-3 py-1 rounded-full border border-violet-400/20">{results.length} UNITS DETECTED</span>
            </div>
            
            <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
              {results.map((item) => (
                <div key={item.id} className="p-8 hover:bg-white/[0.03] transition-all group cursor-default">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:border-violet-500/30 transition-colors shadow-inner">
                        <User className="w-6 h-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="text-lg font-black text-white italic tracking-tight uppercase">{item.customerName}</h4>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${CATEGORY_COLORS[item.category] || 'border-zinc-800'}`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-xs font-bold text-zinc-500 tracking-widest">
                          <span className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-zinc-700" /> {item.accountNumber}</span>
                          <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-zinc-700" /> RCV: {item.receiveDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-3">
                      <div className="flex items-center gap-3">
                        {item.isDelivered ? (
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                            Delivered: {item.deliveryDate}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-violet-600/20 text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] border border-violet-600/30">
                            In Branch
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-zinc-600 flex items-center gap-2 italic uppercase">
                        <MapPin className="w-3.5 h-3.5" /> {item.address}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.length === 0 && (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <Package className="w-10 h-10 text-zinc-800" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">Zero Density Detected</h3>
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No matching registry fingerprints found.</p>
                </div>
              )}
            </div>
            
            <div className="bg-zinc-900/80 px-8 py-4 border-t border-white/5 text-[10px] text-zinc-600 flex items-center gap-6 backdrop-blur-xl">
              <span className="flex items-center gap-2 font-black"><CornerDownLeft className="w-3.5 h-3.5" /> ACCESS DATA</span>
              <span className="flex items-center gap-2 uppercase font-black text-zinc-700 tracking-[0.3em] ml-auto">End-to-End Encryption Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterSearch;
