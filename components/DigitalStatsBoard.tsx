
import React from 'react';
import { CategoryStats } from '../types';
import { Zap, LayoutDashboard, CheckCircle2, Package } from 'lucide-react';

interface DigitalStatsBoardProps {
  stats: CategoryStats[];
}

const DigitalStatsBoard: React.FC<DigitalStatsBoardProps> = ({ stats }) => {
  const total = stats.find(s => s.category === 'TOTAL');

  return (
    <div className="w-full animate-slide-up stagger-1 px-2 md:px-4 lg:px-0">
      <div className="glass rounded-[2rem] md:rounded-[3rem] border-white/5 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="p-6 md:p-16 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent">
          <div className="flex items-center gap-4 mb-8 md:mb-16">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">CURRENT BALANCE</h2>
              <p className="text-[8px] md:text-[10px] font-black text-violet-500 uppercase tracking-[0.4em] mt-1.5 md:mt-2 italic">Real-time Financial Audit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 items-center">
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-2 md:mb-4 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-zinc-700" /> TOTAL RECEIVED
              </span>
              <span className="text-4xl md:text-6xl font-black text-white/90 tabular-nums italic tracking-tighter">
                {total?.received || 0}
              </span>
            </div>
            
            <div className="flex flex-col border-l-0 md:border-l border-white/5 md:pl-16">
              <span className="text-[9px] md:text-[11px] font-black text-emerald-600/80 uppercase tracking-[0.4em] mb-2 md:mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> TOTAL DELIVERED
              </span>
              <span className="text-4xl md:text-6xl font-black text-emerald-400/90 tabular-nums italic tracking-tighter">
                {total?.delivered || 0}
              </span>
            </div>

            <div className="flex flex-col border-l-0 md:border-l border-white/5 md:pl-16 relative">
              <div className="absolute -inset-4 md:-inset-8 bg-violet-500/10 blur-[30px] md:blur-[50px] rounded-full pointer-events-none"></div>
              
              <span className="text-[10px] md:text-[12px] font-black text-violet-400 uppercase tracking-[0.5em] mb-2 md:mb-4 flex items-center gap-2 relative z-10">
                <Zap className="w-4 h-4 md:w-5 md:h-5 animate-pulse" /> TOTAL REMAINING
              </span>
              <span className="text-5xl xs:text-6xl sm:text-7xl lg:text-9xl font-black text-violet-400 tabular-nums italic drop-shadow-[0_0_40px_rgba(167,139,250,0.7)] animate-pulse tracking-tighter relative z-10 leading-none">
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
