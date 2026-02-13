
import React from 'react';
// Changed import from non-existent InventoryStats to CategoryStats
import { CategoryStats } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { TrendingUp, CheckCircle2, Package, ArrowUpRight } from 'lucide-react';

interface DashboardStatsProps {
  stats: CategoryStats[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.category} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
          {/* Use defined colors with fallback for 'TOTAL' or unknown categories */}
          <div className={`h-2 ${CATEGORY_COLORS[stat.category] || 'bg-slate-900'}`} />
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-600">{stat.category}</h3>
              <div className={`p-2 rounded-lg ${CATEGORY_COLORS[stat.category] || 'bg-slate-900'} bg-opacity-10`}>
                <Package className={`w-5 h-5 ${(CATEGORY_COLORS[stat.category] || 'bg-slate-900').replace('bg-', 'text-')}`} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Remaining Balance</p>
                  {/* Updated remainingBalance to balance from CategoryStats */}
                  <p className="text-3xl font-bold text-slate-900">{stat.balance}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Delivered</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {/* Updated totalDelivered to delivered from CategoryStats */}
                    <span className="font-semibold text-slate-700">{stat.delivered}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Input</p>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-blue-500" />
                    {/* Updated totalActive + totalDelivered calculation to received from CategoryStats */}
                    <span className="font-semibold text-slate-700">{stat.received}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
