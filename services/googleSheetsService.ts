
import { ExpenseRecord, Job } from '../types';

/**
 * Sends data to Google Sheets via Apps Script.
 * Flattens multi-job receipts into distinct rows for accounting accuracy.
 */
export const syncToGoogleSheet = async (webhookUrl: string, data: any, metadata?: { jobs?: Job[] }): Promise<boolean> => {
  const trimmedUrl = webhookUrl.trim();
  if (!trimmedUrl || !trimmedUrl.includes('script.google.com/macros/s/')) {
    console.error('Invalid URL: Must be a Google Apps Script Web App URL');
    return false;
  }

  try {
    let payload: any;

    if (data.type === 'test') {
      payload = data;
    } else if ('client' in data) {
      // It's a Job Sync
      payload = {
        type: 'job',
        id: data.id,
        name: data.name,
        client: data.client,
        address: data.address,
        contactName: data.contactName || '',
        phone: data.phone || '',
        email: data.email || '',
        status: data.status,
        budget: data.budget || 0, // FIXED: Added budget to sync payload
        syncTimestamp: new Date().toISOString()
      };
    } else {
      // It's an Expense Sync
      const record = data as ExpenseRecord;
      
      const flattenedEntries = record.items.map((item, index) => {
        const jobId = item.jobId || record.jobId;
        const jobName = metadata?.jobs?.find(j => j.id === jobId)?.name || 'Default';
        
        return {
          id: `${record.id}_${index}`, // Deterministic ID for stable updates
          receiptId: record.id,
          date: record.date || new Date(record.timestamp).toLocaleDateString(),
          merchantName: record.merchantName,
          jobId: jobId,
          jobName: jobName,
          category: record.category,
          amount: item.amount,
          description: item.description,
          notes: record.notes || '',
          syncTimestamp: new Date().toISOString()
        };
      });

      payload = {
        type: 'expense_batch',
        receiptId: record.id,
        entries: flattenedEntries
      };
    }

    // Using 'no-cors' for POST ensures the data reaches the script even if the script's
    // redirect response doesn't perfectly satisfy CORS pre-flight.
    await fetch(trimmedUrl, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    // In no-cors mode we can't read response.ok, so we assume it sent if it didn't throw.
    return true; 
  } catch (error) {
    console.error('Network error during sync:', error);
    return false; // Return false so App.tsx knows to try again later
  }
};

/**
 * Fetches all data from Google Sheets (Two-Way Sync)
 */
export const fetchFromCloud = async (webhookUrl: string): Promise<{ jobs: Job[], expenses: ExpenseRecord[] } | null> => {
  const trimmedUrl = webhookUrl.trim();
  if (!trimmedUrl || !trimmedUrl.includes('script.google.com/macros/s/')) {
    return null;
  }
  
  try {
    const response = await fetch(trimmedUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow'
    });

    if (!response.ok) return null;
    
    const cloudData = await response.json();
    
    if (!cloudData || (typeof cloudData === 'object' && 'error' in cloudData)) return null;
    
    // Process Jobs
    const jobs: Job[] = (cloudData.jobs || []).map((j: any) => ({
      id: j.id,
      name: j.name,
      client: j.client,
      address: j.address,
      contactName: j.contactName,
      phone: j.phone,
      email: j.email, // FIXED: Ensure email is captured from cloud
      status: j.status,
      budget: parseFloat(j.budget) || 0, // FIXED: Ensure budget is captured from cloud
      isSynced: true
    }));

    // Process Expenses
    const expenses: ExpenseRecord[] = (cloudData.expenses || []).map((e: any) => ({
      id: e.id,
      jobId: e.jobId,
      merchantName: e.merchantName,
      date: e.date,
      totalAmount: parseFloat(e.amount || e.totalAmount) || 0,
      taxAmount: parseFloat(e.taxAmount) || 0,
      currency: '$',
      // Fix: Removed ExpenseCategory usage which was causing a compilation error.
      // Now using string as per types.ts definition.
      category: (e.category as string) || 'Other',
      items: [{ 
        description: e.description || 'General Item', 
        amount: parseFloat(e.amount || e.totalAmount) || 0, 
        jobId: e.jobId 
      }], 
      notes: e.notes,
      timestamp: new Date(e.date).getTime() || Date.now(),
      isSynced: true
    }));

    return { jobs, expenses };
  } catch (err) {
    console.error("Cloud Connection Error:", err);
    return null;
  }
};
