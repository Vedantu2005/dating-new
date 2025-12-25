import React from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

export const AlertModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;
  const iconColor = isSuccess ? 'text-green-400' : 'text-red-400';
  const bgColor = isSuccess ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isSuccess ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-[scaleUp_0.3s_ease-out]">
        
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${bgColor} ${borderColor} border-4`}>
            <Icon size={32} className={iconColor} strokeWidth={3} />
          </div>
          
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{title}</h3>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6">{message}</p>
          
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-white text-black rounded-xl font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]"
          >
            Okay, Got it
          </button>
        </div>

      </div>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-[scaleUp_0.3s_ease-out]">
        
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <Info size={28} className="text-sky-400" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-zinc-400 text-sm mb-6">{message}</p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg active:scale-[0.98] transition-all ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-500' 
                  : 'bg-gradient-to-r from-sky-400 to-blue-600 hover:opacity-90'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};