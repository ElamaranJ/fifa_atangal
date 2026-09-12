import React, { useState, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { X, Check, Trash2, ShieldAlert, Sparkles, Plus, Minus } from 'lucide-react';

interface ScoreEntryModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({ match, isOpen, onClose }) => {
  const { players, submitMatchResult, deleteMatchResult, submitPlayoffResult, isAdmin } = useTournament();

  const [s1, setS1] = useState<number>(0);
  const [s2, setS2] = useState<number>(0);
  const [p1Pens, setP1Pens] = useState<number>(0);
  const [p2Pens, setP2Pens] = useState<number>(0);
  const [justUpdated, setJustUpdated] = useState(false);
  const [error, setError] = useState<string>('');

  const p1 = players.find(p => p.id === match?.player_1);
  const p2 = players.find(p => p.id === match?.player_2);

  useEffect(() => {
    if (match) {
      setS1(match.player_1_score ?? 0);
      setS2(match.player_2_score ?? 0);
      setP1Pens(match.player_1_penalty_score ?? 0);
      setP2Pens(match.player_2_penalty_score ?? 0);
      setJustUpdated(false);
      setError('');
    }
  }, [match]);

  if (!isOpen || !match || !isAdmin) return null;

  const isPlayoffMatch = match.stage !== 'LEAGUE';
  const isDrawn = s1 === s2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (s1 < 0 || s2 < 0) {
      setError('Scores cannot be negative');
      return;
    }

    if (isPlayoffMatch && isDrawn) {
      if (p1Pens === p2Pens) {
        setError('Playoff matches cannot end in a penalty shootout tie! A winner is required.');
        return;
      }
    }

    if (match.stage === 'SEMI_FINAL') {
      const stageKey = match.group?.includes('1') ? 'SEMI_FINAL_1' : 'SEMI_FINAL_2';
      submitPlayoffResult(stageKey, s1, s2, isDrawn ? p1Pens : undefined, isDrawn ? p2Pens : undefined);
    } else if (match.stage === 'FINAL') {
      submitPlayoffResult('FINAL', s1, s2, isDrawn ? p1Pens : undefined, isDrawn ? p2Pens : undefined);
    } else if (match.stage === 'THIRD_PLACE') {
      submitPlayoffResult('THIRD_PLACE', s1, s2, isDrawn ? p1Pens : undefined, isDrawn ? p2Pens : undefined);
    } else {
      submitMatchResult(match.id, s1, s2);
    }

    setJustUpdated(true);
    setTimeout(() => {
      onClose();
    }, 650);
  };

  const handleDelete = () => {
    deleteMatchResult(match.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
        
        {/* Success overlay animation */}
        {justUpdated && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-200 p-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-display font-extrabold text-emerald-700 text-center">
              ✓ RESULT UPDATED
            </h4>
            <p className="text-xs text-slate-500 text-center">Points table and statistics recalculated!</p>
          </div>
        )}

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4 sm:mb-6 pr-6 pl-6 sm:px-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-mono font-semibold text-[#1d6bf3] mb-2 flex-wrap justify-center">
            <span>Match #{match.match_number}</span>
            <span>•</span>
            <span>{match.group || 'League Stage'}</span>
            <span>•</span>
            <span>Round {match.round}</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {match.status === 'COMPLETED' ? 'Edit Match Result' : 'Enter Match Score'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Players Score Board */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200/80">
            
            {/* Player 1 */}
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 min-w-0">
              <PlayerAvatar
                name={p1?.player_name || 'Player 1'}
                photo={p1?.player_photo}
                size="md"
                className="sm:hidden"
                glow={s1 > s2}
              />
              <PlayerAvatar
                name={p1?.player_name || 'Player 1'}
                photo={p1?.player_photo}
                size="lg"
                className="hidden sm:block"
                glow={s1 > s2}
              />
              <span className="text-xs sm:text-base font-bold text-slate-800 truncate max-w-full px-1">
                {p1?.player_name || 'Player 1'}
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setS1(Math.max(0, s1 - 1))}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg shadow-sm touch-manipulation"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={s1}
                  onChange={(e) => setS1(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 sm:w-14 h-11 sm:h-12 text-center text-xl sm:text-2xl font-display font-extrabold bg-white border-2 border-[#1d6bf3] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setS1(s1 + 1)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg shadow-sm touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 min-w-0">
              <PlayerAvatar
                name={p2?.player_name || 'Player 2'}
                photo={p2?.player_photo}
                size="md"
                className="sm:hidden"
                glow={s2 > s1}
              />
              <PlayerAvatar
                name={p2?.player_name || 'Player 2'}
                photo={p2?.player_photo}
                size="lg"
                className="hidden sm:block"
                glow={s2 > s1}
              />
              <span className="text-xs sm:text-base font-bold text-slate-800 truncate max-w-full px-1">
                {p2?.player_name || 'Player 2'}
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setS2(Math.max(0, s2 - 1))}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg shadow-sm touch-manipulation"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={s2}
                  onChange={(e) => setS2(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 sm:w-14 h-11 sm:h-12 text-center text-xl sm:text-2xl font-display font-extrabold bg-white border-2 border-[#1d6bf3] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d6bf3]/30 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setS2(s2 + 1)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg shadow-sm touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Penalty Shootout section if drawn in Playoffs */}
          {isPlayoffMatch && isDrawn && (
            <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 sm:space-y-3 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-display font-bold text-xs sm:text-sm tracking-wider uppercase">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>MATCH DRAWN • PENALTY SHOOTOUT</span>
              </div>
              <p className="text-[11px] text-center text-amber-700">
                Playoff matches must determine a winner to advance. Enter penalty shootout goals.
              </p>
              <div className="flex items-center justify-around gap-2 sm:gap-4 pt-1">
                <div className="text-center">
                  <span className="text-xs text-slate-600 font-semibold block mb-1 truncate max-w-[110px]">{p1?.player_name}</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={p1Pens}
                    onChange={(e) => setP1Pens(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 sm:w-16 h-10 text-center text-lg sm:text-xl font-display font-bold bg-white border border-amber-300 rounded-lg text-amber-900 shadow-sm"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400">PENS</span>
                <div className="text-center">
                  <span className="text-xs text-slate-600 font-semibold block mb-1 truncate max-w-[110px]">{p2?.player_name}</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={p2Pens}
                    onChange={(e) => setP2Pens(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 sm:w-16 h-10 text-center text-lg sm:text-xl font-display font-bold bg-white border border-amber-300 rounded-lg text-amber-900 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 pt-2">
            {match.status === 'COMPLETED' && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all shadow-sm"
                title="Reset/Delete Match Score"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all shadow-sm flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-4 sm:px-6 min-h-[44px] rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-display font-bold text-sm sm:text-base shadow-blue-glow transition-all flex items-center justify-center"
            >
              SUBMIT RESULT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
