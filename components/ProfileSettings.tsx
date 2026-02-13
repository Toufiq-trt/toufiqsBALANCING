
import React, { useState, useRef } from 'react';
import { User, Shield, Camera, Trash2, Save, Key, UserCircle, X } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileSettingsProps {
  user: UserType;
  onUpdate: (updates: Partial<UserType>) => void;
  onClose?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate, onClose }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(user.profilePicture || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<UserType> = { fullName, profilePicture: profilePic };
    if (password) updates.password = password;
    onUpdate(updates);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Shield className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Profile Core Settings</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Update administrative credentials</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-rose-500/50 transition-all group shadow-xl"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">Exit Profile</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl text-center">
            Credentials Synchronized Successfully
          </div>
        )}

        <div className="flex flex-col items-center gap-6 pb-8 border-b border-white/5">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2rem] bg-zinc-900 border-2 border-zinc-800 overflow-hidden flex items-center justify-center text-zinc-600 shadow-2xl group-hover:border-violet-500/30 transition-colors">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-16 h-16" />
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-3 bg-violet-600 text-white rounded-xl shadow-lg hover:bg-violet-500 transition-all hover:scale-110 active:scale-95"
            >
              <Camera className="w-4 h-4" />
            </button>
            {profilePic && (
              <button 
                type="button"
                onClick={() => setProfilePic('')}
                className="absolute -top-2 -right-2 p-2 bg-rose-600/80 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-all hover:scale-110"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Identity Avatar</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Full Administrative Name
            </label>
            <input 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-violet-500/50 transition-colors"
              placeholder="Enter full name..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
              <Key className="w-3 h-3" /> Access Credentials (Password)
            </label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-mono outline-none focus:border-violet-500/50 transition-colors"
              placeholder="Leave blank to keep current..."
            />
          </div>
        </div>

        <button type="submit" className="w-full py-5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl hover:shadow-violet-600/20">
          <Save className="w-4 h-4" /> Save System Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
