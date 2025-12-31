
import React from 'react';
import { UserAccount, UserRole } from '../types';
import { LogOut, UserCircle, ShieldCheck, Camera, LayoutGrid, Cloud, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: UserAccount;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const permissions = user.role === UserRole.ADMIN 
    ? [
        { icon: <Camera size={16} />, text: 'Scan & Extract Receipts', ok: true },
        { icon: <LayoutGrid size={16} />, text: 'Manage Projects', ok: true },
        { icon: <Cloud size={16} />, text: 'Sync to Cloud (Sheets)', ok: true },
        { icon: <ShieldCheck size={16} />, text: 'Admin Controls', ok: true }
      ]
    : [
        { icon: <Camera size={16} />, text: 'Scan & Extract Receipts', ok: true },
        { icon: <LayoutGrid size={16} />, text: 'View Project Sites', ok: true },
        { icon: <Cloud size={16} />, text: 'Sync to Cloud', ok: false },
        { icon: <ShieldCheck size={16} />, text: 'Admin Controls', ok: false }
      ];

  return (
    <div className="p-6 flex flex-col h-full bg-slate-50">
      <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-8">User Profile</h1>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center mb-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100 relative">
          <UserCircle size={64} />
          <div className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-white shadow-sm ${user.role === UserRole.ADMIN ? 'bg-blue-600 text-white' : 'bg-slate-500 text-white'}`}>
             {user.role === UserRole.ADMIN ? <ShieldCheck size={14} /> : <UserCircle size={14} />}
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-800">{user.name}</h2>
        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{user.role}</p>
        <p className="text-xs text-slate-400 font-medium mt-2">{user.email}</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Access & Permissions</h3>
        <div className="space-y-4">
          {permissions.map((p, i) => (
            <div key={i} className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${p.ok ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                    {p.icon}
                  </div>
                  <span className={`text-xs font-bold ${p.ok ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{p.text}</span>
               </div>
               {p.ok ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      {user.role === UserRole.ADMIN && (
        <button 
          onClick={() => navigate('/settings')}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 mb-3 shadow-lg"
        >
          <Cloud size={18} /> Cloud & Sync Settings
        </button>
      )}

      <button 
        onClick={onLogout}
        className="w-full bg-white border border-red-100 text-red-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2"
      >
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
};

const X: React.FC<any> = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);
