
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

export interface ContractorProfile {
  companyName: string;
  phone: string;
  email: string;
  logoUrl?: string;
  logoEmoji?: string;
}

export interface ReceiptItem {
  description: string;
  amount: number;
  jobId?: string; 
}

export interface ExtractedReceiptData {
  merchantName: string;
  date: string;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  category: string; 
  items: ReceiptItem[];
  notes?: string;
  suggestedJobId?: string;
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
  budget: number;
  isSynced?: boolean;
}
