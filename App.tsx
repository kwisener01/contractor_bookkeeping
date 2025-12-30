import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, History as HistoryIcon, Camera, LayoutGrid, Search, Edit2, StickyNote, Trash2, AlertCircle, X, Download, Share2, FileSpreadsheet, MessageSquare, Settings as SettingsIcon, Cloud, CloudOff } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ExpenseForm } from './components/ExpenseForm';
import { JobManager } from './components/JobManager';
import { Settings } from './components/Settings';
import { ExpenseRecord, ExtractedReceiptData, Job } from './types';
import { INITIAL_JOBS } from './constants';
import { syncToGoogleSheet } from './services/googleSheetsService';

const AppContent: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<{data: ExtractedReceiptData, url: string} | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize data
  useEffect(() => {
    const savedExpenses = localStorage.getItem('cb_expenses');
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

    const savedJobs = localStorage.getItem('cb_jobs');
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
      setJobs(INITIAL_JOBS);
      localStorage.setItem('cb_jobs', JSON.stringify(INITIAL_JOBS));
    }

    const savedUrl = localStorage.getItem('cb_sheet_url');
    if (savedUrl) setGoogleSheetUrl(savedUrl);
  }, []);

  // Update URL
  const updateSheetUrl = (url: string) => {
    setGoogleSheetUrl(url);
    localStorage.setItem('cb_sheet_url', url);
  };

  // --- JOB ACTIONS ---

  const saveJob = useCallback(async (job: Job) => {
    // 1. Save locally first (optimistic)
    const newJob = { ...job, isSynced: false };
    setJobs(prev => {
      const updated = [newJob, ...prev];
      localStorage.setItem('cb_jobs', JSON.stringify(updated));
      return updated;
    });

    // 2. Sync if URL exists
    if (googleSheetUrl) {
      const success = await syncToGoogleSheet(googleSheetUrl, newJob);
      if (success) {
        setJobs(prev => {
          const updated = prev.map(j => j.id === newJob.id ? { ...j, isSynced: true } : j);
          localStorage.setItem('cb_jobs', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [googleSheetUrl]);

  const updateJob = useCallback(async (updatedJob: Job) => {
    // 1. Update locally
    const nextJob = { ...updatedJob, isSynced: false };
    setJobs(prev => {
      const updated = prev.map(j => j.id === nextJob.id ? nextJob : j);
      localStorage.setItem('cb_jobs', JSON.stringify(updated));
      return updated;
    });

    // 2. Sync
    if (googleSheetUrl) {
      const success = await syncToGoogleSheet(googleSheetUrl, nextJob);
      if (success) {
        setJobs(prev => {
          const updated = prev.map(j => j.id === nextJob.id ? { ...j, isSynced: true } : j);
          localStorage.setItem('cb_jobs', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [googleSheetUrl]);

  const deleteJob = useCallback((id: string) => {
    setJobs(prev => {
      const updated = prev.filter(j => j.id !== id);
      localStorage.setItem('cb_jobs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // --- EXPENSE ACTIONS ---

  const saveExpense = async (record: ExpenseRecord, shouldSync: boolean = true) => {
    const exists = expenses.find(e => e.id === record.id);
    const updatedRecord = { ...record, isSynced: false };

    // Update local state
    setExpenses(prev => {
      let updated;
      if (exists) {
        updated = prev.map(e => e.id === record.id ? updatedRecord : e);
      } else {
        updated = [updatedRecord, ...prev];
      }
      localStorage.setItem('cb_expenses', JSON.stringify(updated));
      return updated;
    });

    // Sync if needed
    if (shouldSync && googleSheetUrl) {
      const jobName = jobs.find(j => j.id === record.jobId)?.name || 'Unknown';
      const success = await syncToGoogleSheet(googleSheetUrl, updatedRecord, { jobName });
      
      if (success) {
        setExpenses(prev => {
          const updated = prev.map(e => e.id === record.id ? { ...updatedRecord, isSynced: true } : e);
          localStorage.setItem('cb_expenses', JSON.stringify(updated));
          return updated;
        });
      }
    }

    setActiveReceipt(null);
    setEditingExpense(null);
    navigate(exists ? '/history' : '/');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('cb_expenses', JSON.stringify(updated));
      return updated;
    });
    setExpenseToDelete(null);
  };

  // --- BATCH SYNC ---

  const syncAllUnsynced = async () => {
    if (!googleSheetUrl) return;

    const pendingExpenses = expenses.filter(e => !e.isSynced);
    const pendingJobs = jobs.filter(j => !j.isSynced);
    
    if (pendingExpenses.length === 0 && pendingJobs.length === 0) return;

    // Sync Jobs first
    for (const job of pendingJobs) {
      const success = await syncToGoogleSheet(googleSheetUrl, job);
      if (success) {
        setJobs(prev => {
          const updated = prev.map(j => j.id === job.id ? { ...j, isSynced: true } : j);
          localStorage.setItem('cb_jobs', JSON.stringify(updated));
          return updated;
        });
      }
    }

    // Sync Expenses
    for (const exp of pendingExpenses) {
      const jobName = jobs.find(j => j.id === exp.jobId)?.name || 'Unknown';
      const success = await syncToGoogleSheet(googleSheetUrl, exp, { jobName });
      if (success) {
        setExpenses(prev => {
          const updated = prev.map(e => e.id === exp.id ? { ...e, isSynced: true } : e);
          localStorage.setItem('cb_expenses', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!googleSheetUrl) return false;
    return await syncToGoogleSheet(googleSheetUrl, { type: 'test' });
  };

  const handleNativeShare = async (isText: boolean) => {
    const text = expenses.map(e => {
      const jobName = jobs.find(j => j.id === e.jobId)?.name || 'Unknown';
      return `${e.date} | ${e.merchantName} | ${jobName} | $${e.totalAmount.toFixed(2)}`;
    }).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ContractorBook Expense Export',
          text: isText ? text : `Project Expense Report:\n\n${text}`,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Sharing failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Export summary copied to clipboard.');
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
  };

  const handleDownload = () => {
    const headers = ['Date', 'Merchant', 'Project', 'Category', 'Total', 'Tax', 'Notes'];
    const rows = expenses.map(e => [
      e.date,
      e.merchantName,
      jobs.find(j => j.id === e.jobId)?.name || 'Unknown',
      e.category,
      e.totalAmount,
      e.taxAmount,
      e.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contractor_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const jobName = jobs.find(j => j.id === exp.jobId)?.name || '';
      const content = `${exp.merchantName} ${jobName} ${exp.notes || ''}`.toLowerCase();
      return content.includes(searchQuery.toLowerCase());
    });
  }, [expenses, jobs, searchQuery]);

  if (activeReceipt) {
    return (
      <ExpenseForm 
        initialData={activeReceipt.data} 
        imageUrl={activeReceipt.url} 
        jobs={jobs}
        onSave={(rec) => saveExpense(rec, true)} 
        onCancel={() => setActiveReceipt(null)} 
        hasSyncUrl={!!googleSheetUrl}
      />
    );
  }

  if (editingExpense) {
    return (
      <ExpenseForm 
        initialData={editingExpense} 
        imageUrl={editingExpense.imageUrl || ''} 
        jobs={jobs}
        existingRecord={editingExpense}
        onSave={(rec) => saveExpense(rec, true)} 
        onCancel={() => setEditingExpense(null)} 
        hasSyncUrl={!!googleSheetUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Routes>
        <Route path="/" element={
          <Dashboard 
            expenses={expenses} 
            jobs={jobs}
            onNewScan={() => navigate('/scan')} 
            onViewHistory={() => navigate('/history')} 
            onViewJobs={() => navigate('/jobs')}
            onExport={() => setShowExportModal(true)}
            onSettings={() => navigate('/settings')}
            isCloudConnected={!!googleSheetUrl}
          />
        } />
        <Route path="/scan" element={
          <ReceiptScanner onDataExtracted={(d, u) => setActiveReceipt({data: d, url: u})} />
        } />
        <Route path="/settings" element={
          <Settings 
            sheetUrl={googleSheetUrl} 
            onUpdateUrl={updateSheetUrl} 
            unsyncedCount={expenses.filter(e => !e.isSynced).length + jobs.filter(j => !j.isSynced).length}
            onSyncAll={syncAllUnsynced}
            onTestConnection={testConnection}
          />
        } />
        <Route path="/history" element={
          <div className="p-4 space-y-4">
             <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/')} className="p-2 bg-white rounded-xl border border-slate-200">
                   <Home size={20} className="text-slate-600" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">Expense History</h1>
             </div>
             
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search merchant, project, or notes..."
                   className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
                />
             </div>

             <div className="space-y-3">
                {filteredExpenses.length === 0 ? (
                   <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 px-6">
                      <p className="text-slate-400 font-medium">No expenses found.</p>
                   </div>
                ) : (
                   filteredExpenses.map(exp => (
                      <div key={exp.id} className="bg-white p-4 rounded-2xl flex flex-col gap-3 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 relative">
                                {exp.imageUrl ? (
                                  <img src={exp.imageUrl} className="w-full h-full object-cover" alt="receipt" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <Camera size={24} />
                                  </div>
                                )}
                                {exp.isSynced && (
                                  <div className="absolute top-0 right-0 bg-green-500 text-white rounded-bl-lg p-0.5">
                                    <Cloud size={10} />
                                  </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-800 truncate">{exp.merchantName}</p>
                                  {exp.isSynced && <Cloud size={12} className="text-green-500" />}
                                </div>
                                <p className="text-blue-600 text-[10px] uppercase font-bold tracking-tight">
                                  {jobs.find(j => j.id === exp.jobId)?.name || 'Unknown'}
                                </p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <div>
                                  <p className="font-bold text-slate-800">${exp.totalAmount.toFixed(2)}</p>
                                  <p className="text-slate-400 text-[10px]">{new Date(exp.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => setEditingExpense(exp)} className="p-1.5 text-slate-300 hover:text-blue-600 rounded-lg">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => setExpenseToDelete(exp.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
        } />
        <Route path="/jobs" element={
           <JobManager 
            jobs={jobs} 
            onAddJob={saveJob} 
            onUpdateJob={updateJob} 
            onDeleteJob={deleteJob} 
            onSyncAll={syncAllUnsynced}
            isCloudConnected={!!googleSheetUrl}
          />
        } />
      </Routes>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Export</h2>
              <button onClick={() => setShowExportModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => handleNativeShare(true)} className="flex items-center gap-4 p-5 bg-green-50 rounded-3xl border border-green-100">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white"><MessageSquare size={24} /></div>
                <div><p className="font-black text-green-900">Share via Text</p></div>
              </button>
              <button onClick={() => handleNativeShare(false)} className="flex items-center gap-4 p-5 bg-blue-50 rounded-3xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white"><Share2 size={24} /></div>
                <div><p className="font-black text-blue-900">More Options</p></div>
              </button>
              <button onClick={handleDownload} className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white"><FileSpreadsheet size={24} /></div>
                <div><p className="font-black text-slate-800">Download CSV</p></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-6 text-slate-800">Delete Expense?</h3>
            <div className="flex gap-3">
              <button onClick={() => setExpenseToDelete(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 font-bold text-slate-600">Cancel</button>
              <button onClick={() => deleteExpense(expenseToDelete)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Home size={22} /><span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => navigate('/history')} className={`flex flex-col items-center gap-1 ${location.pathname === '/history' ? 'text-blue-600' : 'text-slate-400'}`}>
          <HistoryIcon size={22} /><span className="text-[10px] font-bold">History</span>
        </button>
        <button onClick={() => navigate('/scan')} className="flex flex-col items-center -mt-10">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-slate-50 active:scale-90 transition-transform">
            <Camera size={26} />
          </div>
        </button>
        <button onClick={() => navigate('/jobs')} className={`flex flex-col items-center gap-1 ${location.pathname === '/jobs' ? 'text-blue-600' : 'text-slate-400'}`}>
          <LayoutGrid size={22} /><span className="text-[10px] font-bold">Projects</span>
        </button>
        <button onClick={() => navigate('/settings')} className={`flex flex-col items-center gap-1 ${location.pathname === '/settings' ? 'text-blue-600' : 'text-slate-400'}`}>
          <SettingsIcon size={22} /><span className="text-[10px] font-bold">Cloud</span>
        </button>
      </nav>
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