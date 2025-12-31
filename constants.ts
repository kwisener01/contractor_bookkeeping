
import { Job, ExpenseCategory } from './types';

/** 
 * DEPLOYMENT CONFIGURATION
 * Paste your Google Apps Script Web App URL here to make it the default for everyone.
 */
export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyT-LPLPtycDBrm6Rs5AIvrEigUODXBSrF8_WiQ6mXzz1twEsNRjlqenz15hwkspQbT/exec'; 

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

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MATERIAL]: 'bg-blue-100 text-blue-700',
  [ExpenseCategory.TOOLS]: 'bg-orange-100 text-orange-700',
  [ExpenseCategory.LABOR]: 'bg-purple-100 text-purple-700',
  [ExpenseCategory.TRAVEL]: 'bg-green-100 text-green-700',
  [ExpenseCategory.FUEL]: 'bg-red-100 text-red-700',
  [ExpenseCategory.PERMITS]: 'bg-yellow-100 text-yellow-700',
  [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-700',
};
