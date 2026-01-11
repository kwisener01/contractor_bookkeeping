
import React from 'react';
import { ExpenseRecord, Job, UserAccount, UserRole, ContractorProfile } from '../types';
import { FileText, Plus, ArrowRight, Settings, Cloud, CloudOff, RefreshCw, LogOut, UserCircle, ShieldCheck, Share2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  expenses: ExpenseRecord[];
  jobs: Job[];
  onNewScan: () => void;
  onViewHistory: () => void;
  onViewJobs: () => void;
  onExport: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isCloudConnected: boolean;
  pendingCount: number;
  user: UserAccount;
  contractorProfile: ContractorProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  expenses, 
  jobs, 
  onNewScan, 
  onViewHistory, 
  onViewJobs, 
  onExport, 
  onSettings,
  onLogout,
  onRefresh,
  isCloudConnected,
  pendingCount,
  user,
  contractorProfile
}) => {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const recentExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  const isAdmin = user.role === UserRole.ADMIN;
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 overflow-hidden">
             {contractorProfile.logoUrl ? (
               <img src={contractorProfile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
             ) : (
               contractorProfile.logoEmoji || '🏗️'
             )}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{contractorProfile.companyName}</h1>
            <div className="flex items-center gap-1.5 opacity-60">
              <p className="text-[10px] font-black uppercase tracking-widest">{user.role}</p>
              {isAdmin && <ShieldCheck size={10} className="text-blue-600" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCloudConnected && (
            <button 
              onClick={onRefresh}
              title="Refresh from Cloud"
              className="p-2.5 bg-white border border-blue-100 rounded-xl text-blue-600 shadow-sm active:scale-90 transition-all hover:bg-blue-50"
            >
              <RefreshCw size={20} />
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={onSettings}
              title="Settings"
              className={`p-2.5 bg-white border ${isCloudConnected ? 'border-green-200 text-green-600' : 'border-slate-200 text-slate-600'} rounded-xl shadow-sm active:scale-90 transition-all hover:bg-slate-50 relative`}
            >
              <Settings size={20} />
              {isCloudConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </button>
          )}
          <button 
            onClick={onLogout}
            title="Sign Out"
            className="p-2.5 bg-white border border-red-100 rounded-xl text-red-500 shadow-sm active:scale-90 transition-all hover:bg-red-50"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <p className="opacity-80 text-sm font-medium">Total Project Spend</p>
            {isCloudConnected ? (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                <Cloud size={12} className="text-white" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Sync Active</span>
              </div>
            ) : (
              <div className="bg-black/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                <CloudOff size={12} className="text-white/60" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Offline</span>
              </div>
            )}
          </div>
          <p className="text-4xl font-black mt-1 tracking-tight">
            ${isAdmin ? totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '••••••'}
          </p>
          
          <div className="mt-8 flex gap-4">
            <button 
              onClick={onNewScan}
              className="flex-1 bg-white text-blue-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={20} /> New Scan
            </button>
            <div className="bg-blue-500/50 backdrop-blur px-5 py-4 rounded-2xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-8 -mb-8 blur-2xl"></div>
      </div>

      {/* Sync Status Alert */}
      {isAdmin && isCloudConnected && pendingCount > 0 && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <RefreshCw size={20} className="animate-spin-slow" />
             </div>
             <div>
                <p className="text-xs font-black text-orange-900 uppercase tracking-tight">{pendingCount} Items Pending</p>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tight">Syncing in background...</p>
             </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Jobs</p>
          <p className="text-2xl font-black text-slate-800">{jobs.filter(j => j.status === 'active').length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Receipts</p>
          <p className="text-2xl font-black text-slate-800">{expenses.length}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Recent Activity</h2>
          <button onClick={onViewHistory} className="text-blue-600 text-sm font-bold flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <FileText className="mx-auto text-slate-200 mb-2" size={32} />
              <p className="text-slate-400 text-sm font-medium">No recent activity</p>
            </div>
          ) : (
            recentExpenses.map(exp => (
              <div key={exp.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${CATEGORY_COLORS[exp.category] || 'bg-slate-100'}`}>
                  {exp.merchantName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-800 truncate text-sm">{exp.merchantName}</p>
                    {isAdmin && exp.isSynced && <Cloud size={10} className="text-green-500" />}
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight truncate">
                    {jobs.find(j => j.id === exp.jobId)?.name || 'Unknown Project'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800 text-sm">${exp.totalAmount.toFixed(2)}</p>
                  <p className="text-slate-400 text-[10px] font-bold">{new Date(exp.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Wallet: React.FC<any> = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </svg>
);
