import React, { useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Flame, Trophy, X, ChevronRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QualificationModal: React.FC = () => {
  const { 
    showQualificationModal, 
    setShowQualificationModal, 
    overallStats, 
    groupAStats, 
    groupBStats, 
    tournament, 
    isAdmin, 
    startPlayoffs 
  } = useTournament();

  useEffect(() => {
    if (showQualificationModal) {
      // Fire confetti cannons
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch {
        // Safe if canvas-confetti fails
      }
    }
  }, [showQualificationModal]);

  if (!showQualificationModal) return null;

  // Determine top 4 qualified
  let qualified = overallStats.slice(0, 4);
  if (tournament.qualification_method === 'TWO_GROUPS_TOP_2_EACH') {
    const topA = groupAStats.slice(0, 2);
    const topB = groupBStats.slice(0, 2);
    qualified = [topA[0], topB[0], topA[1], topB[1]].filter(Boolean);
  }

  const handleStartPlayoffs = () => {
    setShowQualificationModal(false);
    startPlayoffs();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-pitch-card border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center overflow-hidden">
        
        {/* Background glow orb */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => setShowQualificationModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-pitch-panel"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold mb-3 tracking-widest uppercase animate-pulse">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>LEAGUE STAGE COMPLETED</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-2">
          🔥 TOP 4 QUALIFIED 🔥
        </h2>
        <p className="text-sm text-slate-300 mb-8 max-w-md mx-auto">
          The league battle has concluded! Contenders #1 & #2 earn a double chance in <span className="text-emerald-400 font-bold">Qualifier 1</span>, while #3 & #4 enter the high-stakes <span className="text-rose-400 font-bold">Eliminator</span>!
        </p>

        {/* 4 Qualified Player Cards with staggered animated appearance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {qualified.map((player, idx) => (
            <div
              key={player.player_id}
              className="bg-pitch-darkest/80 border border-pitch-border hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:scale-105 shadow-lg group relative overflow-hidden"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold flex items-center justify-center">
                #{idx + 1}
              </div>
              <PlayerAvatar
                name={player.player_name}
                photo={player.player_photo}
                size="lg"
                glow
                className="mb-3 group-hover:scale-110 transition-transform"
              />
              <h4 className="font-bold text-sm text-white truncate max-w-full">
                {player.player_name}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                {player.points} PTS • {player.total_goals} G
              </span>
              <div className={`mt-2 text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${
                idx < 2 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {idx < 2 ? 'QUALIFIER 1 🟢' : 'ELIMINATOR ⚡'}
              </div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setShowQualificationModal(false)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-pitch-border text-slate-300 hover:bg-pitch-panel text-sm font-semibold transition-all"
          >
            View League Table
          </button>
          {isAdmin ? (
            <button
              onClick={handleStartPlayoffs}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-display font-extrabold text-base hover:brightness-110 shadow-glow-gold flex items-center justify-center gap-2 transition-all"
            >
              <Trophy className="w-5 h-5 text-slate-950" />
              <span>START PLAYOFF BRACKET</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>
          ) : (
            <button
              onClick={() => setShowQualificationModal(false)}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-cyan-500 text-slate-950 font-display font-bold text-base hover:brightness-110 shadow-glow-cyan"
            >
              Check Playoff Bracket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
