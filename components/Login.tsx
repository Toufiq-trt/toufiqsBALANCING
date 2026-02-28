
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Loader2, ArrowLeft, ShieldCheck, CreditCard, BookOpen, Hash, Calculator, User as UserIcon } from 'lucide-react';
import { User, UserRole, InventoryCategory } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

interface ProfileOption {
  id: string;
  name: string;
  role: UserRole;
  category?: InventoryCategory;
  icon: React.ReactNode;
  color: string;
}

const PROFILES: ProfileOption[] = [
  { id: 'toufiq', name: 'TOUFIQ', role: 'super_admin', icon: <ShieldCheck className="w-12 h-12" />, color: 'from-violet-600 to-indigo-600' },
  { id: 'debit', name: 'DEBIT CARD', role: 'debit_admin', category: 'DEBIT CARD', icon: <CreditCard className="w-12 h-12" />, color: 'from-blue-600 to-cyan-600' },
  { id: 'cheque', name: 'CHEQUE BOOK', role: 'cheque_admin', category: 'CHEQUE BOOK', icon: <BookOpen className="w-12 h-12" />, color: 'from-emerald-600 to-teal-600' },
  { id: 'pin', name: 'PIN', role: 'pin_admin', category: 'PIN', icon: <Hash className="w-12 h-12" />, color: 'from-amber-600 to-orange-600' },
  { id: 'dps', name: 'DPS', role: 'dps_admin', category: 'DPS SLIP', icon: <Calculator className="w-12 h-12" />, color: 'from-fuchsia-600 to-pink-600' },
  { id: 'staff', name: 'STAFF', role: 'staff', icon: <UserIcon className="w-12 h-12" />, color: 'from-zinc-600 to-slate-600' },
];

