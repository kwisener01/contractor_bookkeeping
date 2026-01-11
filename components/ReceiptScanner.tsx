
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Loader2, ChevronLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { processReceipt } from '../services/geminiService';
import { ExtractedReceiptData, Job } from '../types';

interface ReceiptScannerProps {
  onDataExtracted: (data: ExtractedReceiptData, imageUrl: string) => void;
  jobs: Job[];
  categories: string[];
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onDataExtracted, jobs, categories }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Analyzing receipt...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const messages = [
    "Reading total gross amounts...",
    "Extracting line items...",
    "Applying your categories...",
    "Mapping to projects...",
    "Calculating taxes..."
  ];

  useEffect(() => {
    let interval: number;
    if (isProcessing) {
      let i = 0;
      interval = window.setInterval(() => {
        setStatusMessage(messages[i % messages.length]);
        i++;
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const data = await processReceipt(base64, jobs, categories);
          onDataExtracted(data, base64);
        } catch (err) {
          setError("AI extraction failed. Please ensure the photo is clear.");
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading the image file.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <div className="bg-white px-6 py-5 flex items-center justify-between z-10 sticky top-0 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-600"><ChevronLeft size={20} /></button>
        <h1 className="text-lg font-black text-slate-800 tracking-tight">Receipt Scanner</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col p-6 space-y-8 justify-center">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Snap & Record</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">AI extracts gross totals, tax, and categorizes automatically.</p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex items-center gap-4 bg-slate-900 text-white font-black py-6 px-6 rounded-[2rem] shadow-xl active:scale-95 transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Camera size={24} /></div>
            <div className="flex flex-col items-start">
               <span className="text-base tracking-tight mb-1">Use Camera</span>
               <span className="text-[10px] opacity-50 uppercase font-black tracking-widest">Instant analysis</span>
            </div>
          </button>
        </div>

        <div className="bg-blue-600/5 p-5 rounded-[2rem] border border-blue-100/50 flex gap-4">
          <Sparkles size={18} className="text-blue-600 shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed font-medium">Your custom categories will be used for automatic bookkeeping.</p>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-xs w-full">
            <Loader2 size={36} className="animate-spin text-blue-600 mb-4" />
            <h3 className="text-xl font-black mb-2">AI Extraction</h3>
            <p className="text-sm font-bold text-blue-600 text-center">{statusMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
