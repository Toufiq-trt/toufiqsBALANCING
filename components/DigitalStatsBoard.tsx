import React from 'react';
import { CategoryStats } from '../types';
import { Zap, LayoutDashboard, CheckCircle2, Package, Clock } from 'lucide-react';

interface DigitalStatsBoardProps {
  stats: CategoryStats[];
  lastUpdate?: string;
}

const DigitalStatsBoard: React.FC<DigitalStatsBoardProps> = ({ stats, lastUpdate }) => {
  const total = stats.find(s => s.category === 'TOTAL');

  return (
    <div className="w-full animate-slide-up stagger-1">
      <div className="glass rounded-[1.2rem] md:rounded-[3rem] border-white/5 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="p-4 md:p-12 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent">
          {/* Combined Header Area for maximum vertical space efficiency */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 md:mb-10">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
                <LayoutDashboard className="w-3.5 h-3.5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-xs md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">ITEMS HISTORY</h2>
                <p className="text-[6px] md:text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] md:tracking-[0.4em] mt-0.5 italic">INTO OUR CUSTODY</p>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center gap-1.5 md:gap-3 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full w-fit">
                <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-violet-400 shrink-0" />
                <p className="text-[6px] md:text-[9px] font-black text-white uppercase tracking-widest leading-none whitespace-nowrap">
                  LAST UPDATE : <span className="text-violet-400 ml-1">{lastUpdate}</span>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-16 items-center">
            <div className="flex flex-col">
              <span className="text-[6px] md:text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-4 flex items-center gap-1">
                <Package className="w-2 h-2 md:w-3.5 md:h-3.5 text-zinc-700" /> <span className="truncate">RECEIVED</span>
              </span>
              <span className="text-xl md:text-6xl font-black text-white/90 tabular-nums italic tracking-tighter">
                {total?.received || 0}
              </span>
            </div>
            
            <div className="flex flex-col border-l border-white/5 pl-2 md:pl-16">
              <span className="text-[6px] md:text-[11px] font-black text-emerald-600/80 uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-4 flex items-center gap-1">
                <CheckCircle2 className="w-2 h-2 md:w-3.5 md:h-3.5" /> <span className="truncate">DELIVERED</span>
              </span>
              <span className="text-xl md:text-6xl font-black text-emerald-400/90 tabular-nums italic tracking-tighter">
                {total?.delivered || 0}
              </span>
            </div>

            <div className="flex flex-col border-l border-white/5 pl-2 md:pl-16 relative">
              <div className="absolute -inset-2 md:-inset-8 bg-violet-500/10 blur-[15px] md:blur-[50px] rounded-full pointer-events-none"></div>
              
              <span className="text-[6px] md:text-[12px] font-black text-violet-400 uppercase tracking-[0.2em] md:tracking-[0.5em] mb-1 md:mb-4 flex items-center gap-1 relative z-10">
                <Zap className="w-2 h-2 md:w-5 md:h-5 animate-pulse" /> <span className="truncate">REMAINING</span>
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