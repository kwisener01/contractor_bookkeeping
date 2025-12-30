import React from 'react';
import { ExpenseRecord, Job } from '../types';
import { Wallet, Briefcase, FileText, Plus, ArrowRight, Download, Settings, Cloud, CloudOff } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  expenses: ExpenseRecord[];
  jobs: Job[];
  onNewScan: () => void;
  onViewHistory: () => void;
  onViewJobs: () => void;
  onExport: () => void;
  onSettings: () => void;
  isCloudConnected: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  expenses, 
  jobs, 
  onNewScan, 
  onViewHistory, 
  onViewJobs, 
  onExport, 
  onSettings,
  isCloudConnected
}) => {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const recentExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ContractorBook</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onSettings}
            className={`p-2.5 bg-white border ${isCloudConnected ? 'border-green-200 text-green-600' : 'border-slate-200 text-slate-600'} rounded-xl shadow-sm active:scale-90 transition-all hover:bg-slate-50 relative`}
          >
            <Settings size={20} />
            {isCloudConnected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>
          <button 
            onClick={onExport}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm active:scale-90 transition-all hover:bg-slate-50"
          >
            <Download size={20} />
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
                <span className="text-[10px] font-black uppercase tracking-tighter">Synced</span>
              </div>
            ) : (
              <button onClick={onSettings} className="bg-red-500/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                <CloudOff size={12} className="text-white/80" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Offline</span>
              </button>
            )}
          </div>
          <p className="text-4xl font-black mt-1 tracking-tight">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          
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
        {/* Abstract pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-8 -mb-8 blur-2xl"></div>
      </div>

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

      {/* Recent Expenses */}
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
              <div key={exp.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${CATEGORY_COLORS[exp.category] || 'bg-slate-100'}`}>
                  {exp.merchantName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-800 truncate">{exp.merchantName}</p>
                    {exp.isSynced && <Cloud size={10} className="text-green-500" />}
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight truncate">
                    {jobs.find(j => j.id === exp.jobId)?.name || 'Unknown Project'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">${exp.totalAmount.toFixed(2)}</p>
                  <p className="text-slate-400 text-[10px] font-bold">{new Date(exp.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Job Sites Section */}
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between px-1">
           <h2 className="text-lg font-black text-slate-800 tracking-tight">Project Sites</h2>
           <button onClick={onViewJobs} className="text-blue-600 text-sm font-bold flex items-center gap-1">
              Manage <ArrowRight size={14} />
           </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {jobs.map(job => (
            <div key={job.id} className="min-w-[240px] bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                  job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {job.status}
                </span>
                <h3 className="font-black text-slate-800 mt-2 truncate text-lg tracking-tight">{job.name}</h3>
                <p className="text-slate-400 text-xs mt-1 truncate font-medium">{job.client}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Expenses</p>
                  <p className="font-black text-slate-800">
                    ${expenses.filter(e => e.jobId === job.id).reduce((s, e) => s + e.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <Briefcase size={14} />
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={onViewJobs}
            className="min-w-[140px] bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-2 active:bg-slate-50 transition-all"
          >
            <Plus size={24} />
            <span className="text-[10px] font-black uppercase">New Site</span>
          </button>
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