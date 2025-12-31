
import React, { useState } from 'react';
import { ChevronLeft, Cloud, Copy, Check, ExternalLink, Info, Database, AlertCircle, Send, RefreshCw, HelpCircle, ShieldCheck, Terminal, MousePointer2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingsProps {
  sheetUrl: string;
  onUpdateUrl: (url: string) => void;
  unsyncedCount: number;
  onSyncAll: () => Promise<void>;
  onTestConnection: () => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  sheetUrl, 
  onUpdateUrl, 
  unsyncedCount, 
  onSyncAll,
  onTestConnection
}) => {
  const [url, setUrl] = useState(sheetUrl);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const scriptCode = `function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = { jobs: [], expenses: [] };
    
    var jobSheet = ss.getSheetByName("Jobs");
    if (jobSheet && jobSheet.getLastRow() > 0) {
      var data = jobSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        result.jobs.push({
          id: data[i][0], name: data[i][1], client: data[i][2], 
          address: data[i][3], contactName: data[i][4], 
          phone: data[i][5], email: data[i][6], status: data[i][7]
        });
      }
    }

    var expSheet = ss.getSheetByName("Expenses");
    if (expSheet && expSheet.getLastRow() > 0) {
      var data = expSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        result.expenses.push({
          id: data[i][0], date: data[i][1], merchantName: data[i][2],
          jobId: data[i][3], jobName: data[i][4], category: data[i][5],
          amount: data[i][6], description: data[i][7], notes: data[i][8]
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No data");
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'test') {
      ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }

    if (data.type === 'job') {
      var sheet = ss.getSheetByName("Jobs") || ss.insertSheet("Jobs");
      if (sheet.getLastRow() == 0) {
        sheet.appendRow(["ID", "Name", "Client", "Address", "Contact", "Phone", "Email", "Status", "Updated"]);
        sheet.setFrozenRows(1);
      }
      var rows = sheet.getDataRange().getValues();
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) if (rows[i][0].toString() == data.id.toString()) { foundIdx = i+1; break; }
      var val = [data.id, data.name, data.client, data.address, data.contactName, data.phone, data.email, data.status, new Date()];
      if (foundIdx > 0) sheet.getRange(foundIdx, 1, 1, 9).setValues([val]); else sheet.appendRow(val);
    }

    if (data.type === 'expense_batch') {
      var sheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
      if (sheet.getLastRow() == 0) {
        sheet.appendRow(["Entry ID", "Date", "Merchant", "Job ID", "Job Name", "Category", "Amount", "Description", "Notes"]);
        sheet.setFrozenRows(1);
      }
      
      var rows = sheet.getDataRange().getValues();
      var receiptIdStr = data.receiptId.toString();

      // STRICT DELETE: Matches the receipt ID part exactly to prevent accidental deletes of similar IDs
      for (var i = rows.length - 1; i >= 1; i--) {
        var entryId = rows[i][0].toString();
        if (entryId.split('_')[0] === receiptIdStr) {
          sheet.deleteRow(i + 1);
        }
      }
      
      data.entries.forEach(function(entry) {
        sheet.appendRow([entry.id, entry.date, entry.merchantName, entry.jobId, entry.jobName, entry.category, entry.amount, entry.description, entry.notes]);
      });
    }
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateUrl(url);
  };

  const handleTest = async () => {
    setTestStatus('testing');
    const success = await onTestConnection();
    setTestStatus(success ? 'success' : 'error');
    setTimeout(() => setTestStatus('idle'), 5000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-24">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-slate-800 tracking-tight text-lg">Cloud Settings</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${sheetUrl ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Cloud Link</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Two-Way Sync Connection</p>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="Apps Script Web App URL..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
            />
            <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
              Save & Start Sync
            </button>
            <button onClick={handleTest} disabled={testStatus === 'testing'} className="w-full bg-white border border-slate-200 py-3 rounded-2xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
              {testStatus === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Test Connection
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Update Apps Script</h3>
          <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
            The script has been updated to support <b>Split Project Billing</b>. 
            Please replace your existing code and redeploy as 'Anyone'.
          </p>
          <div className="relative">
             <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-white/80 rounded-lg shadow-sm border text-[10px] font-bold">
               {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
             </button>
             <pre className="bg-slate-900 text-slate-400 p-4 rounded-2xl overflow-x-auto text-[10px] font-mono max-h-[250px] no-scrollbar">
              {scriptCode}
             </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
