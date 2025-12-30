import { ExpenseRecord, Job } from '../types';

/**
 * Sends data to Google Sheets via Apps Script.
 * Now handles both Expenses and Jobs.
 */
export const syncToGoogleSheet = async (webhookUrl: string, data: any, metadata?: { jobName?: string }): Promise<boolean> => {
  if (!webhookUrl || !webhookUrl.includes('script.google.com/macros/s/')) {
    console.error('Invalid URL: Must be a Google Apps Script Web App URL');
    return false;
  }

  try {
    let payload: any;

    // Detect if this is a Job or an Expense based on properties or an explicit flag
    if (data.type === 'test') {
      payload = data;
    } else if ('client' in data) {
      // It's a Job
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
        syncTimestamp: new Date().toISOString()
      };
    } else {
      // It's an Expense
      payload = {
        type: 'expense',
        date: data.date || new Date(data.timestamp).toLocaleDateString(),
        merchantName: data.merchantName || 'Unknown Merchant',
        jobName: metadata?.jobName || 'Unknown',
        category: data.category || 'Other',
        totalAmount: data.totalAmount || 0,
        taxAmount: data.taxAmount || 0,
        notes: data.notes || '',
        syncTimestamp: new Date().toISOString()
      };
    }

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error('Network error during sync:', error);
    return false;
  }
};