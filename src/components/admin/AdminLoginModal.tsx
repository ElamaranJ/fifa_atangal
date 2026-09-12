import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginAdmin } = useTournament();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter admin PIN');
      return;
    }
    const ok = loginAdmin(pin.trim());
    if (ok) {
      setError('');
      setPin('');
      onClose();
    } else {
      setError('Incorrect PIN. Default is "admin123"');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1d6bf3]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 truncate">Admin Authentication</h3>
            <p className="text-xs text-slate-500">Unlock tournament editing and scores</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Admin Passkey / PIN
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin PIN..."
                autoFocus
                className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1d6bf3] focus:ring-2 focus:ring-[#1d6bf3]/20 font-mono tracking-widest text-lg"
              />
              <Lock className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#1d6bf3] font-medium">
                Hint: Default PIN is <span className="font-bold underline">admin123</span>
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 min-h-[44px] rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm shadow-blue-glow transition-all flex items-center justify-center"
            >
              Unlock Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
