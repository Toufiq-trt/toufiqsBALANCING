import React from 'react';
import { CategoryStats } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { 
  Package, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

interface DashboardGridProps {
  stats: CategoryStats[];
}

const Sparkline = ({ color }: { color: string }) => (
  <svg className="w-16 md:w-24 h-8 md:h-12 overflow-visible">
    <path
      d="M0 40 Q 15 10, 30 35 T 60 15 T 90 25 T 120 5"
      fill="none"
      stroke={color}
      strokeWidth="2"
      className="opacity-50"
    >
      <animate 
        attributeName="stroke-dasharray" 
        from="0,150" 
        to="150,0" 
        dur="3s" 
        repeatCount="indefinite" 
      />
    </path>
  </svg>
);

const DashboardGrid: React.FC<DashboardGridProps> = ({ stats = [] }) => {
  const items = stats.filter(s => s.category !== 'TOTAL');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 px-1 md:p-0">
      {/* Categories Grid */}
      {items.map((stat, idx) => (
        <div 
          key={stat.category} 
          className={`group relative glass rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 bento-card animate-slide-up shadow-xl transition-all duration-500 hover:scale-[1.03] active:scale-95 overflow-hidden`}
          style={{ 
            animationDelay: `${(idx + 1) * 0.1}s`,
            borderColor: 'rgba(255,255,255,0.05)'
          }}
        >
          {/* Animated Glow Backdrop */}
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4 md:mb-10">
              <div className={`p-2 md:p-4 rounded-lg md:rounded-2xl border bg-black/40 shadow-2xl transition-transform duration-500 group-hover:rotate-[360deg] ${CATEGORY_COLORS[stat.category] || 'border-zinc-800'}`}>
                <Package className="w-3.5 h-3.5 md:w-6 md:h-6 animate-pulse" />
              </div>
              <Sparkline color={stat.balance > 0 ? '#a78bfa' : '#3f3f46'} />
            </div>
            
            <div className="space-y-0.5 md:space-y-1">
              <h3 className="text-zinc-500 text-[6px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 italic flex items-center gap-1.5 truncate">
                <Sparkles className="w-2 h-2 text-violet-500 shrink-0" />
                {stat.category}
              </h3>
              <div className="flex items-baseline gap-1.5 md:gap-3">
                <span className="text-2xl md:text-5xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {stat.balance}
                </span>
                <span className="text-[6px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-violet-400 transition-colors hidden sm:block">
                  In Branch
                </span>
              </div>
            </div>

            <div className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-white/5 flex justify-between items-center text-[6px] md:text-[10px] font-black">
              <div className="flex items-center gap-1 text-emerald-400 uppercase tracking-widest">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{stat.delivered} Delivered</span>
              </div>
              <div className="text-zinc-600 uppercase tracking-widest hidden sm:block">
                {stat.received} TOTAL
              </div>
            </div>
          </div>

          {/* Bottom Accent Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-30 blur-sm"></div>
        </div>
      ))}
    </div>
  );
};

export default DashboardGrid;