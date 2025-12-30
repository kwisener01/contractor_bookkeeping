export enum ExpenseCategory {
  MATERIAL = 'Material',
  TOOLS = 'Tools',
  LABOR = 'Labor',
  TRAVEL = 'Travel',
  FUEL = 'Fuel',
  PERMITS = 'Permits',
  OTHER = 'Other'
}

export interface ReceiptItem {
  description: string;
  amount: number;
}

export interface ExtractedReceiptData {
  merchantName: string;
  date: string;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  category: ExpenseCategory;
  items: ReceiptItem[];
  notes?: string;
}

export interface ExpenseRecord extends ExtractedReceiptData {
  id: string;
  jobId: string;
  timestamp: number;
  imageUrl?: string;
  isSynced?: boolean;
}

export interface Job {
  id: string;
  name: string;
  client: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  status: 'active' | 'completed' | 'pending';
  isSynced?: boolean;
}