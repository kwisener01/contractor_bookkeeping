import React, { useState, useEffect } from 'react';
import { ExtractedReceiptData, Job, ExpenseCategory, ExpenseRecord } from '../types';
import { ChevronLeft, Save, Plus, X, Tag, StickyNote, Calculator, Cloud, CloudOff, Loader2 } from 'lucide-react';
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
  const [selectedJobId, setSelectedJobId] = useState<string>(existingRecord?.jobId || '');
  const [shouldSync, setShouldSync] = useState(hasSyncUrl);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedJobId) {
      alert("Please select a project for this expense.");
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
        isSynced: existingRecord?.isSynced || false
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
      items: [...formData.items, { description: '', amount: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const syncTotalWithItems = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    setFormData(prev => ({ ...prev, totalAmount: itemsTotal }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-slate-800">{existingRecord ? 'Edit Expense' : 'Review Expense'}</h1>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 min-w-[100px] justify-center"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {existingRecord ? (isSaving ? 'Updating...' : 'Update') : (isSaving ? 'Saving...' : 'Confirm')}
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
        {/* Receipt Preview */}
        {imageUrl && (
          <div className="relative aspect-[4/3] w-full rounded-[2.5rem] overflow-hidden bg-slate-200 shadow-sm border border-slate-200">
            <img src={imageUrl} alt="Receipt" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
               <div className="text-white w-full flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-70 mb-1">Receipt Total</p>
                    <p className="text-4xl font-black tracking-tighter">{formData.currency || '$'}{formData.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className={`${CATEGORY_COLORS[formData.category]} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                     {formData.category}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Sync Settings */}
        {hasSyncUrl && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shouldSync ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                {shouldSync ? <Cloud size={20} /> : <CloudOff size={20} />}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Sync to Google Sheet</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Auto-Backup Enabled</p>
              </div>
            </div>
            <button 
              onClick={() => setShouldSync(!shouldSync)}
              className={`w-12 h-6 rounded-full transition-all relative ${shouldSync ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shouldSync ? 'right-1' : 'left-1 shadow-sm'}`}></div>
            </button>
          </div>
        )}

        {/* Financial Details Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-blue-50/50 border border-blue-100 text-blue-700 rounded-2xl pl-8 pr-4 py-4 outline-none font-black text-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Taxes Paid</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-4 outline-none font-bold text-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Site</label>
            <select
              required
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700"
            >
              <option value="">Choose Site...</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.name} ({job.client})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Merchant / Vendor</label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Date</label>
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none text-sm"
                >
                  {Object.values(ExpenseCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
            <div className="relative">
              <StickyNote className="absolute left-4 top-4 text-slate-300" size={18} />
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add job details or material list..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-medium min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 tracking-tight">Line Items</h3>
            <button onClick={addItem} className="text-blue-600 flex items-center gap-1 text-[10px] font-black bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
              <Plus size={12} /> Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <input
                  type="text"
                  placeholder="Material description"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none font-bold placeholder:text-slate-300 px-2"
                />
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-5 pr-2 py-2 text-xs outline-none font-black"
                  />
                </div>
                <button onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Total of Items</span>
              <span className="text-slate-600 font-black">
                ${formData.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
              </span>
            </div>
            <button 
              onClick={syncTotalWithItems}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Calculator size={14} /> Update Total to Item Sum
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};