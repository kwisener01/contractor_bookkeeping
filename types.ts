
export enum ExpenseCategory {
  MATERIAL = 'Material',
  TOOLS = 'Tools',
  LABOR = 'Labor',
  TRAVEL = 'Travel',
  FUEL = 'Fuel',
  PERMITS = 'Permits',
  OTHER = 'Other'
}

export enum UserRole {
  ADMIN = 'Admin',
  USER = 'User'
}

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface ReceiptItem {
  description: string;
  amount: number;
  jobId?: string; // Optional: individual item can belong to a specific job
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
  suggestedJobId?: string; // AI suggested job ID based on content mapping
}

export interface ExpenseRecord extends ExtractedReceiptData {
  id: string;
  jobId: string; // The "Primary" or "Default" job for the receipt
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
