import React, { useState } from 'react';
import { ChevronLeft, Cloud, Copy, Check, ExternalLink, Info, Database, AlertCircle, Send, RefreshCw, HelpCircle, ShieldCheck, Terminal, MousePointer2 } from 'lucide-react';
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

  const scriptCode = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("System_Logs");
  if (!logSheet) { logSheet = ss.insertSheet("System_Logs"); logSheet.appendRow(["Time", "Status", "Message"]); }
  
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No data received");
    var data = JSON.parse(e.postData.contents);

    // --- CASE 1: Test Connection ---
    if (data.type === 'test') {
      var sheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
      sheet.appendRow([new Date().toLocaleDateString(), "APP TEST", "N/A", "System", 0, 0, "Connection verified!"]);
      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }

    // --- CASE 2: Project Sync (Jobs) ---
    if (data.type === 'job') {
      var jobSheet = ss.getSheetByName("Jobs");
      if (!jobSheet) {
        jobSheet = ss.insertSheet("Jobs");
        jobSheet.appendRow(["Job ID", "Project Name", "Client", "Address", "Contact", "Phone", "Email", "Status", "Last Updated"]);
        jobSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#f3f4f6").setBorder(true, true, true, true, true, true);
        jobSheet.setFrozenRows(1);
      }
      
      var rows = jobSheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.id) { rowIndex = i + 1; break; }
      }
      
      var jobData = [data.id, data.name, data.client, data.address, data.contactName, data.phone, data.email, data.status, new Date()];
      if (rowIndex > 0) {
        jobSheet.getRange(rowIndex, 1, 1, 9).setValues([jobData]);
      } else {
        jobSheet.appendRow(jobData);
      }
      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }

    // --- CASE 3: Expense Sync ---
    var expSheet = ss.getSheetByName("Expenses");
    if (!expSheet) {
      expSheet = ss.insertSheet("Expenses");
      expSheet.appendRow(["Date", "Merchant", "Project", "Category", "Total", "Tax", "Notes"]);
      expSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6").setBorder(true, true, true, true, true, true);
      expSheet.setFrozenRows(1);
    }
    expSheet.appendRow([data.date, data.merchantName, data.jobName, data.category, data.totalAmount, data.taxAmount, data.notes]);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    if (logSheet) logSheet.appendRow([new Date(), "ERROR", err.message]);
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

  const isSpreadsheetUrl = url.includes('docs.google.com/spreadsheets/');
  const isInvalidUrl = url.length > 0 && !url.includes('script.google.com/macros/s/');

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-24">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-slate-800 tracking-tight">Cloud Sync Settings</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
        {/* Connection Box */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Connection Link</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Google Apps Script Web App</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`w-full bg-slate-50 border ${isInvalidUrl || isSpreadsheetUrl ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-200'} rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all`}
              />
              {isSpreadsheetUrl && (
                <p className="text-[10px] font-bold text-red-500 uppercase px-2">You pasted the Sheet URL. Use the Web App URL instead.</p>
              )}
            </div>

            <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
              Save Link
            </button>

            {sheetUrl && (
              <button onClick={handleTest} disabled={testStatus === 'testing'} className="w-full bg-white border border-slate-200 py-3 rounded-2xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
                {testStatus === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {testStatus === 'success' ? 'Row Sent! Check Sheet' : testStatus === 'error' ? 'Connection Failed' : 'Send Test Row'}
              </button>
            )}
          </div>
        </div>

        {/* Sync Golden Rules */}
        <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} />
            <h3 className="font-black uppercase text-xs tracking-[0.2em]">The Sync Golden Rule</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Execute As</p>
              <p className="text-sm font-bold">Set to: <span className="bg-white text-blue-600 px-2 py-0.5 rounded text-xs ml-1">Me</span></p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Who has access</p>
              <p className="text-sm font-bold">Set to: <span className="bg-white text-blue-600 px-2 py-0.5 rounded text-xs ml-1">Anyone</span></p>
            </div>
          </div>
        </div>

        {/* Quick Setup Guide */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <MousePointer2 size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Deployment Steps</h3>
          </div>
          
          <div className="space-y-4">
            {[
              "Go to Extensions > Apps Script in your Sheet.",
              "Paste the code below and click Save.",
              "Click Deploy (Blue Button) > New Deployment.",
              "Select 'Web App' as the type.",
              "Set 'Execute as' to ME.",
              "Set 'Who has access' to ANYONE.",
              "Click Deploy, authorize, and Copy the URL."
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black shrink-0">{idx + 1}</div>
                <p className="text-xs font-medium text-slate-600">{step}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-4">
            <div className="absolute top-3 right-3 z-10">
              <button 
                onClick={handleCopy}
                className="p-2 bg-white rounded-lg text-slate-600 shadow-sm active:scale-90 transition-all border border-slate-200 flex items-center gap-2 text-[10px] font-bold"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-400 p-4 pt-14 rounded-2xl overflow-x-auto text-[10px] font-mono leading-relaxed max-h-[350px] border border-slate-800 no-scrollbar">
              {scriptCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};