const MASTER_SHEET_ID = '1h7Nmn8alVoWNE_vn3690-yWMvRcXs93_9VXONaAA4po';

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [selectedProfile, setSelectedProfile] = useState<ProfileOption | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sheetCredentials, setSheetCredentials] = useState<any[]>([]);
  
  // Reset flow states
  const [resetStatus, setResetStatus] = useState<'none' | 'pending' | 'approved' | 'resetting'>('none');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check reset status for selected profile
  useEffect(() => {
    if (!selectedProfile) {
      setResetStatus('none');
      return;
    }

    const checkResetStatus = () => {
      const requests = JSON.parse(localStorage.getItem('reset_requests') || '[]');
      const myRequest = requests.find((r: any) => r.username.toLowerCase() === selectedProfile.id.toLowerCase());
      
      if (myRequest) {
        if (myRequest.status === 'approved') setResetStatus('resetting'); // Automatically show form if approved
        else if (myRequest.status === 'pending') setResetStatus('pending');
        else if (myRequest.status === 'pending_authorization') setResetStatus('pending');
      } else {
        setResetStatus('none');
      }
    };

    checkResetStatus();
    const interval = setInterval(checkResetStatus, 3000);
    return () => clearInterval(interval);
  }, [selectedProfile]);

  const handleForgotPassword = () => {
    if (!selectedProfile) return;
    
    const requests = JSON.parse(localStorage.getItem('reset_requests') || '[]');
    const existing = requests.find((r: any) => r.username.toLowerCase() === selectedProfile.id.toLowerCase());
    
    if (existing) {
      if (existing.status === 'approved') {
        setResetStatus('resetting');
        return;
      }
      alert('A reset request is already pending. Please wait for TOUFIQ to approve it.');
      return;
    }

    const newRequest = {
      username: selectedProfile.id,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    localStorage.setItem('reset_requests', JSON.stringify([...requests, newRequest]));
    setResetStatus('pending');
    alert('PASSWORD RESET REQUESTED\n\nYour request has been logged. Please contact the System Creator (TOUFIQ) directly to verify your identity.');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!newPassword) {
      setError('Password cannot be empty');
      return;
    }

    // Check against old passwords history
    const oldOverrides = JSON.parse(localStorage.getItem('old_passwords_overrides') || '{}');
    const userOldPasswords = oldOverrides[selectedProfile?.id.toLowerCase() || ''] || [];
    if (userOldPasswords.includes(newPassword)) {
      setError('This password was used previously. Please choose a unique new password.');
      return;
    }

    const requests = JSON.parse(localStorage.getItem('reset_requests') || '[]');
    const updated = requests.map((r: any) => 
      r.username.toLowerCase() === selectedProfile?.id.toLowerCase() 
        ? { ...r, status: 'pending_authorization', newPassword } 
        : r
    );
    
    localStorage.setItem('reset_requests', JSON.stringify(updated));
    setResetStatus('pending');
    setNewPassword('');
    setConfirmPassword('');
    alert('New password submitted for authorization. Please wait for TOUFIQ to authorize it.');
  };

  // Fetch credentials from "admin" sheet
  useEffect(() => {
    const fetchCreds = async () => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=admin`;
        const response = await fetch(url);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.replace(/"/g, '').trim()));
        
        if (rows.length > 1) {
          const headers = rows[0].map(h => h.toLowerCase().replace(/\s/g, ''));
          const data = rows.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((h, i) => obj[h] = row[i]);
            return obj;
          });
          setSheetCredentials(data);
        }
      } catch (e) {
        console.error("Failed to load sheet credentials", e);
      }
    };
    fetchCreds();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setLoading(true);
    setError('');

    setTimeout(() => {
      const u = selectedProfile.id;
      // Check for old passwords first
      const oldOverrides = JSON.parse(localStorage.getItem('old_passwords_overrides') || '{}');
      const userOldPasswords = oldOverrides[u.toLowerCase()] || [];
      if (userOldPasswords.includes(password)) {
        setError('the password is old enter recent password');
        setLoading(false);
        return;
      }

      // Check local overrides first
      const overrides = JSON.parse(localStorage.getItem('user_overrides') || '{}');
      const localOverride = overrides[u.toLowerCase()];
      
      let isValid = false;
      if (localOverride) {
        isValid = password === localOverride;
      } else {
        // Find matching credential from sheet
        const cred = sheetCredentials.find(c => c.username && c.username.toLowerCase() === u);
        
        if (cred) {
          const currentPass = cred.newpassword || cred.password;
          isValid = password === currentPass;
        } else {
          // Fallback to hardcoded if sheet fails or not present
          const fallbackPass = u === 'toufiq' ? 'toufiq786' : `${u}123`;
          isValid = password === fallbackPass;
        }
      }

      if (isValid) {
        onLogin({
          username: u.toUpperCase(),
          fullName: selectedProfile.name === 'TOUFIQ' ? 'TOUFIQ (SYSTEM CREATOR)' : `${selectedProfile.name} MANAGER`,
          role: selectedProfile.role,
          allowedCategory: selectedProfile.category
        });
      } else {
        setError('ACCESS DENIED: INCORRECT SECURITY KEY');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#000] flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#8b5cf6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {!selectedProfile ? (
        <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-4">Who is accessing the system?</h1>
            <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">Select your administrative cluster to proceed</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-12">
            {PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className="group flex flex-col items-center gap-2 md:gap-4 transition-all duration-300"
              >
                <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl md:rounded-3xl bg-gradient-to-br ${profile.color} p-1 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-white/20 overflow-hidden`}>
                   <div className="w-full h-full bg-[#141414] rounded-xl md:rounded-[1.4rem] flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors relative">
                      {profile.icon}
                   </div>
                </div>
                <span className="text-[10px] md:text-base font-black text-zinc-500 group-hover:text-white uppercase tracking-widest transition-colors italic">
                  {profile.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-12 md:mt-20 text-center">
            <button 
              onClick={onBack}
              className="px-8 py-3 md:px-10 md:py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all text-[10px] md:text-xs font-black uppercase tracking-[0.3em] rounded-xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-500">
          <button 
            onClick={() => { setSelectedProfile(null); setError(''); setPassword(''); }}
            className="mb-8 flex items-center gap-3 text-zinc-600 hover:text-white transition-colors group text-[10px] font-black uppercase tracking-[0.4em]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Switch Profile
          </button>

          <div className="glass rounded-[2rem] md:rounded-[3rem] overflow-hidden border-white/5 shadow-[0_0_100px_rgba(139,92,246,0.2)]">
            <div className={`p-8 md:p-10 bg-gradient-to-br ${selectedProfile.color} bg-opacity-10 relative`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white mb-6 relative overflow-hidden">
                   <div className={`absolute inset-0 bg-gradient-to-br ${selectedProfile.color} opacity-20`}></div>
                   {selectedProfile.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {selectedProfile.name} ACCESS
                </h2>
                <p className="text-[9px] font-black text-violet-500 uppercase tracking-[0.4em] mt-3 italic">
                  Credentials fetched from Master Node
                </p>
              </div>
            </div>

            <form onSubmit={resetStatus === 'resetting' ? handleResetSubmit : handleSubmit} className="p-8 md:p-10 space-y-6">
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center flex items-center justify-center gap-2 animate-shake">
                  {error}
                </div>
              )}
              
              {resetStatus === 'resetting' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2">New Password</label>
                    <input 
                      type="password"
                      required
                      autoFocus
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 md:py-5 text-white font-mono text-lg outline-none focus:border-violet-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 md:py-5 text-white font-mono text-lg outline-none focus:border-violet-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-5 md:py-6 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl"
                  >
                    Save New Password
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Security Key</label>
                        {selectedProfile.id !== 'toufiq' && (
                          <button 
                            type="button"
                            onClick={handleForgotPassword}
                            className={`text-[9px] font-black uppercase tracking-widest transition-colors italic ${
                              resetStatus === 'approved' ? 'text-emerald-500 hover:text-emerald-400' :
                              resetStatus === 'pending' ? 'text-amber-500 cursor-not-allowed' :
                              'text-violet-500 hover:text-violet-400'
                            }`}
                          >
                            {resetStatus === 'approved' ? 'Reset Password Now' : 
                             resetStatus === 'pending' ? 'Request Pending...' : 
                             'Forgot Password?'}
                          </button>
                        )}
                      </div>
                      <input 
                        type="password"
                        required
                        autoFocus
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 md:py-5 text-white font-mono text-lg outline-none focus:border-violet-500/50 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-5 md:py-6 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-500 transition-all uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Execute Login'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
