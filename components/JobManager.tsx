
import React, { useState, useMemo } from 'react';
import { Plus, Briefcase, MapPin, Phone, Mail, User, X, Trash2, AlertTriangle, Edit2, Cloud, UserCircle2, ChevronDown, DollarSign, Target, FileSpreadsheet, Share2, Receipt, ChevronRight, Send, CheckCircle2, UserCircle, Printer, FileText, FileDown, Loader2 } from 'lucide-react';
import { Job, UserRole, ExpenseRecord, ContractorProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface JobManagerProps {
  jobs: Job[];
  expenses: ExpenseRecord[];
  onAddJob: (job: Job) => Promise<void>;
  onUpdateJob: (job: Job) => Promise<void>;
  onDeleteJob: (id: string) => void;
  onSyncAll?: () => Promise<void>;
  isCloudConnected: boolean;
  userRole: UserRole;
  onExportLedger: (job: Job, expenses: ExpenseRecord[]) => void;
  contractorProfile: ContractorProfile;
}

export const JobManager: React.FC<JobManagerProps> = ({ 
  jobs, 
  expenses,
  onAddJob, 
  onUpdateJob, 
  onDeleteJob, 
  onSyncAll,
  isCloudConnected,
  userRole,
  onExportLedger,
  contractorProfile
}) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [viewingLedger, setViewingLedger] = useState<Job | null>(null);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [formData, setFormData] = useState<Partial<Job>>({
    name: '', client: '', address: '', contactName: '', phone: '', email: '', status: 'active', budget: 0
  });

  const isAdmin = userRole === UserRole.ADMIN;

  const getJobExpenses = (jobId: string) => {
    return expenses.filter(exp => exp.jobId === jobId || exp.items.some(i => i.jobId === jobId));
  };

  const jobSpending = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(exp => {
      exp.items.forEach(item => {
        const targetJobId = item.jobId || exp.jobId;
        map[targetJobId] = (map[targetJobId] || 0) + (item.amount || 0);
      });
    });
    return map;
  }, [expenses]);

  const resetForm = () => {
    setFormData({ name: '', client: '', address: '', contactName: '', phone: '', email: '', status: 'active', budget: 0 });
    setIsAdding(false);
    setJobToEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.client || !isAdmin) return;
    if (jobToEdit) {
      await onUpdateJob({ ...jobToEdit, ...formData } as Job);
    } else {
      const job: Job = {
        ...formData as any,
        id: `job-${Math.random().toString(36).substr(2, 9)}`,
        isSynced: false
      };
      await onAddJob(job);
    }
    resetForm();
  };

  const generateAndSharePDF = async (job: Job) => {
    setIsGeneratingPDF(true);
    const jobExps = getJobExpenses(job.id).sort((a, b) => b.timestamp - a.timestamp);
    const total = jobSpending[job.id] || 0;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Branded Header
      if (contractorProfile.logoUrl) {
        try {
          doc.addImage(contractorProfile.logoUrl, 'PNG', 20, 15, 25, 25);
        } catch (e) { console.warn("Logo add failed", e); }
      }

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(contractorProfile.companyName, 50, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Phone: ${contractorProfile.phone} | Email: ${contractorProfile.email}`, 50, 32);

      doc.setDrawColor(0);
      doc.line(20, 45, pageWidth - 20, 45);

      // Statement Info
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('PROJECT BILLING STATEMENT', 20, 60);

      doc.setFontSize(10);
      doc.text(`PROJECT: ${job.name}`, 20, 70);
      doc.text(`CLIENT: ${job.client}`, 20, 75);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 20, 70, { align: 'right' });

      // Summary Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(20, 85, pageWidth - 40, 25, 3, 3, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL BALANCE DUE', 30, 95);
      doc.setFontSize(18);
      doc.text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 30, 104);

      // Table of Items
      const tableData = jobExps.map(exp => [
        exp.date,
        exp.merchantName,
        exp.category,
        `$${exp.totalAmount.toFixed(2)}`
      ]);

      (doc as any).autoTable({
        startY: 120,
        head: [['Date', 'Store / Merchant', 'Category', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Note: This statement lists all recorded expenditures for the project site.', 20, finalY);

      const fileName = `${job.name.replace(/\s+/g, '_')}_Statement.pdf`;
      const pdfOutput = doc.output('blob');

      if (navigator.share) {
        const file = new File([pdfOutput], fileName, { type: 'application/pdf' });
        await navigator.share({
          files: [file],
          title: `Statement - ${job.name}`,
          text: `Project billing statement for ${job.name}`
        });
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      console.error("PDF generation error", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Sites</h1>
        {isAdmin && (
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg flex items-center gap-2">
            <Plus size={20} /><span className="text-xs font-bold pr-1">New Site</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {jobs.map(job => {
          const spent = jobSpending[job.id] || 0;
          const progress = job.budget > 0 ? Math.min((spent / job.budget) * 100, 100) : 0;
          const isOverBudget = spent > job.budget && job.budget > 0;

          return (
            <div key={job.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden no-print">
               <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-800">{job.name}</h3>
                      <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{job.client}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>{job.status}</span>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xl font-black text-slate-800">${spent.toLocaleString()}</span>
                      <span className={`text-[10px] font-black uppercase ${isOverBudget ? 'text-red-500' : 'text-slate-400'}`}>
                        Budget: ${job.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full border border-slate-100">
                      <div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setViewingLedger(job)} className="bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <FileSpreadsheet size={16} /> View Statement
                     </button>
                     <button onClick={() => navigate('/history', { state: { jobId: job.id } })} className="bg-slate-50 text-slate-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100">
                        <Receipt size={16} /> Receipts
                     </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Branded Statement Modal */}
      {viewingLedger && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex flex-col animate-in fade-in duration-300 ledger-container">
           <div className="bg-white flex-1 mt-8 sm:mt-12 rounded-t-[3rem] shadow-2xl overflow-hidden flex flex-col ledger-card">
              <div className="p-8 pb-6 bg-slate-50 flex items-start justify-between ledger-header">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100 overflow-hidden">
                       {contractorProfile.logoUrl ? (
                         <img src={contractorProfile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                       ) : (
                         contractorProfile.logoEmoji
                       )}
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{contractorProfile.companyName}</h2>
                       <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Billing Statement</p>
                    </div>
                 </div>
                 <button onClick={() => setViewingLedger(null)} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 no-print modal-close"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32 no-scrollbar">
                 <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden ledger-summary">
                    <div className="relative z-10">
                       <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2">Statement Balance Due</p>
                       <p className="text-5xl font-black tracking-tighter">${(jobSpending[viewingLedger.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Project Activity Log</h3>
                    <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white table-container">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-100">
                             <tr>
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase">Store / Merchant</th>
                                <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Amount</th>
                             </tr>
                          </thead>
                          <tbody>
                             {getJobExpenses(viewingLedger.id).sort((a,b) => b.timestamp - a.timestamp).map(exp => (
                                <tr key={exp.id} className="border-b border-slate-50 last:border-0">
                                   <td className="px-5 py-4">
                                      <p className="font-black text-slate-800 leading-none mb-1">{exp.merchantName}</p>
                                      <p className="text-[10px] font-bold text-slate-400">{exp.date} • {exp.category}</p>
                                   </td>
                                   <td className="px-5 py-4 text-right font-black text-slate-900">${exp.totalAmount.toFixed(2)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 <div className="p-6 bg-blue-50/50 border border-blue-100/50 rounded-3xl space-y-3">
                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">This statement represents all expenditures recorded for the project. For copies of individual receipts, please contact our office.</p>
                 </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex gap-4 action-bar no-print">
                 <button 
                   disabled={isGeneratingPDF}
                   onClick={() => generateAndSharePDF(viewingLedger)}
                   className="flex-1 bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />} PDF Statement
                 </button>
                 <button 
                   onClick={() => onExportLedger(viewingLedger, getJobExpenses(viewingLedger.id))}
                   className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                 >
                    <Send size={20} /> Share Summary
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Site Management Form */}
      {isAdmin && (isAdding || jobToEdit) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">{jobToEdit ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={resetForm} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-10">
               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Budget ($)</label>
                    <input required type="number" className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 outline-none font-black text-blue-700" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Customer Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                  </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl mt-4 active:scale-95 transition-all">
                {jobToEdit ? 'Update Project' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
