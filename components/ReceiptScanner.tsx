
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Loader2, ChevronLeft, Sparkles, Smartphone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { processReceipt } from '../services/geminiService';
import { ExtractedReceiptData, Job } from '../types';

interface ReceiptScannerProps {
  onDataExtracted: (data: ExtractedReceiptData, imageUrl: string) => void;
  jobs: Job[];
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onDataExtracted, jobs }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Analyzing receipt...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const messages = [
    "Detecting merchant name...",
    "Extracting line items...",
    "Mapping to projects...",
    "Calculating taxes and totals...",
    "Almost ready for review..."
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

    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Please take a smaller photo.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const data = await processReceipt(base64, jobs);
          onDataExtracted(data, base64);
        } catch (err) {
          setError("AI extraction failed. Please ensure the photo is clear and try again.");
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

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <div className="bg-white px-6 py-5 flex items-center justify-between z-10 sticky top-0 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-600 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-slate-800 tracking-tight">Receipt Scanner</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col p-6 space-y-8 animate-in fade-in duration-500 justify-center">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Extraction</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
            Snap a photo to instantly extract project costs and merchant details.
          </p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <div className="grid grid-cols-1 gap-4">
          <button onClick={triggerCamera} disabled={isProcessing} className="relative overflow-hidden group flex items-center gap-4 bg-slate-900 text-white font-black py-6 px-6 rounded-[2rem] shadow-xl active:scale-95 transition-all disabled:opacity-50">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
               <Camera size={24} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col items-start text-left">
               <span className="text-base tracking-tight leading-none mb-1">Use Camera</span>
               <span className="text-[10px] opacity-50 uppercase font-black tracking-widest">Snap a new photo</span>
            </div>
          </button>

          <button onClick={triggerUpload} disabled={isProcessing} className="group flex items-center gap-4 bg-white border border-slate-200 text-slate-700 font-black py-6 px-6 rounded-[2rem] shadow-sm hover:border-blue-400 active:scale-95 transition-all disabled:opacity-50">
            <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
               <Upload size={24} className="text-slate-400 group-hover:text-blue-500" />
            </div>
            <div className="flex flex-col items-start text-left">
               <span className="text-base tracking-tight leading-none mb-1">Photo Library</span>
               <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Choose from gallery</span>
            </div>
          </button>
        </div>

        <div className="bg-blue-600/5 p-5 rounded-[2rem] border border-blue-100/50 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
             <Sparkles size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Smart Tip</p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Line-item splits are automatically detected for receipts containing materials for multiple project sites.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 w-full text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-xs w-full text-slate-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-50">
               <div className="h-full bg-blue-600 animate-[progress_10s_linear_infinite]"></div>
            </div>
            <div className="mb-8 relative">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                  <Loader2 size={36} className="animate-spin text-blue-600" />
               </div>
            </div>
            <h3 className="text-xl font-black tracking-tight mb-2">Analyzing Data</h3>
            <p className="text-sm font-bold text-blue-600 text-center min-h-[1.25rem] transition-all">
              {statusMessage}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
      `}</style>
    </div>
  );
};
