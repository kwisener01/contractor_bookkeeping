
import React, { useState, useEffect } from 'react';
import { ExtractedReceiptData, Job, ExpenseCategory, ExpenseRecord, ReceiptItem } from '../types';
import { ChevronLeft, Save, Plus, X, Tag, StickyNote, Calculator, Cloud, CloudOff, Loader2, Split, Layers, Sparkles } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

interface ExpenseFormProps {
  initialData: ExtractedReceiptData;
  imageUrl: string;
  jobs: Job[];
  onSave: (record: ExpenseRecord, sync: boolean) => Promise<void>;
  onCancel: () => void;
  existingRecord?: ExpenseRecord;
  hasSyncUrl: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  initialData, 
  imageUrl, 
  jobs, 
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
  
  // Determine if we should start in split mode
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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', amount: 0, jobId: isSplitMode ? selectedJobId : undefined }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const syncTotalWithItems = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    setFormData(prev => ({ ...prev, totalAmount: itemsTotal }));
  };

  const hasSmartMap = initialData.suggestedJobId || initialData.items.some(i => i.jobId);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col h-full bg-slate-50 overflow-hidden animate-in slide-in-from-bottom duration-300">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft />
        </button>
        <h1 className="font-black text-slate-800 tracking-tight">
          {existingRecord ? 'Edit Expense' : 'Review Receipt'}
        </h1>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-slate-900 disabled:bg-slate-400 text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Confirm
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar pb-32">
        {hasSmartMap && !existingRecord && (
          <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-lg shadow-blue-100 flex items-center gap-3 animate-in fade-in zoom-in duration-500">
            <div className="bg-white/20 p-2 rounded-xl">
               <Sparkles size={18} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Smart Mapping Active</p>
               <p className="text-sm font-bold">AI automatically matched items to your projects.</p>
            </div>
          </div>
        )}

        {imageUrl && (
          <div className="relative aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden bg-slate-200 shadow-sm border border-slate-200">
            <img src={imageUrl} alt="Receipt" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
               <div className="text-white w-full flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-70 mb-1">Detected Total</p>
                    <p className="text-4xl font-black tracking-tighter">{formData.currency || '$'}{formData.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className={`${CATEGORY_COLORS[formData.category]} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                     {formData.category}
                  </div>
               </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Primary Project</label>
            <div className="relative">
               <select
                required
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-black text-sm transition-all ${
                  initialData.suggestedJobId === selectedJobId && !existingRecord 
                  ? 'border-blue-300 text-blue-700 ring-4 ring-blue-50' 
                  : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="">Select Project...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.name}</option>
                ))}
              </select>
              <Layers className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${initialData.suggestedJobId === selectedJobId && !existingRecord ? 'text-blue-400' : 'text-slate-300'}`} size={18} />
            </div>
          </div>

          <button 
            onClick={() => setIsSplitMode(!isSplitMode)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSplitMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
          >
            <div className="flex items-center gap-3">
              <Split size={18} />
              <span className="text-xs font-black uppercase tracking-tight">Split between projects</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${isSplitMode ? 'bg-blue-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isSplitMode ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Merchant</label>
              <input
                type="text"
                value={formData.merchantName}
                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              >
                {Object.values(ExpenseCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input
                  type="number" step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl pl-8 pr-4 py-4 outline-none font-black text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tax Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input
                  type="number" step="0.01"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-4 outline-none font-bold text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 tracking-tight">Line Items</h3>
            <button onClick={addItem} className="text-blue-600 flex items-center gap-1 text-[10px] font-black bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
              <Plus size={12} /> Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.items.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-3xl border transition-all ${item.jobId && !existingRecord ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Item description..."
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none font-bold placeholder:text-slate-300"
                  />
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">$</span>
                    <input
                      type="number" step="0.01"
                      value={item.amount}
                      onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-5 pr-2 py-2 text-xs outline-none font-black"
                    />
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                
                {isSplitMode && (
                  <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase shrink-0">Project:</span>
                    <select 
                      value={item.jobId || selectedJobId}
                      onChange={(e) => updateItem(idx, 'jobId', e.target.value)}
                      className={`flex-1 bg-white border rounded-lg px-2 py-1 text-[10px] font-black outline-none transition-all ${
                        item.jobId && !existingRecord ? 'border-blue-400 text-blue-700' : 'border-slate-100 text-slate-600'
                      }`}
                    >
                      <option value="">Default Site</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.name}</option>
                      ))}
                    </select>
                    {item.jobId && !existingRecord && <Sparkles size={10} className="text-blue-500" />}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
             <button 
              onClick={syncTotalWithItems}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Calculator size={14} /> Re-Calculate Total from Items
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Additional Notes</label>
           <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add details about project usage..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-medium min-h-[100px] text-sm resize-none"
            />
        </div>
      </div>
    </div>
  );
};
