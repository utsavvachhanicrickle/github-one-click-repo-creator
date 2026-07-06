import { useSelector, useDispatch } from 'react-redux';
import { AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import { hideToast } from '../store/slices/toastSlice.js';

export default function Toast() {
  const dispatch = useDispatch();
  const { show, message, type } = useSelector((state) => state.toast);

  if (!show) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-in max-w-sm ${
      type === 'error' 
        ? 'bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/80' 
        : type === 'info'
        ? 'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/80'
        : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/80'
    }`}>
      {type === 'error' && <AlertCircle className="text-red-500 dark:text-red-400 shrink-0" size={20} />}
      {type === 'info' && <Info className="text-blue-500 dark:text-blue-400 shrink-0" size={20} />}
      {type === 'success' && <CheckCircle2 className="text-emerald-500 dark:text-emerald-400 shrink-0" size={20} />}
      <div className="text-xs font-semibold flex-1 pr-2 leading-tight">
        {message}
      </div>
      <button 
        onClick={() => dispatch(hideToast())} 
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
