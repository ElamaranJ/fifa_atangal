import React from 'react';
import { Match } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Calendar, Clock, MapPin, Play, Edit2 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onSelect: (match: Match) => void;
  onEnterScore: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelect, onEnterScore }) => {
  const { players, isAdmin } = useTournament();

  const p1 = players.find(p => p.id === match.player_1);
  const p2 = players.find(p => p.id === match.player_2);

  const isCompleted = match.status === 'COMPLETED';
  const s1 = match.player_1_score ?? 0;
  const s2 = match.player_2_score ?? 0;

  return (
    <div className="bg-pitch-card/80 border border-pitch-border hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-md hover:shadow-xl group flex flex-col justify-between">
      {/* Top Meta info */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2.5 border-b border-pitch-border/60">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-cyan-400">Match #{match.match_number}</span>
          <span>•</span>
          <span className="text-slate-300">Round {match.round}</span>
          {match.group && (
            <>
              <span>•</span>
              <span className="text-amber-400/90">{match.group}</span>
            </>
          )}
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : match.status === 'LIVE'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
              : 'bg-pitch-panel text-slate-400 border border-pitch-border'
          }`}
        >
          {match.status}
        </span>
      </div>

      {/* Main Players & Score Matchup */}
      <div
        onClick={() => onSelect(match)}
        className="cursor-pointer py-1 sm:py-2"
      >
        {/* Mobile View (< sm): 2-row sports fixture layout ensuring zero clipping */}
        <div className="sm:hidden space-y-2.5 py-1">
          {/* Row 1: Player 1 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <PlayerAvatar
                name={p1?.player_name || 'Player 1'}
                photo={p1?.player_photo}
                size="sm"
                glow={match.winner_id === match.player_1}
              />
              <div className="min-w-0 flex-1">
                <h4 className={`text-sm font-bold truncate ${match.winner_id === match.player_1 ? 'text-emerald-300 font-extrabold' : 'text-white'}`}>
                  {p1?.player_name}
                </h4>
                <span className="text-[10px] text-slate-400 block truncate">
                  {p1?.group_name || 'Contender'}
                </span>
              </div>
            </div>
            {isCompleted ? (
              <span className={`text-xl font-display font-black min-w-[28px] text-right ${s1 > s2 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {s1}
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase px-2 py-0.5 rounded bg-pitch-darkest border border-pitch-border">
                {match.time || 'VS'}
              </span>
            )}
          </div>

          {/* Row 2: Player 2 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <PlayerAvatar
                name={p2?.player_name || 'Player 2'}
                photo={p2?.player_photo}
                size="sm"
                glow={match.winner_id === match.player_2}
              />
              <div className="min-w-0 flex-1">
                <h4 className={`text-sm font-bold truncate ${match.winner_id === match.player_2 ? 'text-emerald-300 font-extrabold' : 'text-white'}`}>
                  {p2?.player_name}
                </h4>
                <span className="text-[10px] text-slate-400 block truncate">
                  {p2?.group_name || 'Contender'}
                </span>
              </div>
            </div>
            {isCompleted && (
              <span className={`text-xl font-display font-black min-w-[28px] text-right ${s2 > s1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {s2}
              </span>
            )}
          </div>

          {/* Penalties note if any */}
          {match.penalties_played && (
            <div className="text-[10px] font-mono text-amber-400 text-center pt-1 font-bold bg-amber-500/10 rounded-lg py-1 border border-amber-500/20">
              Penalties: {match.player_1_penalty_score} - {match.player_2_penalty_score}
            </div>
          )}
        </div>

        {/* Desktop View (sm+): Exact 5-column grid layout */}
        <div className="hidden sm:grid sm:grid-cols-5 items-center py-2">
          {/* Player 1 */}
          <div className="col-span-2 flex items-center gap-3">
            <PlayerAvatar
              name={p1?.player_name || 'Player 1'}
              photo={p1?.player_photo}
              size="md"
              glow={match.winner_id === match.player_1}
            />
            <div className="min-w-0">
              <h4 className={`text-xs sm:text-sm truncate ${match.winner_id === match.player_1 ? 'font-black text-emerald-300' : 'font-bold text-white'}`}>
                {p1?.player_name}
              </h4>
              <span className="text-[10px] text-slate-400 truncate block">
                {p1?.group_name || 'Contender'}
              </span>
            </div>
          </div>

          {/* Center Score / VS */}
          <div className="col-span-1 text-center">
            {isCompleted ? (
              <div>
                <div className="flex items-center justify-center gap-1.5 font-display text-xl sm:text-2xl font-black text-white">
                  <span className={s1 > s2 ? 'text-emerald-400' : ''}>{s1}</span>
                  <span className="text-slate-500 text-lg">-</span>
                  <span className={s2 > s1 ? 'text-emerald-400' : ''}>{s2}</span>
                </div>
                {match.penalties_played && (
                  <span className="text-[9px] font-mono text-amber-400 block font-bold">
                    ({match.player_1_penalty_score}-{match.player_2_penalty_score} pens)
                  </span>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 mx-auto rounded-full bg-pitch-darkest border border-pitch-border flex items-center justify-center font-display font-black text-slate-400 text-xs">
                VS
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className="col-span-2 flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <h4 className={`text-xs sm:text-sm truncate ${match.winner_id === match.player_2 ? 'font-black text-emerald-300' : 'font-bold text-white'}`}>
                {p2?.player_name}
              </h4>
              <span className="text-[10px] text-slate-400 truncate block">
                {p2?.group_name || 'Contender'}
              </span>
            </div>
            <PlayerAvatar
              name={p2?.player_name || 'Player 2'}
              photo={p2?.player_photo}
              size="md"
              glow={match.winner_id === match.player_2}
            />
          </div>
        </div>
      </div>

      {/* Bottom Schedule Details & Action */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-pitch-border/50 text-xs">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{match.date || 'TBD'}</span>
          </span>
          {match.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{match.time}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => onEnterScore(match)}
              className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all min-h-[40px] sm:min-h-[36px]"
            >
              {isCompleted ? (
                <>
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Enter Score</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onSelect(match)}
              className="text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors py-2 px-1 min-h-[40px] flex items-center"
            >
              Details →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
