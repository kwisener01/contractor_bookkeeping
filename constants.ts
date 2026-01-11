
import { Job } from './types';

export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyT-LPLPtycDBrm6Rs5AIvrEigUODXBSrF8_WiQ6mXzz1twEsNRjlqenz15hwkspQbT/exec'; 

export const DEFAULT_CATEGORIES = [
  'Materials',
  'Sub-Contractors',
  'Tools',
  'Office',
  'Dump',
  'Porta John',
  'Fuel',
  'Travel',
  'Permits',
  'Other'
];

// Added CATEGORY_COLORS to fix the "Module has no exported member 'CATEGORY_COLORS'" error in Dashboard.tsx
export const CATEGORY_COLORS: Record<string, string> = {
  'Materials': 'bg-blue-100 text-blue-700',
  'Sub-Contractors': 'bg-purple-100 text-purple-700',
  'Tools': 'bg-orange-100 text-orange-700',
  'Office': 'bg-slate-100 text-slate-700',
  'Dump': 'bg-red-100 text-red-700',
  'Porta John': 'bg-cyan-100 text-cyan-700',
  'Fuel': 'bg-amber-100 text-amber-700',
  'Travel': 'bg-emerald-100 text-emerald-700',
  'Permits': 'bg-indigo-100 text-indigo-700',
  'Other': 'bg-slate-100 text-slate-700'
};

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    name: 'Living Room Remodel',
    client: 'John Smith',
    address: '123 Oak St, Springfield',
    contactName: 'John Smith',
    phone: '555-0101',
    email: 'john@example.com',
    status: 'active',
    budget: 5000
  },
  {
    id: 'job-2',
    name: 'Kitchen Renovation',
    client: 'Alice Johnson',
    address: '456 Maple Ave, Riverside',
    contactName: 'Alice Johnson',
    phone: '555-0102',
    email: 'alice@example.com',
    status: 'active',
    budget: 15000
  }
];
