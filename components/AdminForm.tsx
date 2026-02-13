
import React, { useState } from 'react';
import { InventoryCategory } from '../types';
import { CATEGORIES } from '../constants';
import { Save, User, Phone, MapPin, Hash, Calendar, Zap, AlertCircle } from 'lucide-react';

interface AdminFormProps {
  onSubmit: (data: {
    accountNumber: string;
    customerName: string;
    phoneNumber: string;
    address: string;
    receiveDate: string;
    category: InventoryCategory;
  }) => void;
}

const AdminForm: React.FC<AdminFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    accountNumber: '',
    customerName: '',
    phoneNumber: '',
    address: '',
    receiveDate: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0]
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setIsSuccess(true);
    setFormData({
      accountNumber: '',
      customerName: '',
      phoneNumber: '',
      address: '',
      receiveDate: new Date().toISOString().split('T')[0],
      category: formData.category
    });
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto glass rounded-[3rem] overflow-hidden shadow-2xl animate-slide-up">
      <div className="p-12 border-b border-white/5 bg-white/[0.01] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[100px] -mr-20 -mt-20"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-[1.4rem] bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-2xl shadow-violet-500/10">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">Data Entry Hub</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Initialize Secure Registry Protocol</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-10 relative z-10">
        {isSuccess && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] rounded-2xl text-center animate-bounce">
            Asset Successfully Synchronized to Registry
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <Hash className="w-3.5 h-3.5" /> Registry ID
            </label>
            <input
              type="text"
              required
              value={formData.accountNumber}
              onChange={e => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="000-000-000"
              className="w-full px-8 py-5 bg-zinc-900 border-2 border-zinc-800 rounded-3xl outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all font-mono text-white text-lg placeholder:text-zinc-700 shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <User className="w-3.5 h-3.5" /> Identity Profile
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Entity Name"
              className="w-full px-8 py-5 bg-zinc-900 border-2 border-zinc-800 rounded-3xl outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all font-bold text-white text-lg placeholder:text-zinc-700 shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <Phone className="w-3.5 h-3.5" /> Secure Channel
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+00 0000 000"
              className="w-full px-8 py-5 bg-zinc-900 border-2 border-zinc-800 rounded-3xl outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all font-bold text-white text-lg placeholder:text-zinc-700 shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <Calendar className="w-3.5 h-3.5" /> Reception Epoch
            </label>
            <input
              type="date"
              required
              value={formData.receiveDate}
              onChange={e => setFormData(prev => ({ ...prev, receiveDate: e.target.value }))}
              className="w-full px-8 py-5 bg-zinc-900 border-2 border-zinc-800 rounded-3xl outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all font-bold text-white text-lg [color-scheme:dark] shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Asset Classification</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                  formData.category === cat 
                    ? 'bg-violet-500 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
            <MapPin className="w-3.5 h-3.5" /> Physical Coordinates
          </label>
          <textarea
            required
            value={formData.address}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Operational Site Address..."
            rows={4}
            className="w-full px-8 py-6 bg-zinc-900 border-2 border-zinc-800 rounded-[2rem] outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all font-medium italic text-white text-lg placeholder:text-zinc-700 shadow-inner resize-none"
          />
        </div>

        <div className="pt-8">
          <button
            type="submit"
            className="w-full py-6 bg-violet-600 text-white font-black rounded-[2rem] hover:bg-violet-500 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-violet-900/40 uppercase tracking-[0.2em] text-xs"
          >
            <Save className="w-5 h-5" />
            Synchronize Asset Data
          </button>
          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            <AlertCircle className="w-3 h-3" /> Encrypted Endpoint Transmission
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;
