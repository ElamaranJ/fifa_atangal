import React, { useState, useRef, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Trophy, 
  Trash2, 
  Layers
} from 'lucide-react';
import { TournamentIndexEntry } from '../../types/tournament';

interface TournamentSwitcherProps {
  onOpenCreateModal: () => void;
  onOpenAdminLogin: () => void;
}

export const TournamentSwitcher: React.FC<TournamentSwitcherProps> = ({
  onOpenCreateModal,
  onOpenAdminLogin,
}) => {
  const { 
    tournament, 
    tournamentIndex, 
    activeTournamentId, 
    switchTournament, 
    deleteTournament, 
    isAdmin 
  } = useTournament();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setConfirmDeleteId(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getStatusBadge = (status: TournamentIndexEntry['status']) => {
    switch (status) {
      case 'SETUP':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
            Setup
          </span>
        );
      case 'LEAGUE':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 border border-blue-500/30">
            League
          </span>
        );
      case 'QUALIFICATION':
      case 'SEMI_FINALS':
      case 'FINAL':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 border border-purple-500/30">
            Playoffs
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const handleSwitch = (id: string) => {
    switchTournament(id);
    setIsOpen(false);
    setConfirmDeleteId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      await deleteTournament(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/95 hover:bg-slate-50 border border-slate-200/90 shadow-sm transition-all text-slate-800 active:scale-95 group min-h-[38px] sm:min-h-[40px]"
        title="Switch active tournament"
        aria-label="Switch active tournament"
      >
        <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center text-[#1d6bf3] shrink-0">
          <Layers className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col text-left max-w-[110px] sm:max-w-[160px] truncate">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-tight">
            {tournament?.tournament_name || 'Tournament'}
          </span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
            {tournamentIndex.length > 1 ? `${tournamentIndex.length} Tournaments` : 'Active'}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#1d6bf3]' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Dropdown Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#1d6bf3]" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Tournaments
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
              {tournamentIndex.length} Total
            </span>
          </div>

          {/* Tournaments List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {tournamentIndex.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No tournaments found
              </div>
            ) : (
              tournamentIndex.map((entry) => {
                const isActive = entry.id === (tournament?.id || activeTournamentId);

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleSwitch(entry.id)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-900 border border-blue-200/70 font-bold'
                        : 'hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="shrink-0">
                        {isActive ? (
                          <div className="w-5 h-5 rounded-full bg-[#1d6bf3] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold truncate">
                          {entry.tournament_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getStatusBadge(entry.status)}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Delete Tournament Action */}
                    {isAdmin && tournamentIndex.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(e, entry.id)}
                        title={confirmDeleteId === entry.id ? 'Click again to confirm delete' : 'Delete tournament'}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          confirmDeleteId === entry.id
                            ? 'bg-rose-600 text-white font-bold text-[10px] px-2'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        {confirmDeleteId === entry.id ? (
                          <span>Confirm</span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* New Tournament Action Footer */}
          <div className="p-2 border-t border-slate-200/80 bg-slate-50">
            <button
              onClick={() => {
                setIsOpen(false);
                if (isAdmin) {
                  onOpenCreateModal();
                } else {
                  onOpenAdminLogin();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1d6bf3] hover:bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Tournament</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
