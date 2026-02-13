
import React, { useState, useEffect } from 'react';
import DashboardGrid from './components/DashboardGrid';
import MasterSearch from './components/MasterSearch';
import InventoryTable from './components/InventoryTable';
import MasterDataView from './components/MasterDataView';
import ProfileSettings from './components/ProfileSettings';
import DigitalStatsBoard from './components/DigitalStatsBoard';
import Login from './components/Login';
import { useInventoryStore } from './store';
import { InventoryCategory, User } from './types';
import { 
  ShieldCheck, 
  Archive, 
  Activity,
  Layers,
  Menu,
  X,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Loader2
} from 'lucide-react';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center bg-zinc-900/50 border border-white/5 px-4 md:px-6 py-1 md:py-2 rounded-xl md:rounded-2xl backdrop-blur-md">
      <div className="text-white font-black text-lg md:text-2xl tracking-[0.2em] italic leading-none">
        <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
        </span>
      </div>
      <div className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-0.5">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
      </div>
    </div>
  );
};

// Restored individual cluster IDs
const SHEET_CONFIG: Record<InventoryCategory, { id: string }> = {
  'DEBIT CARD': { id: '1e_22aHpRoJYBe9J0ohT-PzwHmXGhrOtNlsQeOVHg67M' },
  'CHEQUE BOOK': { id: '1cakIYc79gR-YVnqKe4-i8J95AEuIKa4Q' },
  'DPS SLIP': { id: '1Ah7wHvJDbzAF9VUJLlBs6YHKfInY6ZWeXlmyZtlUj9Q' },
  'PIN': { id: '1voTnPN_6crhBoev-5mLg9pLRMREWp7alpMNM8SwhL6k' }
};

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { items, addItem, syncFromGoogleSheet, updateItem, deliverItem, deleteItem, getFullStats, isInitializing } = useInventoryStore();

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('sv_user', JSON.stringify(authenticatedUser));
    setCurrentPath('master-data'); 
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('sv_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sv_user');
    setCurrentPath('dashboard');
    setShowProfileMenu(false);
  };

  const renderContent = () => {
    if (isInitializing) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-pulse">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em]">Synchronizing Master Registry...</p>
        </div>
      );
    }

    if (currentPath === 'login' && !user) {
      return <Login onLogin={handleLoginSuccess} onBack={() => setCurrentPath('dashboard')} />;
    }

    if (!user && currentPath === 'dashboard') {
      const stats = getFullStats();
      return (
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-24">
          <MasterSearch items={items} />
          <DigitalStatsBoard stats={stats} />
          <DashboardGrid stats={stats} />
        </div>
      );
    }

    if (user) {
      if (currentPath === 'master-data') return <MasterDataView items={items} user={user} />;
      if (currentPath === 'settings') return <ProfileSettings user={user} onUpdate={(u) => setUser({...user, ...u})} onClose={() => setCurrentPath('master-data')} />;
      if (currentPath === 'archive') {
        return <InventoryTable title="DELIVERED ITEMS" category="DEBIT CARD" items={items.filter(i => i.isDelivered)} allStoredItems={items} isArchive onDelete={user.role === 'super_admin' ? deleteItem : undefined} user={user} />;
      }
      if (currentPath.startsWith('inventory-')) {
        const category = currentPath.replace('inventory-', '') as InventoryCategory;
        const filteredItems = items.filter(i => i.category === category && !i.isDelivered);
        const canEdit = user.role === 'super_admin' || user.allowedCategory === category;
        return (
          <InventoryTable 
            title={`${category} REGISTRY`} category={category} items={filteredItems} allStoredItems={items}
            onDeliver={canEdit ? deliverItem : undefined} onDelete={canEdit ? deleteItem : undefined}
            onAdd={canEdit ? addItem : undefined} onUpdate={canEdit ? updateItem : undefined}
            onSyncSheet={canEdit ? syncFromGoogleSheet : undefined} user={user} readOnly={!canEdit}
          />
        );
      }
      return <MasterDataView items={items} user={user} />;
    }
    
    return <DashboardGrid stats={getFullStats()} />;
  };

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-violet-500/30">
      <header className="fixed top-0 left-0 right-0 h-16 md:h-24 glass border-b border-white/5 z-[60] px-4 md:px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-zinc-400 border border-white/5 ${!user ? 'hidden' : ''}`}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 md:gap-4 cursor-pointer" onClick={() => !user && setCurrentPath('dashboard')}>
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-xl font-black tracking-tighter text-white uppercase italic leading-none">TOUFIQ'S</h1>
              <p className="text-[7px] md:text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mt-1 leading-none">BALANCING SYSTEM</p>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:block">
          <DigitalClock />
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 md:pl-4 bg-zinc-900 border border-white/5 rounded-xl md:rounded-2xl hover:border-violet-500/50 transition-all">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] md:text-[10px] font-black text-white uppercase italic tracking-widest leading-none">{user.fullName}</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 overflow-hidden">
                  {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-48 md:w-56 glass border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl p-2 animate-in fade-in zoom-in">
                  <button onClick={() => { setCurrentPath('settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                    <Settings className="w-4 h-4" /> Profile Settings
                  </button>
                  <div className="h-px bg-white/5 my-2" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setCurrentPath('login')} className="px-4 py-2 md:px-8 md:py-3 bg-white text-black text-[9px] md:text-[11px] font-black rounded-lg md:rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest shadow-xl">
              Admin Portal
            </button>
          )}
        </div>
      </header>

      <div className="flex pt-16 md:pt-24">
        {user && isSidebarOpen && (
          <aside className="w-64 md:w-72 glass border-r border-white/5 h-[calc(100vh-64px)] md:h-[calc(100vh-96px)] fixed left-0 top-16 md:top-24 z-50 p-4 md:p-6 space-y-6 md:space-y-8 animate-in slide-in-from-left">
            <div className="space-y-2">
              <p className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 md:mb-4">Infrastructure</p>
              <button onClick={() => { setCurrentPath('master-data'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all text-[10px] md:text-[11px] font-black uppercase tracking-widest ${currentPath === 'master-data' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
                <Layers className="w-4 h-4 md:w-5 md:h-5" /> MASTER DATA
              </button>
              <button onClick={() => { setCurrentPath('archive'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all text-[10px] md:text-[11px] font-black uppercase tracking-widest ${currentPath === 'archive' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
                <Archive className="w-4 h-4 md:w-5 md:h-5" /> DELIVERED
              </button>
            </div>
            <div className="space-y-2">
              <p className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 md:mb-4">Clusters</p>
              {(['DEBIT CARD', 'CHEQUE BOOK', 'DPS SLIP', 'PIN'] as InventoryCategory[]).map(cat => (
                <button key={cat} onClick={() => { setCurrentPath(`inventory-${cat}`); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all text-[10px] md:text-[11px] font-black uppercase tracking-widest ${currentPath === `inventory-${cat}` ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:bg-white/5'}`}>
                  <span className="flex items-center gap-4"><Activity className="w-4 h-4" /> {cat}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className={`flex-1 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-96px)] p-4 md:p-10 transition-all duration-300 ${user && isSidebarOpen ? 'lg:ml-72' : 'w-full'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
