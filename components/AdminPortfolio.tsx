
import React, { useState, useEffect } from 'react';
import { Shield, Key, User, Clock, CheckCircle, XCircle, AlertCircle, Lock, History, UserCheck } from 'lucide-react';

interface ResetRequest {
  username: string;
  status: 'pending' | 'approved' | 'pending_authorization' | 'completed';
  requestedAt: string;
  newPassword?: string;
}

const AdminPortfolio: React.FC = () => {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [oldPasswords, setOldPasswords] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadData = () => {
      const savedRequests = JSON.parse(localStorage.getItem('reset_requests') || '[]');
      const savedOverrides = JSON.parse(localStorage.getItem('user_overrides') || '{}');
      const savedOldPasswords = JSON.parse(localStorage.getItem('old_passwords_overrides') || '{}');
      
      setRequests(savedRequests);
      setOverrides(savedOverrides);
      setOldPasswords(savedOldPasswords);
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (username: string) => {
    const updated = requests.map(r => 
      r.username === username && r.status === 'pending' 
        ? { ...r, status: 'approved' as const } 
        : r
    );
    localStorage.setItem('reset_requests', JSON.stringify(updated));
    setRequests(updated);
  };

  const handleAuthorize = (username: string) => {
    const request = requests.find(r => r.username === username && r.status === 'pending_authorization');
    if (!request || !request.newPassword) return;

    const userKey = username.toLowerCase();
    const currentPass = overrides[userKey] || (userKey === 'toufiq' ? 'toufiq786' : `${userKey}123`);

    // Update old passwords history
    const updatedOldPasswords = { ...oldPasswords };
    if (!updatedOldPasswords[userKey]) updatedOldPasswords[userKey] = [];
    if (!updatedOldPasswords[userKey].includes(currentPass)) {
      updatedOldPasswords[userKey].push(currentPass);
    }
    localStorage.setItem('old_passwords_overrides', JSON.stringify(updatedOldPasswords));
    setOldPasswords(updatedOldPasswords);

    // Update overrides
    const updatedOverrides = { ...overrides, [userKey]: request.newPassword };
    localStorage.setItem('user_overrides', JSON.stringify(updatedOverrides));
    setOverrides(updatedOverrides);

    // Remove request
    const updatedRequests = requests.filter(r => r.username !== username);
    localStorage.setItem('reset_requests', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);

    alert(`Password for ${username} has been authorized and updated.`);
  };

  const handleReject = (username: string) => {
    const updated = requests.filter(r => r.username !== username);
    localStorage.setItem('reset_requests', JSON.stringify(updated));
    setRequests(updated);
  };

  const admins = ['DEBIT CARD', 'CHEQUE BOOK', 'PIN', 'DPS SLIP', 'STAFF'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Admin Portfolio</h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">System-wide administrative oversight</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Admin Status Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-violet-500" /> Administrative Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map(admin => {
                const username = admin.toLowerCase().replace(' ', '');
                const currentPass = overrides[username] || (username === 'toufiq' ? 'toufiq786' : `${username}123`);
                const oldPasses = oldPasswords[username] || [];

                return (
                  <div key={admin} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{admin}</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Current Password</p>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-violet-500" />
                        <span className="text-white font-mono text-sm">{currentPass}</span>
                      </div>
                    </div>
                    {oldPasses.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                          <History className="w-3 h-3" /> History
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {oldPasses.map((p, i) => (
                            <span key={i} className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reset Requests */}
        <div className="space-y-6">
          <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl h-full">
            <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Reset Requests
            </h3>
            
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req, idx) => (
                  <div key={idx} className="bg-zinc-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-500">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{req.username}</p>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-2 h-2" /> {new Date(req.requestedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                        req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        req.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(req.username)}
                          className="flex-1 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all"
                        >
                          Approve Reset
                        </button>
                        <button 
                          onClick={() => handleReject(req.username)}
                          className="p-2 bg-zinc-800 text-zinc-500 hover:text-rose-500 rounded-xl transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {req.status === 'pending_authorization' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Proposed Password</p>
                          <p className="text-sm font-mono text-white">{req.newPassword}</p>
                        </div>
                        <button 
                          onClick={() => handleAuthorize(req.username)}
                          className="w-full py-2 bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20"
                        >
                          Authorize & Set
                        </button>
                      </div>
                    )}

                    {req.status === 'approved' && (
                      <p className="text-[9px] font-bold text-zinc-500 italic text-center">Waiting for admin to set new password...</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortfolio;
