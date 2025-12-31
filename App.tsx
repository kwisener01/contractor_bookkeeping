
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, History as HistoryIcon, Camera, LayoutGrid, Search, Edit2, Trash2, AlertCircle, X, Download, FileSpreadsheet, MessageSquare, Settings as SettingsIcon, Cloud, RefreshCw, User as UserIcon, LogOut, ShieldCheck, UserCircle, Briefcase } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ExpenseForm } from './components/ExpenseForm';
import { JobManager } from './components/JobManager';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import { ExpenseRecord, ExtractedReceiptData, Job, UserRole, UserAccount } from './types';
import { INITIAL_JOBS } from './constants';
import { syncToGoogleSheet, fetchFromCloud } from './services/googleSheetsService';

const AppContent: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<{data: ExtractedReceiptData, url: string} | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const expensesRef = useRef<ExpenseRecord[]>([]);
  const jobsRef = useRef<Job[]>([]);
  const syncLock = useRef(false);
  const pullLock = useRef(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cb_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      
      const savedExpenses = localStorage.getItem('cb_expenses');
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        setExpenses(parsed);
        expensesRef.current = parsed;
      }

      const savedJobs = localStorage.getItem('cb_jobs');
      if (savedJobs) {
        const parsed = JSON.parse(savedJobs);
        const finalJobs = parsed.length > 0 ? parsed : INITIAL_JOBS;
        setJobs(finalJobs);
        jobsRef.current = finalJobs;
      } else {
        setJobs(INITIAL_JOBS);
        jobsRef.current = INITIAL_JOBS;
      }

      const savedUrl = localStorage.getItem('cb_sheet_url');
      if (savedUrl) setGoogleSheetUrl(savedUrl);
    } catch (e) {
      console.error("Storage load error", e);
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => { expensesRef.current = expenses; }, [expenses]);
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);

  const pullFromCloud = useCallback(async () => {
    if (!googleSheetUrl || !googleSheetUrl.includes('script.google.com/macros/s/') || pullLock.current) return;
    
    pullLock.current = true;
    setIsPulling(true);
    
    try {
      const data = await fetchFromCloud(googleSheetUrl);
      if (!data) return;

      setJobs(prev => {
        const unsyncedLocalJobs = prev.filter(j => !j.isSynced);
        const mergedJobs = [...data.jobs];
        unsyncedLocalJobs.forEach(lj => {
          if (!mergedJobs.some(rj => rj.id === lj.id)) mergedJobs.unshift(lj);
        });
        localStorage.setItem('cb_jobs', JSON.stringify(mergedJobs));
        return mergedJobs;
      });

      setExpenses(prev => {
        const unsyncedLocalExpenses = prev.filter(e => !e.isSynced);
        const mergedExpenses = [...data.expenses];
        unsyncedLocalExpenses.forEach(le => {
          if (!mergedExpenses.some(re => re.id === le.id)) mergedExpenses.unshift(le);
        });
        localStorage.setItem('cb_expenses', JSON.stringify(mergedExpenses));
        return mergedExpenses;
      });
    } finally {
      setIsPulling(false);
      pullLock.current = false;
    }
  }, [googleSheetUrl]);

  const syncAllUnsynced = useCallback(async (targetUrl?: string) => {
    const url = (targetUrl || googleSheetUrl).trim();
    if (!url || !url.includes('script.google.com/macros/s/') || syncLock.current || currentUser?.role !== UserRole.ADMIN) return;
    
    syncLock.current = true;
    setIsBackgroundSyncing(true);

    try {
      const currentExpenses = [...expensesRef.current];
      const currentJobs = [...jobsRef.current];
      
      const pendingJobs = currentJobs.filter(j => !j.isSynced);
      const pendingExpenses = currentExpenses.filter(e => !e.isSynced);

      if (pendingJobs.length === 0 && pendingExpenses.length === 0) {
        setIsBackgroundSyncing(false);
        syncLock.current = false;
        return;
      }

      for (const job of pendingJobs) {
        const success = await syncToGoogleSheet(url, job);
        if (success) {
          setJobs(prev => {
            const updated = prev.map(j => j.id === job.id ? { ...j, isSynced: true } : j);
            localStorage.setItem('cb_jobs', JSON.stringify(updated));
            return updated;
          });
        }
      }

      for (const exp of pendingExpenses) {
        const success = await syncToGoogleSheet(url, exp, { jobs: currentJobs });
        if (success) {
          setExpenses(prev => {
            const updated = prev.map(e => e.id === exp.id ? { ...e, isSynced: true } : e);
            localStorage.setItem('cb_expenses', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } finally {
      setIsBackgroundSyncing(false);
      syncLock.current = false;
    }
  }, [googleSheetUrl, currentUser]);

  const saveJob = useCallback(async (job: Job) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    const newJob = { ...job, isSynced: false };
    setJobs(prev => {
      const updated = [newJob, ...prev.filter(j => j.id !== newJob.id)];
      localStorage.setItem('cb_jobs', JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => syncAllUnsynced(), 500);
  }, [syncAllUnsynced, currentUser]);

  const updateJob = useCallback(async (updatedJob: Job) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    const nextJob = { ...updatedJob, isSynced: false };
    setJobs(prev => {
      const updated = prev.map(j => j.id === nextJob.id ? nextJob : j);
      localStorage.setItem('cb_jobs', JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => syncAllUnsynced(), 500);
  }, [syncAllUnsynced, currentUser]);

  const deleteJob = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setJobs(prev => {
      const updated = prev.filter(j => j.id !== id);
      localStorage.setItem('cb_jobs', JSON.stringify(updated));
      return updated;
    });
  };

  const saveExpense = async (record: ExpenseRecord, shouldSync: boolean = true) => {
    const updatedRecord = { ...record, isSynced: false };

    setExpenses(prev => {
      const exists = prev.find(e => e.id === record.id);
      const updated = exists 
        ? prev.map(e => e.id === record.id ? updatedRecord : e) 
        : [updatedRecord, ...prev];
      
      try {
        localStorage.setItem('cb_expenses', JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage Full");
      }
      return updated;
    });

    setActiveReceipt(null);
    setEditingExpense(null);
    
    if (location.pathname.includes('scan')) navigate('/history');
    
    if (shouldSync && currentUser?.role === UserRole.ADMIN) {
      setTimeout(() => syncAllUnsynced(), 1000);
    }
  };

  const deleteExpense = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('cb_expenses', JSON.stringify(updated));
      return updated;
    });
    setExpenseToDelete(null);
  };

  const handleExport = () => {
    if (expenses.length === 0) {
      alert("No expenses to export.");
      return;
    }

    const headers = ["Date", "Merchant", "Project", "Category", "Amount", "Tax", "Items Count", "Notes"];
    const rows = expenses.map(exp => {
      const job = jobs.find(j => j.id === exp.jobId);
      return [
        exp.date || new Date(exp.timestamp).toLocaleDateString(),
        `"${exp.merchantName.replace(/"/g, '""')}"`,
        `"${(job?.name || 'Multi-Project').replace(/"/g, '""')}"`,
        exp.category,
        exp.totalAmount.toFixed(2),
        exp.taxAmount.toFixed(2),
        exp.items.length,
        `"${(exp.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ContractorBook_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredExpenses = useMemo(() => {
    const filterJobId = location.state?.jobId;
    return expenses.filter(exp => {
      const jobName = jobs.find(j => j.id === exp.jobId)?.name || '';
      const content = `${exp.merchantName} ${jobName} ${exp.notes || ''}`.toLowerCase();
      const searchMatch = content.includes(searchQuery.toLowerCase());
      const jobMatch = filterJobId ? exp.jobId === filterJobId : true;
      return searchMatch && jobMatch;
    });
  }, [expenses, jobs, searchQuery, location.state]);

  const activeFilterJob = useMemo(() => jobs.find(j => j.id === location.state?.jobId), [jobs, location.state]);
  const pendingCount = expenses.filter(e => !e.isSynced).length + jobs.filter(j => !j.isSynced).length;

  if (isAuthLoading) return null;
  if (!currentUser && location.pathname !== '/login') return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {(isBackgroundSyncing || isPulling) && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          <RefreshCw size={10} className="animate-spin" />
          {isPulling ? "Pulling Remote Data..." : "Updating Cloud Database..."}
        </div>
      )}

      <Routes>
        <Route path="/login" element={<Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('cb_user', JSON.stringify(u)); navigate('/'); }} />} />
        <Route path="/" element={<Dashboard expenses={expenses} jobs={jobs} onNewScan={() => navigate('/scan')} onViewHistory={() => navigate('/history')} onViewJobs={() => navigate('/jobs')} onExport={handleExport} onSettings={() => navigate('/settings')} onLogout={() => { setCurrentUser(null); localStorage.removeItem('cb_user'); navigate('/login'); }} onRefresh={pullFromCloud} isCloudConnected={!!googleSheetUrl && googleSheetUrl.includes('script.google.com/macros/s/')} pendingCount={pendingCount} user={currentUser!} />} />
        <Route path="/scan" element={<ReceiptScanner onDataExtracted={(d, u) => setActiveReceipt({data: d, url: u})} jobs={jobs} />} />
        <Route path="/settings" element={currentUser?.role === UserRole.ADMIN ? <Settings sheetUrl={googleSheetUrl} onUpdateUrl={(u) => { setGoogleSheetUrl(u); localStorage.setItem('cb_sheet_url', u); setTimeout(() => pullFromCloud(), 500); }} unsyncedCount={pendingCount} onSyncAll={syncAllUnsynced} onTestConnection={async () => syncToGoogleSheet(googleSheetUrl, { type: 'test' })} /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={<Profile user={currentUser!} onLogout={() => { setCurrentUser(null); localStorage.removeItem('cb_user'); navigate('/login'); }} />} />
        <Route path="/history" element={
          <div className="p-4 space-y-4">
             <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/')} className="p-2 bg-white rounded-xl border border-slate-200"><Home size={20} className="text-slate-600" /></button>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">History</h1>
             </div>
             {activeFilterJob && (
               <div className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-left duration-300">
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} />
                    <p className="font-bold text-sm truncate max-w-[180px]">{activeFilterJob.name}</p>
                  </div>
                  <button onClick={() => navigate('/history', { state: null })} className="p-2 bg-white/20 rounded-full"><X size={16} /></button>
               </div>
             )}
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium" />
             </div>
             <div className="space-y-3 pb-8">
                {filteredExpenses.map(exp => (
                   <div key={exp.id} onClick={() => setEditingExpense(exp)} className="bg-white p-4 rounded-2xl flex flex-col gap-3 shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 relative">
                             {exp.imageUrl ? <img src={exp.imageUrl} className="w-full h-full object-cover" alt="receipt" /> : <Camera size={24} className="m-auto" />}
                             {exp.isSynced && <div className="absolute top-0 right-0 bg-green-500 text-white p-0.5"><Cloud size={10} /></div>}
                         </div>
                         <div className="flex-1 min-w-0">
                             <p className="font-bold text-slate-800 truncate">{exp.merchantName}</p>
                             <p className="text-blue-600 text-[10px] uppercase font-bold">{jobs.find(j => j.id === exp.jobId)?.name || 'Multi-Project'}</p>
                         </div>
                         <div className="text-right">
                             <p className="font-black text-slate-800">${exp.totalAmount.toFixed(2)}</p>
                             {currentUser?.role === UserRole.ADMIN && <button onClick={(e) => { e.stopPropagation(); setExpenseToDelete(exp.id); }} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        } />
        <Route path="/jobs" element={<JobManager jobs={jobs} expenses={expenses} onAddJob={saveJob} onUpdateJob={updateJob} onDeleteJob={deleteJob} onSyncAll={syncAllUnsynced} isCloudConnected={!!googleSheetUrl} userRole={currentUser?.role || UserRole.USER} />} />
      </Routes>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`}><Home size={22} /><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => navigate('/history')} className={`flex flex-col items-center gap-1 ${location.pathname === '/history' ? 'text-blue-600' : 'text-slate-400'}`}><HistoryIcon size={22} /><span className="text-[10px] font-bold">History</span></button>
        <button onClick={() => navigate('/scan')} className="flex flex-col items-center -mt-10"><div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-slate-50 active:scale-90 transition-transform"><Camera size={26} /></div></button>
        <button onClick={() => navigate('/jobs')} className={`flex flex-col items-center gap-1 ${location.pathname === '/jobs' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutGrid size={22} /><span className="text-[10px] font-bold">Projects</span></button>
        <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-blue-600' : 'text-slate-400'}`}><UserIcon size={22} /><span className="text-[10px] font-bold">User</span></button>
      </nav>

      {activeReceipt && <ExpenseForm initialData={activeReceipt.data} imageUrl={activeReceipt.url} jobs={jobs} onSave={(rec) => saveExpense(rec, true)} onCancel={() => setActiveReceipt(null)} hasSyncUrl={!!googleSheetUrl} />}
      {editingExpense && <ExpenseForm initialData={editingExpense} imageUrl={editingExpense.imageUrl || ''} jobs={jobs} existingRecord={editingExpense} onSave={(rec) => saveExpense(rec, true)} onCancel={() => setEditingExpense(null)} hasSyncUrl={!!googleSheetUrl} />}
      {expenseToDelete && <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4"><div className="bg-white w-full max-sm rounded-[2.5rem] p-8 text-center shadow-xl"><AlertCircle size={48} className="text-red-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-6">Delete Expense?</h3><div className="flex gap-3"><button onClick={() => setExpenseToDelete(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold">Cancel</button><button onClick={() => deleteExpense(expenseToDelete)} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold">Delete</button></div></div></div>}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
