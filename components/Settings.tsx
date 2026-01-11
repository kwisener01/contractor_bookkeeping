
import React, { useState, useRef } from 'react';
import { ChevronLeft, Cloud, Database, X, Undo2, Plus, Tag, Building2, Image as ImageIcon, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_SHEET_URL, DEFAULT_CATEGORIES } from '../constants';
import { ContractorProfile } from '../types';

interface SettingsProps {
  sheetUrl: string;
  onUpdateUrl: (url: string) => void;
  unsyncedCount: number;
  onSyncAll: () => Promise<void>;
  categories: string[];
  onUpdateCategories: (cats: string[]) => void;
  contractorProfile: ContractorProfile;
  onUpdateProfile: (profile: ContractorProfile) => void;
  onTestConnection: () => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  sheetUrl, 
  onUpdateUrl, 
  unsyncedCount, 
  onSyncAll,
  categories,
  onUpdateCategories,
  contractorProfile,
  onUpdateProfile,
  onTestConnection
}) => {
  const [url, setUrl] = useState(sheetUrl);
  const [profile, setProfile] = useState<ContractorProfile>(contractorProfile);
  const [newCat, setNewCat] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleAddCategory = () => {
    if (newCat && !categories.includes(newCat)) {
      onUpdateCategories([...categories, newCat]);
      setNewCat('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    onUpdateCategories(categories.filter(c => c !== cat));
  };

  const handleResetCategories = () => {
    onUpdateCategories(DEFAULT_CATEGORIES);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = () => {
    onUpdateUrl(url);
    onUpdateProfile(profile);
    alert("Settings saved successfully!");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-32">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600"><ChevronLeft /></button>
        <h1 className="font-black text-slate-800 tracking-tight text-lg">Admin Settings</h1>
        <button onClick={handleSaveAll} className="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase shadow-md">Save</button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
        {/* Branding Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Contractor Branding</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Statement Appearance</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} className="w-full h-full object-cover" alt="Logo Preview" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                         <ImageIcon size={32} />
                         <span className="text-[8px] font-black uppercase mt-1">No Logo</span>
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <Upload size={20} />
                    </button>
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Click to upload logo thumbnail</p>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Company Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} placeholder="Contracting Co." />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Office Phone</label>
                       <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold text-sm" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="555-0199" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Biz Email</label>
                       <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold text-sm" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="biz@mail.com" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Bookkeeping Categories */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Tag size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Expense Categories</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bookkeeping buckets</p>
                </div>
              </div>
              <button onClick={handleResetCategories} className="text-slate-400 hover:text-blue-600 flex flex-col items-center gap-1">
                 <Undo2 size={16} />
                 <span className="text-[8px] font-black uppercase">Reset</span>
              </button>
           </div>
           
           <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newCat} 
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New bucket..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
              />
              <button onClick={handleAddCategory} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                <Plus size={20} />
              </button>
           </div>

           <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl group">
                   <span className="text-xs font-black text-slate-700">{cat}</span>
                   <button onClick={() => handleRemoveCategory(cat)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                   </button>
                </div>
              ))}
           </div>
        </div>

        {/* Cloud Link */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Cloud Database</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Google Sheets Link</p>
            </div>
          </div>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Apps Script URL..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
        </div>
      </div>
    </div>
  );
};
