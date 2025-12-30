
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Loader2, Image as ImageIcon, ChevronLeft, Info, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { processReceipt } from '../services/geminiService';
import { ExtractedReceiptData } from '../types';

interface ReceiptScannerProps {
  onDataExtracted: (data: ExtractedReceiptData, imageUrl: string) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onDataExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Analyzing receipt...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const messages = [
    "Detecting merchant name...",
    "Extracting line items...",
    "Calculating taxes and totals...",
    "Categorizing expense...",
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

    // Optional: Validate file size (e.g., < 10MB)
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
          const data = await processReceipt(base64);
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
      // Force the browser to trigger the native camera app
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      // Standard file picker for gallery selection
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-slate-800">Scanner</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative">
          <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 transform -rotate-3">
            <Camera size={56} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-400 rounded-2xl flex items-center justify-center text-white border-4 border-slate-50 shadow-lg">
            <Sparkles size={20} />
          </div>
        </div>
        
        <div className="text-center max-w-xs">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Receipt Scan</h2>
          <p className="text-slate-500 mt-2 font-medium">Snap a clear photo of your receipt. Our AI handles the rest.</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="grid grid-cols-1 w-full gap-4 pt-4">
          <button
            onClick={triggerCamera}
            disabled={isProcessing}
            className="group flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-6 rounded-3xl shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <Camera className="group-active:scale-110 transition-transform" />
            <span className="text-lg">Open Camera</span>
          </button>

          <button
            onClick={triggerUpload}
            disabled={isProcessing}
            className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 font-bold py-4 px-6 rounded-3xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Upload size={20} />
            Photo Library
          </button>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3 max-w-sm">
          <Info size={20} className="text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            <span className="font-bold">Pro Tip:</span> Flatten the receipt and ensure good lighting for the best extraction accuracy.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 w-full text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
      </div>

      {/* Full Screen Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-xs w-full text-slate-900">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
               <div className="bg-blue-50 p-6 rounded-full relative">
                  <Loader2 size={48} className="animate-spin text-blue-600" />
               </div>
            </div>
            <p className="text-2xl font-black text-center tracking-tight">Processing</p>
            <div className="h-6 mt-2 overflow-hidden w-full">
              <p className="text-sm font-bold text-blue-600 text-center animate-in slide-in-from-bottom-2">
                {statusMessage}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-6 overflow-hidden">
               <div className="bg-blue-600 h-full w-1/3 animate-[loading_2s_infinite]"></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
