
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
  Facebook,
  Trash2
} from 'lucide-react';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center bg-zinc-900/80 border border-white/5 px-2 md:px-6 py-1 md:py-2 rounded-lg md:rounded-2xl backdrop-blur-md">
      <div className="text-white font-black text-[10px] md:text-2xl tracking-[0.1em] md:tracking-[0.2em] italic leading-none">
        <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
        </span>
      </div>
      <div className="text-[6px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.4em] mt-0.5">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { items, addItem, syncFromGoogleSheet, updateItem, deliverItem, trashItem, restoreItem, deleteItemPermanently, getFullStats, isInitializing, lastUpdate } = useInventoryStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('sv_user', JSON.stringify(authenticatedUser));
    setCurrentPath('master-data'); 
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
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
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (isInitializing) {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black px-6 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-violet-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-white text-lg md:text-2xl font-black uppercase italic tracking-tighter mb-2">WELCOME TO TOUFIQS GALLERY</h2>
          <p className="text-zinc-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] animate-pulse">অনুগ্রহ করে অপেক্ষা করুন</p>
        </div>
      );
    }

    if (currentPath === 'login' && !user) {
      return <Login onLogin={handleLoginSuccess} onBack={() => setCurrentPath('dashboard')} />;
    }

    const activeItems = items.filter(i => !i.isTrashed);

    if (!user && currentPath === 'dashboard') {
      const stats = getFullStats();
      return (
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-12 pb-24 px-2 md:px-0">
          <MasterSearch items={activeItems} />
          <DigitalStatsBoard stats={stats} lastUpdate={lastUpdate} />
          <DashboardGrid stats={stats} />
        </div>
      );
    }

    if (user) {
      if (currentPath === 'master-data') return <MasterDataView items={activeItems} user={user} />;
      if (currentPath === 'settings') return <ProfileSettings user={user} onUpdate={(u) => setUser({...user, ...u})} onClose={() => setCurrentPath('master-data')} />;
      
      if (currentPath === 'trash') {
        return (
          <InventoryTable 
            title="TRASH BIN" 
            category="DEBIT CARD" 
            items={items.filter(i => i.isTrashed)} 
            allStoredItems={items}
            onDelete={deleteItemPermanently} 
            onRestore={restoreItem}
            user={user}
            isTrashBin
          />
        );
      }

      if (currentPath === 'archive') {
        return <InventoryTable title="DELIVERED" category="DEBIT CARD" items={activeItems.filter(i => i.isDelivered)} allStoredItems={items} isArchive onDelete={trashItem} user={user} />;
      }

      if (currentPath.startsWith('inventory-')) {
        const category = currentPath.replace('inventory-', '') as InventoryCategory;
        const filteredItems = activeItems.filter(i => i.category === category && !i.isDelivered);
        const canEdit = user.role === 'super_admin' || user.allowedCategory === category;
        
        return (
          <InventoryTable 
            title={`${category}`} 
            category={category} 
            items={filteredItems} 
            allStoredItems={items}
            onDeliver={canEdit ? deliverItem : undefined} 
            onDelete={canEdit ? trashItem : undefined}
            onAdd={canEdit ? addItem : undefined} 
            onUpdate={canEdit ? updateItem : undefined}
            onSyncSheet={canEdit ? syncFromGoogleSheet : undefined} 
            user={user} 
            readOnly={!canEdit}
          />
        );
      }
    }
    
    return <DashboardGrid stats={getFullStats()} />;
  };

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-violet-500/30 overflow-x-hidden flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 md:h-24 glass border-b border-white/5 z-[60] px-3 md:px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-zinc-400 border border-white/5 ${!user ? 'hidden' : ''}`}
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-1.5 md:gap-4">
            <div 
              className="flex items-center gap-1.5 md:gap-4 cursor-pointer" 
              onClick={() => !user && setCurrentPath('dashboard')}
            >
              <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-[8px] md:text-xl font-black tracking-tighter text-white uppercase italic leading-none">TOUFIQ'S</h1>
                <p className="text-[6px] md:text-xs font-black text-violet-400 uppercase tracking-widest mt-0.5 md:mt-1 leading-none">BALANCING</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <DigitalClock />
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Facebook Button - High Visibility for Mobile & Desktop */}
          <a 
            href="https://www.facebook.com/md.toufiqulislam.712" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 md:p-4 bg-blue-600/10 border border-blue-600/20 text-blue-500 rounded-xl md:rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center"
            title="Connect with Toufiq"
          >
            <Facebook className="w-3.5 h-3.5 md:w-6 md:h-6" />
          </a>

          {user ? (
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1 bg-zinc-900 border border-white/5 rounded-xl hover:border-violet-500/50 transition-all">
                <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 overflow-hidden shrink-0">
                  {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : <UserIcon className="w-3.5 h-3.5 md:w-6 md:h-6" />}
                </div>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-40 md:w-56 glass border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in">
                  <button onClick={() => { setCurrentPath('settings'); setShowProfileMenu(false); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                    <Settings className="w-3.5 h-3.5" /> Profile
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setCurrentPath('login')} className="px-2 py-1.5 md:px-8 md:py-4 bg-white text-black text-[7px] md:text-xs font-black rounded-lg md:rounded-2xl hover:scale-105 transition-all uppercase tracking-widest shadow-xl">
              Login
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-16 md:pt-24">
        {user && isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="w-[80%] max-w-[280px] lg:w-72 glass border-r border-white/5 h-full fixed left-0 top-0 lg:top-24 z-50 p-5 space-y-6 animate-in slide-in-from-left duration-300">
              <div className="lg:hidden flex items-center justify-between mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-1">
                <p className="px-4 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Infrastructure</p>
                <button onClick={() => { setCurrentPath('master-data'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${currentPath === 'master-data' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5'}`}>
                  <Layers className="w-3.5 h-3.5" /> MASTER DATA
                </button>
                <button onClick={() => { setCurrentPath('archive'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${currentPath === 'archive' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5'}`}>
                  <Archive className="w-3.5 h-3.5" /> DELIVERED
                </button>
              </div>

              <div className="space-y-1">
                <p className="px-4 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Clusters</p>
                {(['DEBIT CARD', 'CHEQUE BOOK', 'DPS SLIP', 'PIN'] as InventoryCategory[]).map(cat => (
                  <button key={cat} onClick={() => { setCurrentPath(`inventory-${cat}`); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${currentPath === `inventory-${cat}` ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:bg-white/5'}`}>
                    <span className="flex items-center gap-3 text-left"><Activity className="w-3.5 h-3.5" /> {cat}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                <button onClick={() => { setCurrentPath('trash'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${currentPath === 'trash' ? 'bg-rose-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5'}`}>
                  <Trash2 className="w-3.5 h-3.5" /> TRASH BIN
                </button>
              </div>
            </aside>
          </>
        )}

        <main className={`flex-1 p-2 md:p-10 transition-all duration-300 ${user && isSidebarOpen ? 'lg:ml-72' : 'w-full'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
