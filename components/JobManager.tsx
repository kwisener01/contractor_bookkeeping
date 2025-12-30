import React, { useState } from 'react';
import { Plus, Briefcase, MapPin, Phone, Mail, User, X, ChevronRight, Trash2, AlertTriangle, Edit2, Cloud, CloudOff, UserCircle2, RefreshCw } from 'lucide-react';
import { Job } from '../types';

interface JobManagerProps {
  jobs: Job[];
  onAddJob: (job: Job) => Promise<void>;
  onUpdateJob: (job: Job) => Promise<void>;
  onDeleteJob: (id: string) => void;
  onSyncAll?: () => Promise<void>;
  isCloudConnected: boolean;
}

export const JobManager: React.FC<JobManagerProps> = ({ 
  jobs, 
  onAddJob, 
  onUpdateJob, 
  onDeleteJob, 
  onSyncAll,
  isCloudConnected 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [formData, setFormData] = useState<Partial<Job>>({
    name: '',
    client: '',
    address: '',
    contactName: '',
    phone: '',
    email: '',
    status: 'active'
  });

  const unsyncedCount = jobs.filter(j => !j.isSynced).length;

  const resetForm = () => {
    setFormData({
      name: '',
      client: '',
      address: '',
      contactName: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setIsAdding(false);
    setJobToEdit(null);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const startEdit = (job: Job) => {
    setFormData({ ...job });
    setJobToEdit(job);
  };

  const handleSyncAll = async () => {
    if (!onSyncAll || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncAll();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.client) return;

    if (jobToEdit) {
      // Update existing
      await onUpdateJob({ ...jobToEdit, ...formData } as Job);
    } else {
      // Create new
      const job: Job = {
        name: formData.name || '',
        client: formData.client || '',
        address: formData.address || '',
        contactName: formData.contactName || '',
        phone: formData.phone || '',
        email: formData.email || '',
        status: (formData.status as any) || 'active',
        id: `job-${Math.random().toString(36).substr(2, 9)}`,
        isSynced: false
      };
      await onAddJob(job);
    }
    resetForm();
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      onDeleteJob(jobToDelete.id);
      setJobToDelete(null);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Sites</h1>
        <div className="flex items-center gap-2">
          {isCloudConnected && unsyncedCount > 0 && (
            <button 
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="bg-green-50 text-green-600 px-3 py-2.5 rounded-2xl border border-green-100 shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
              <span className="text-xs font-black uppercase tracking-tight">Sync {unsyncedCount}</span>
            </button>
          )}
          <button 
            onClick={startAdd}
            className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="text-xs font-bold pr-1">Add Project</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 px-6">
            <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No projects yet. Add your first site to start tracking expenses.</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group transition-all hover:border-blue-200">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-lg text-slate-800 truncate">{job.name}</h3>
                    {job.isSynced ? (
                      <Cloud size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <CloudOff size={14} className="text-slate-300 shrink-0" title="Not Synced" />
                    )}
                  </div>
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wide">{job.client}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    job.status === 'active' ? 'bg-green-100 text-green-700' : 
                    job.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-slate-500 text-xs">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{job.address || 'No address provided'}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                  {job.contactName && (
                    <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                      <UserCircle2 size={12} className="text-slate-400" />
                      {job.contactName}
                    </div>
                  )}
                  {job.phone && (
                    <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                      <Phone size={12} className="text-slate-400" />
                      {job.phone}
                    </div>
                  )}
                  {job.email && (
                    <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium truncate">
                      <Mail size={12} className="text-slate-400" />
                      {job.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                 <button 
                  onClick={() => startEdit(job)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => setJobToDelete(job)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {jobToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Delete Project?</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">This will remove "{jobToDelete.name}" and all associated metadata. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setJobToDelete(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {(isAdding || jobToEdit) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <h2 className="text-xl font-black text-slate-800">{jobToEdit ? 'Edit Project Site' : 'New Project Site'}</h2>
              <button onClick={resetForm} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Living Room Remodel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Client Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. John Wick"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                  value={formData.client} 
                  onChange={e => setFormData({...formData, client: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Site Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                  <textarea 
                    rows={2}
                    placeholder="123 Builder Lane, City, State"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all resize-none" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Person</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        placeholder="Contact person's name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                        value={formData.contactName} 
                        onChange={e => setFormData({...formData, contactName: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="tel" 
                          placeholder="555-0123"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="email" 
                          placeholder="client@example.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-200 active:scale-95 transition-all mt-4 mb-4">
                {jobToEdit ? 'Update Project' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};