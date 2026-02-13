
import React from 'react';
import { LayoutDashboard, Database, Archive, ShieldCheck, LogOut, ChevronRight, Key } from 'lucide-react';
import { InventoryCategory } from '../types';
import { CATEGORIES } from '../constants';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isAdmin, onLogout }) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-[#0e4b61] p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight italic">SecureVault</h1>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPath === 'dashboard' ? 'bg-[#0e4b61] text-white' : 'hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-bold italic">Dashboard</span>
        </button>

        {/* ONLY SHOWN TO LOGGED IN ADMINS */}
        {isAdmin ? (
          <>
            <div className="mt-6">
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Management</p>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onNavigate(`inventory-${cat}`)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    currentPath === `inventory-${cat}` ? 'bg-slate-800 text-white border-l-4 border-[#0e4b61]' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 opacity-70" />
                    <span>{cat}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${currentPath === `inventory-${cat}` ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System</p>
              <button
                onClick={() => onNavigate('archive')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath === 'archive' ? 'bg-[#0e4b61] text-white' : 'hover:bg-slate-800'
                }`}
              >
                <Archive className="w-5 h-5" />
                <span className="font-medium">Delivered Archive</span>
              </button>

              <button
                onClick={() => onNavigate('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mt-1 transition-colors ${
                  currentPath === 'admin' ? 'bg-[#0e4b61] text-white' : 'hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium">Data Entry Portal</span>
              </button>
            </div>
          </>
        ) : (
          <div className="mt-10 px-4">
             <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Admin Access</p>
                <button 
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-2 text-xs text-[#0e4b61] font-black hover:text-[#1a6b8a] transition-colors bg-white/10 px-3 py-2 rounded-lg w-full justify-center"
                >
                  <Key className="w-3.5 h-3.5" />
                  GO TO ADMIN PANEL
                </button>
             </div>
          </div>
        )}
      </nav>

      {isAdmin && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      )}
      
      <div className="p-4 text-center">
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[3px]">Enterprise Vault v2.5</p>
      </div>
    </div>
  );
};

export default Sidebar;
