import React, { useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Flame, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GoldenBootCelebrationModal: React.FC = () => {
  const { newGoldenBootLeaderAlert, setNewGoldenBootLeaderAlert } = useTournament();

  useEffect(() => {
    if (newGoldenBootLeaderAlert) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#fbbf24', '#eab308'],
        });
      } catch {
        // Safe ignore
      }
    }
  }, [newGoldenBootLeaderAlert]);

  if (!newGoldenBootLeaderAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md bg-pitch-card border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-glow-gold text-center overflow-hidden max-h-[90dvh] overflow-y-auto my-auto">
        
        {/* Glow backdrop */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/30 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => setNewGoldenBootLeaderAlert(null)}
          aria-label="Close"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-pitch-panel min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-mono font-bold mb-3 uppercase tracking-widest animate-bounce">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>NEW GOLDEN BOOT LEADER!</span>
        </div>

        <div className="my-4 sm:my-5 flex flex-col items-center">
          <div className="relative">
            <PlayerAvatar
              name={newGoldenBootLeaderAlert.player_name}
              photo={newGoldenBootLeaderAlert.player_photo}
              size="xl"
              className="sm:hidden ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
              glow
            />
            <PlayerAvatar
              name={newGoldenBootLeaderAlert.player_name}
              photo={newGoldenBootLeaderAlert.player_photo}
              size="2xl"
              className="hidden sm:block ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
              glow
            />
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-pitch-darkest flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <h3 className="mt-3 sm:mt-4 font-display text-xl sm:text-3xl font-black text-white tracking-wide">
            {newGoldenBootLeaderAlert.player_name}
          </h3>
          <span className="text-xs font-semibold text-slate-400 mt-0.5">
            {newGoldenBootLeaderAlert.group_name || 'Tournament Top Scorer'}
          </span>
        </div>

        {/* Goals Pill */}
        <div className="p-3.5 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl sm:text-5xl font-display font-black text-amber-300">
              {newGoldenBootLeaderAlert.total_goals}
            </span>
            <div className="text-left leading-tight">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Goals Scored</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {newGoldenBootLeaderAlert.goals_per_match} Goals / Match
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setNewGoldenBootLeaderAlert(null)}
          className="w-full py-3.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-bold text-sm sm:text-base hover:brightness-110 shadow-glow-gold transition-all flex items-center justify-center"
        >
          View Golden Boot Standings
        </button>
      </div>
    </div>
  );
};
