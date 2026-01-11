
import React, { useState } from 'react';
import { ExtractedReceiptData, Job, ExpenseRecord, ReceiptItem } from '../types';
import { ChevronLeft, Plus, X, Calculator, Loader2, Split, Layers, Sparkles } from 'lucide-react';

interface ExpenseFormProps {
  initialData: ExtractedReceiptData;
  imageUrl: string;
  jobs: Job[];
  categories: string[];
  onSave: (record: ExpenseRecord, sync: boolean) => Promise<void>;
  onCancel: () => void;
  existingRecord?: ExpenseRecord;
  hasSyncUrl: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  initialData, 
  imageUrl, 
  jobs, 
  categories,
  onSave, 
  onCancel,
  existingRecord,
  hasSyncUrl
}) => {
  const [formData, setFormData] = useState<ExtractedReceiptData>(initialData);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    existingRecord?.jobId || initialData.suggestedJobId || ''
  );
  const [shouldSync, setShouldSync] = useState(hasSyncUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(
    initialData.items.some(item => item.jobId && item.jobId !== (existingRecord?.jobId || initialData.suggestedJobId))
  );

  const handleSave = async () => {
    if (!selectedJobId && !isSplitMode) {
      alert("Please select a primary project.");
      return;
    }
    setIsSaving(true);
    try {
      const record: ExpenseRecord = {
        ...formData,
        id: existingRecord?.id || Math.random().toString(36).substr(2, 9),
        jobId: selectedJobId,
        timestamp: existingRecord?.timestamp || Date.now(),
        imageUrl: imageUrl || existingRecord?.imageUrl,
        isSynced: false
      };
      await onSave(record, shouldSync);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600"><ChevronLeft /></button>
        <h1 className="font-black text-slate-800 tracking-tight">Review Entry</h1>
        <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all">
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Bill'}
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar pb-32">
        {imageUrl && (
          <div className="relative aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden bg-slate-200 border border-slate-200">
            <img src={imageUrl} alt="Receipt" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
               <div className="text-white w-full">
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Receipt Gross Total</p>
                  <p className="text-4xl font-black tracking-tighter">${formData.totalAmount.toFixed(2)}</p>
               </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Job Site</label>
            <div className="relative">
               <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-sm appearance-none">
                <option value="">Select Site...</option>
                {jobs.map(job => (<option key={job.id} value={job.id}>{job.name}</option>))}
              </select>
              <Layers className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Vendor</label>
              <input type="text" value={formData.merchantName} onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-sm">
                {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bill Amount</label>
              <input type="number" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })} className="w-full bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl px-4 py-4 font-black text-lg" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tax Component</label>
              <input type="number" step="0.01" value={formData.taxAmount} onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 tracking-tight">Bill Breakdown</h3>
            <button onClick={() => setIsSplitMode(!isSplitMode)} className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors ${isSplitMode ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
               {isSplitMode ? 'Split Active' : 'Enable Split'}
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.items.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                <div className="flex gap-2">
                  <input type="text" placeholder="Item..." value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="flex-1 bg-transparent text-sm font-bold" />
                  <input type="number" step="0.01" value={item.amount} onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value) || 0)} className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-black" />
                </div>
                {isSplitMode && (
                  <select value={item.jobId || ''} onChange={(e) => updateItem(idx, 'jobId', e.target.value)} className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black">
                    <option value="">Default Site</option>
                    {jobs.map(job => (<option key={job.id} value={job.id}>{job.name}</option>))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
