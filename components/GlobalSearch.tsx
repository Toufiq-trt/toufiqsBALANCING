
import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Tag } from 'lucide-react';
import { InventoryItem } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface GlobalSearchProps {
  items: InventoryItem[];
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ items }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items.filter(item => 
      item.customerName.toLowerCase().includes(q) ||
      item.phoneNumber.includes(q) ||
      item.address.toLowerCase().includes(q) ||
      item.accountNumber.includes(q)
    );
  }, [items, query]);

  return (
    <div className="relative flex-1 max-w-2xl">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Name, Phone, Address or Account Number..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] max-h-[70vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h4 className="text-sm font-semibold text-slate-500 flex items-center justify-between">
              SEARCH RESULTS 
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">{results.length} found</span>
            </h4>
          </div>
          
          <div className="p-2">
            {results.length > 0 ? (
              results.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 rounded-xl cursor-default transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">{item.customerName}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span className="font-mono">{item.accountNumber}</span>
                        <span>•</span>
                        <span>{item.phoneNumber}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.address}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${CATEGORY_COLORS[item.category]}`}>
                        <Tag className="w-3 h-3" />
                        {item.category}
                      </span>
                      {item.isDelivered ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">Delivered</span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No matches found for "{query}"</p>
                <p className="text-slate-400 text-sm">Try a different name, phone, or address.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
