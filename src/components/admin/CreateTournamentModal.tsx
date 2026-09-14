import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlusCircle, X, Trophy, Sparkles } from 'lucide-react';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({ isOpen, onClose }) => {
  const { createNewTournament, isAdmin } = useTournament();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Admin authorization required.');
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tournament name is required.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await createNewTournament(trimmed);
      setName('');
      onClose();
    } catch (err: any) {
      console.error('[MultiTournament] Failed to create tournament:', err);
      setError(err?.message || 'Failed to create tournament.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-400/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[0_20px_60px_rgba(29,107,243,0.25)] space-y-5 text-white relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#1d6bf3]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1d6bf3]/20 border border-[#1d6bf3]/40 flex items-center justify-center text-[#1d6bf3] shrink-0 shadow-md">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Multi-Tournament</span>
              </span>
              <h3 className="font-display text-lg font-black text-white">
                Create New Tournament
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Start a new tournament without affecting any ongoing tournaments. All tournaments share the Master Roster and permanent Hall of Fame.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Tournament Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Season 6, Attangal Super Cup 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1d6bf3] to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreating ? 'Creating...' : 'Create Tournament'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
