
import React, { useState } from 'react';
import { Plus, Briefcase, MapPin, Phone, Mail, User, X, Trash2, AlertTriangle, Edit2, Cloud, UserCircle2, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Job, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

interface JobManagerProps {
  jobs: Job[];
  onAddJob: (job: Job) => Promise<void>;
  onUpdateJob: (job: Job) => Promise<void>;
  onDeleteJob: (id: string) => void;
  onSyncAll?: () => Promise<void>;
  isCloudConnected: boolean;
  userRole: UserRole;
}

export const JobManager: React.FC<JobManagerProps> = ({ 
  jobs, 
  onAddJob, 
  onUpdateJob, 
  onDeleteJob, 
  onSyncAll,
  isCloudConnected,
  userRole
}) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
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

  const isAdmin = userRole === UserRole.ADMIN;
  const unsyncedCount = jobs.filter(j => !j.isSynced).length;

  const resetForm = () => {
    setFormData({ name: '', client: '', address: '', contactName: '', phone: '', email: '', status: 'active' });
    setIsAdding(false);
    setJobToEdit(null);
  };

  const handleEdit = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setFormData({ ...job });
    setJobToEdit(job);
  };

  const handleDeleteRequest = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setJobToDelete(job);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.client || !isAdmin) return;

    if (jobToEdit) {
      await onUpdateJob({ ...jobToEdit, ...formData } as Job);
    } else {
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

  const navigateToJobExpenses = (jobId: string) => {
    navigate('/history', { state: { jobId } });
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Sites</h1>
        <div className="flex items-center gap-2">
          {isAdmin && isCloudConnected && unsyncedCount > 0 && (
            <button 
              onClick={() => onSyncAll?.()}
              className="bg-green-50 text-green-600 px-3 py-2.5 rounded-2xl border border-green-100 flex items-center gap-2"
            >
              <Cloud size={16} />
              <span className="text-xs font-black uppercase tracking-tight">Sync</span>
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="text-xs font-bold pr-1">New Site</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 px-6">
            <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No project sites assigned.</p>
          </div>
        ) : (
          jobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => navigateToJobExpenses(job.id)}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative group active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-lg text-slate-800 truncate">{job.name}</h3>
                    {isAdmin && job.isSynced && <Cloud size={14} className="text-green-500 shrink-0" />}
                  </div>
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wide">{job.client}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    job.status === 'active' ? 'bg-green-100 text-green-700' : 
                    job.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {job.status}
                  </span>
                  <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-slate-500 text-xs">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{job.address || 'No address provided'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                    <UserCircle2 size={12} className="text-slate-400" />
                    <span className="truncate">{job.contactName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                    <Phone size={12} className="text-slate-400" />
                    <span>{job.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium sm:col-span-2">
                    <Mail size={12} className="text-slate-400" />
                    <span className="truncate">{job.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => handleEdit(e, job)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl"><Edit2 size={14} /></button>
                  <button onClick={(e) => handleDeleteRequest(e, job)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isAdmin && (isAdding || jobToEdit) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-800">{jobToEdit ? 'Edit Project Site' : 'New Project Site'}</h2>
              <button onClick={resetForm} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Living Room Remodel" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Client Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Site Address</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Builder Lane" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="Project Contact" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                    <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="555-0000" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                    <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@email.com" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Status</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold appearance-none" 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl mt-4 active:scale-95 transition-all">
                {jobToEdit ? 'Update Site' : 'Create Site'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAdmin && jobToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center">
            <AlertTriangle size={32} className="mx-auto text-red-500 mb-6" />
            <h3 className="text-xl font-black text-slate-800 mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-500 font-medium">This will remove "{jobToDelete.name}" permanently.</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setJobToDelete(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600">Cancel</button>
              <button onClick={() => { onDeleteJob(jobToDelete.id); setJobToDelete(null); }} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
