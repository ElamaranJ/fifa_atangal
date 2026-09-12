import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Match } from '../../types/tournament';
import { Calendar, Clock, ChevronRight, Play, CheckCircle2 } from 'lucide-react';

interface QuickMatchCardsProps {
  onSelectMatch: (match: Match) => void;
  onEnterScore: (match: Match) => void;
}

export const QuickMatchCards: React.FC<QuickMatchCardsProps> = ({
  onSelectMatch,
  onEnterScore,
}) => {
  const { matches, players, isAdmin, setActiveTab } = useTournament();

  const completedMatches = matches
    .filter(m => m.status === 'COMPLETED')
    .slice(-4)
    .reverse();

  const upcomingMatches = matches
    .filter(m => m.status !== 'COMPLETED')
    .slice(0, 4);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Column 1: Upcoming Matches */}
      <div className="bg-pitch-card/70 border border-pitch-border rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
              Upcoming Matches
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('fixtures')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>All Fixtures</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {upcomingMatches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-pitch-darkest/40 rounded-2xl border border-pitch-border/50">
              No upcoming matches in queue. All fixtures are completed!
            </div>
          ) : (
            upcomingMatches.map((m) => {
              const p1 = getPlayer(m.player_1);
              const p2 = getPlayer(m.player_2);

              return (
                <div
                  key={m.id}
                  className="bg-pitch-darkest/60 border border-pitch-border hover:border-cyan-500/40 rounded-2xl p-3.5 transition-all flex items-center justify-between gap-3 group"
                >
                  <div 
                    onClick={() => onSelectMatch(m)}
                    className="flex-1 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    {/* Player 1 */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <PlayerAvatar name={p1?.player_name || 'P1'} photo={p1?.player_photo} size="sm" />
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {p1?.player_name}
                      </span>
                    </div>

                    {/* VS Badge */}
                    <div className="px-2 py-1 rounded bg-pitch-panel border border-pitch-border text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      VS
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {p2?.player_name}
                      </span>
                      <PlayerAvatar name={p2?.player_name || 'P2'} photo={p2?.player_photo} size="sm" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-pitch-border">
                    {isAdmin ? (
                      <button
                        onClick={() => onEnterScore(m)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span className="hidden sm:inline">Score</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectMatch(m)}
                        className="p-1.5 rounded-lg bg-pitch-panel text-slate-300 hover:text-cyan-300 text-xs transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Column 2: Recent Match Results */}
      <div className="bg-pitch-card/70 border border-pitch-border rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
              Recent Match Results
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('fixtures')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>Match Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {completedMatches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-pitch-darkest/40 rounded-2xl border border-pitch-border/50">
              No completed matches recorded yet. Submit scores from Admin dashboard or Fixtures.
            </div>
          ) : (
            completedMatches.map((m) => {
              const p1 = getPlayer(m.player_1);
              const p2 = getPlayer(m.player_2);
              const s1 = m.player_1_score ?? 0;
              const s2 = m.player_2_score ?? 0;

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className="bg-pitch-darkest/60 border border-pitch-border hover:border-emerald-500/40 rounded-2xl p-3.5 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  {/* Player 1 */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <PlayerAvatar
                      name={p1?.player_name || 'P1'}
                      photo={p1?.player_photo}
                      size="sm"
                      glow={m.winner_id === m.player_1}
                    />
                    <span className={`text-xs sm:text-sm truncate ${m.winner_id === m.player_1 ? 'font-black text-emerald-300' : 'font-medium text-slate-300'}`}>
                      {p1?.player_name}
                    </span>
                  </div>

                  {/* Score Pill */}
                  <div className="px-3 py-1 rounded-xl bg-pitch-panel border border-pitch-border text-center shrink-0">
                    <span className="font-display text-base font-extrabold text-white tracking-wider">
                      {s1} - {s2}
                    </span>
                    {m.penalties_played && (
                      <span className="block text-[9px] font-mono text-amber-400">
                        ({m.player_1_penalty_score}-{m.player_2_penalty_score} pens)
                      </span>
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                    <span className={`text-xs sm:text-sm truncate ${m.winner_id === m.player_2 ? 'font-black text-emerald-300' : 'font-medium text-slate-300'}`}>
                      {p2?.player_name}
                    </span>
                    <PlayerAvatar
                      name={p2?.player_name || 'P2'}
                      photo={p2?.player_photo}
                      size="sm"
                      glow={m.winner_id === m.player_2}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
