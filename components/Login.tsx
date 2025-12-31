
import React from 'react';
import { UserRole, UserAccount } from '../types';
import { ShieldCheck, User as UserIcon, Camera, Construction } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const roles = [
    {
      role: UserRole.ADMIN,
      title: 'Administrator',
      desc: 'Full access to projects, syncing, and financial management.',
      icon: <ShieldCheck size={32} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      user: { id: 'admin-1', name: 'Site Manager', email: 'admin@contractor.com', role: UserRole.ADMIN }
    },
    {
      role: UserRole.USER,
      title: 'Field Worker',
      desc: 'Scan receipts and view active projects only.',
      icon: <UserIcon size={32} className="text-slate-600" />,
      bg: 'bg-slate-50',
      border: 'border-slate-100',
      user: { id: 'user-1', name: 'Field Agent', email: 'agent@contractor.com', role: UserRole.USER }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-8 justify-center items-center">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 mx-auto mb-6 transform -rotate-6">
           <Construction size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">ContractorBook</h1>
        <p className="text-slate-400 font-medium mt-2">Sign in to your account</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {roles.map((item) => (
          <button
            key={item.role}
            onClick={() => onLogin(item.user)}
            className={`w-full text-left p-6 rounded-[2.5rem] border-2 ${item.border} ${item.bg} hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-6 shadow-sm`}
          >
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              {item.icon}
            </div>
            <div>
              <h3 className="font-black text-slate-800">{item.title}</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-12 text-[10px] text-slate-400 font-black uppercase tracking-widest text-center max-w-[200px]">
        Enterprise ready bookkeeping for site managers and field crews
      </p>
    </div>
  );
};
