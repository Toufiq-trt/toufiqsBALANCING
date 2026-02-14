import React from 'react';
import { CategoryStats } from '../types';
import { CATEGORIES } from '../constants';
import { Zap, LayoutDashboard, CheckCircle2, Package, Clock, ShieldCheck, Activity } from 'lucide-react';

interface DigitalStatsBoardProps {
  stats: CategoryStats[];
  lastUpdate?: Record<string, string>;
}

const DigitalStatsBoard: React.FC<DigitalStatsBoardProps> = ({ stats, lastUpdate = {} }) => {
  const total = stats.find(s => s.category === 'TOTAL');

  return (
    <div className="w-full animate-slide-up stagger-1">
      <div className="glass rounded-[1.2rem] md:rounded-[3rem] border-white/5 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="p-4 md:p-12 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent">
          {/* Header Area */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-12">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_25px_rgba(139,92,246,0.4)] shrink-0">
                <LayoutDashboard className="w-4 h-4 md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className="text-sm md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">ITEMS HISTORY</h2>
                <p className="text-[7px] md:text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mt-1 italic">SECURE INVENTORY LIFECYCLE</p>
              </div>
            </div>

            {/* Redesigned Sync Matrix - Professional & Organized */}
            <div className="bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-5 flex-1 max-w-2xl">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Activity className="w-3 h-3 text-violet-500 animate-pulse" />
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Last Entry</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {/* Master Segment */}
                {lastUpdate['MASTER'] && (
                  <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all">
                    <span className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase tracking-wider">MASTER GATE</span>
                    <span className="text-[7px] md:text-[9px] font-mono text-violet-400">{lastUpdate['MASTER']}</span>
                  </div>
                )}
                
                {/* Dynamic Category Segments */}
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all">
                    <span className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase tracking-wider">{cat}</span>
                    <span className="text-[7px] md:text-[9px] font-mono text-violet-400">
                      {lastUpdate[cat] || "AWAITING SYNC..."}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-16 items-center">
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-4 flex items-center gap-1.5">
                <Package className="w-2.5 h-2.5 md:w-4 md:h-4 text-zinc-700" /> <span className="truncate">RECEIVED</span>
              </span>
              <span className="text-xl md:text-7xl font-black text-white/90 tabular-nums italic tracking-tighter">
                {total?.received || 0}
              </span>
            </div>
            
            <div className="flex flex-col border-l border-white/5 pl-3 md:pl-16">
              <span className="text-[7px] md:text-[11px] font-black text-emerald-600/80 uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5 md:w-4 md:h-4" /> <span className="truncate">DELIVERED</span>
              </span>
              <span className="text-xl md:text-7xl font-black text-emerald-400/90 tabular-nums italic tracking-tighter">
                {total?.delivered || 0}
              </span>
            </div>

            <div className="flex flex-col border-l border-white/5 pl-3 md:pl-16 relative">
              <div className="absolute -inset-4 md:-inset-12 bg-violet-500/10 blur-[20px] md:blur-[60px] rounded-full pointer-events-none"></div>
              
              <span className="text-[7px] md:text-[12px] font-black text-violet-400 uppercase tracking-[0.2em] md:tracking-[0.5em] mb-1 md:mb-4 flex items-center gap-1.5 relative z-10">
                <Zap className="w-2.5 h-2.5 md:w-6 md:h-6 animate-pulse" /> <span className="truncate">REMAINING</span>
              </span>
              <span className="text-3xl md:text-9xl font-black text-violet-400 tabular-nums italic drop-shadow-[0_0_20px_rgba(167,139,250,0.7)] animate-pulse tracking-tighter relative z-10 leading-none">
                {total?.balance || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalStatsBoard;