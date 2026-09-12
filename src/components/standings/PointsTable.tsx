import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerStatistics } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  TableProperties, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Sparkles, 
  CheckCircle2, 
  Flame,
  Info
} from 'lucide-react';

interface PointsTableProps {
  onSelectPlayer: (player: PlayerStatistics) => void;
}

export const PointsTable: React.FC<PointsTableProps> = ({ onSelectPlayer }) => {
  const { 
    tournament, 
    overallStats, 
    groupAStats, 
    groupBStats 
  } = useTournament();

  const [activeGroupTab, setActiveGroupTab] = useState<'COMBINED' | 'GROUP_A' | 'GROUP_B'>('COMBINED');

  const currentStats = 
    activeGroupTab === 'GROUP_A' ? groupAStats :
    activeGroupTab === 'GROUP_B' ? groupBStats : overallStats;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-pitch-card/80 border border-pitch-border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <TableProperties className="w-6 h-6 text-emerald-400" />
            <span>Live Points Table</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic standings sorted by Points → Goal Difference → Goals Scored → Head-to-Head
          </p>
        </div>

        {/* Group Selector for 2-Group Tournaments */}
        {tournament.group_format === 'TWO_GROUPS' && (
          <div className="flex items-center p-1 bg-pitch-darkest rounded-xl border border-pitch-border text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setActiveGroupTab('COMBINED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeGroupTab === 'COMBINED'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overall Table
            </button>
            <button
              onClick={() => setActiveGroupTab('GROUP_A')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeGroupTab === 'GROUP_A'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Group A
            </button>
            <button
              onClick={() => setActiveGroupTab('GROUP_B')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeGroupTab === 'GROUP_B'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Group B
            </button>
          </div>
        )}
      </div>

      {/* Standings Table Card */}
      <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl shadow-xl overflow-hidden">
        
        {/* 1. Mobile Card-Based Standings View (< sm) */}
        <div className="block sm:hidden divide-y divide-pitch-border/50">
          {currentStats.map((player, index) => {
            const isOverallView = activeGroupTab === 'COMBINED' || tournament.group_format === 'SINGLE';
            const isTopQualified = isOverallView ? player.rank <= 4 : player.is_qualified;
            const isLeader = player.rank === 1;

            return (
              <React.Fragment key={`mobile_${player.player_id}_${player.matches_played}_${player.points}`}>
                <div
                  onClick={() => onSelectPlayer(player)}
                  className={`p-3.5 transition-colors cursor-pointer active:bg-pitch-panel/70 ${
                    isTopQualified
                      ? isLeader
                        ? 'bg-gradient-to-r from-amber-500/[0.14] via-emerald-500/[0.06] to-transparent border-l-4 border-l-amber-400'
                        : 'bg-gradient-to-r from-emerald-500/[0.10] via-emerald-500/[0.03] to-transparent border-l-4 border-l-emerald-400'
                      : 'border-l-4 border-l-transparent hover:bg-pitch-panel/40'
                  }`}
                >
                  {/* Top Row: Rank, Avatar, Name, and Points */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Rank badge */}
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          isLeader
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40 shadow-glow-gold'
                            : isTopQualified
                            ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {player.rank}
                      </span>

                      <PlayerAvatar
                        name={player.player_name}
                        photo={player.player_photo}
                        size="sm"
                        glow={isTopQualified}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-sm truncate ${
                            isLeader
                              ? 'text-amber-200'
                              : isTopQualified
                              ? 'text-emerald-100'
                              : 'text-white'
                          }`}>
                            {player.player_name}
                          </span>

                          {isTopQualified && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>{isLeader ? 'Leader' : 'Top 4'}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {player.group_name || 'Contender'}
                        </span>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="shrink-0 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-xl font-display font-black text-sm sm:text-base ${
                        isLeader
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                          : isTopQualified
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-pitch-darkest text-cyan-300 border border-pitch-border'
                      }`}>
                        {player.points} PTS
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Detailed Stats Grid */}
                  <div className="grid grid-cols-4 gap-1.5 bg-pitch-darkest/60 border border-pitch-border/50 rounded-xl p-2 mt-2.5 text-center text-[11px] font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">MP</span>
                      <span className="font-bold text-slate-300">{player.matches_played}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">W-D-L</span>
                      <span className="font-bold text-slate-300">
                        <span className="text-emerald-400">{player.wins}</span>-
                        <span className="text-amber-400">{player.draws}</span>-
                        <span className="text-rose-400">{player.losses}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">GF / GA</span>
                      <span className="font-bold text-slate-300">{player.goals_for} / {player.goals_against}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">GD</span>
                      <span className={`font-bold ${player.goal_difference > 0 ? 'text-emerald-400' : player.goal_difference < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {player.goal_difference > 0 ? `+${player.goal_difference}` : player.goal_difference}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Recent Form Pills (Never hidden on mobile!) */}
                  <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400 font-mono">
                    <span className="text-slate-500">Form:</span>
                    <div className="flex items-center gap-1">
                      {player.form.length === 0 ? (
                        <span className="text-slate-600">-</span>
                      ) : (
                        player.form.map((res, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                              res === 'W'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : res === 'D'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {res}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Cutoff Divider after Top 4 in Overall Table */}
                {index === 3 && isOverallView && currentStats.length > 4 && (
                  <div key="mobile-top-4-qualification-cutoff" className="bg-emerald-950/70 border-y-2 border-dashed border-emerald-500/40 py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      <span>🏆</span>
                      <span>Top 4 Playoff Qualification Cutoff</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 2. Desktop Full Table View (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pitch-darkest/90 border-b border-pitch-border text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3 sm:px-4 text-center w-12">#</th>
                <th className="py-3.5 px-3 sm:px-4">Player</th>
                <th className="py-3.5 px-2.5 text-center" title="Matches Played">MP</th>
                <th className="py-3.5 px-2.5 text-center" title="Wins">W</th>
                <th className="py-3.5 px-2.5 text-center" title="Draws">D</th>
                <th className="py-3.5 px-2.5 text-center" title="Losses">L</th>
                <th className="py-3.5 px-2.5 text-center" title="Goals For">GF</th>
                <th className="py-3.5 px-2.5 text-center" title="Goals Against">GA</th>
                <th className="py-3.5 px-2.5 text-center" title="Goal Difference">GD</th>
                <th className="py-3.5 px-3.5 text-center text-cyan-300 font-bold" title="Points">PTS</th>
                <th className="py-3.5 px-3 text-center">Form</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-pitch-border/50 text-xs sm:text-sm">
              {currentStats.map((player, index) => {
                const isOverallView = activeGroupTab === 'COMBINED' || tournament.group_format === 'SINGLE';
                const isTopQualified = isOverallView ? player.rank <= 4 : player.is_qualified;
                const isLeader = player.rank === 1;

                return (
                  <React.Fragment key={`${player.player_id}_${player.matches_played}_${player.points}_${player.goals_for}_${player.goals_against}_${player.rank}`}>
                    <tr
                      onClick={() => onSelectPlayer(player)}
                      className={`transition-all duration-200 cursor-pointer group ${
                        isTopQualified
                          ? isLeader
                            ? 'bg-gradient-to-r from-amber-500/[0.14] via-emerald-500/[0.08] to-transparent border-l-4 border-l-amber-400 hover:from-amber-500/[0.20]'
                            : 'bg-gradient-to-r from-emerald-500/[0.10] via-emerald-500/[0.04] to-transparent border-l-4 border-l-emerald-400 hover:from-emerald-500/[0.16]'
                          : 'border-l-4 border-l-transparent hover:bg-pitch-panel/60'
                      }`}
                    >
                      {/* Rank & Movement badge */}
                      <td className="py-3.5 px-3 sm:px-4 text-center font-display font-bold">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                              isLeader
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40 shadow-glow-gold'
                                : isTopQualified
                                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/30'
                                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                            }`}
                          >
                            {player.rank}
                          </span>

                          {/* Rank Shift Indicator */}
                          {player.rank_change === 'UP' && (
                            <span title="Rank Increased" className="text-emerald-400 flex items-center">
                              <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                            </span>
                          )}
                          {player.rank_change === 'DOWN' && (
                            <span title="Rank Decreased" className="text-rose-400 flex items-center">
                              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Player Profile Details */}
                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar
                            name={player.player_name}
                            photo={player.player_photo}
                            size="sm"
                            glow={isTopQualified}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold transition-colors truncate ${
                                isLeader
                                  ? 'text-amber-200 group-hover:text-white'
                                  : isTopQualified
                                  ? 'text-emerald-100 group-hover:text-emerald-300'
                                  : 'text-white group-hover:text-cyan-300'
                              }`}>
                                {player.player_name}
                              </span>

                              {/* Prominent Qualification Badge for Top 4 */}
                              {isTopQualified && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>{isLeader ? 'Leader' : 'Top 4'}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {player.group_name || 'Contender'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stats Columns */}
                      <td className="py-3.5 px-2.5 text-center font-mono text-slate-300">
                        {player.matches_played}
                      </td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-emerald-400 font-semibold">
                        {player.wins}
                      </td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-amber-400 font-semibold">
                        {player.draws}
                      </td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-rose-400 font-semibold">
                        {player.losses}
                      </td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-slate-300">
                        {player.goals_for}
                      </td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-slate-400">
                        {player.goals_against}
                      </td>
                      <td className="py-3.5 px-2.5 text-center font-mono font-bold">
                        <span className={player.goal_difference > 0 ? 'text-emerald-400' : player.goal_difference < 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {player.goal_difference > 0 ? `+${player.goal_difference}` : player.goal_difference}
                        </span>
                      </td>

                      {/* Points */}
                      <td className={`py-3.5 px-3.5 text-center font-display font-black text-base ${
                        isTopQualified
                          ? isLeader
                            ? 'text-amber-300 bg-amber-500/10'
                            : 'text-emerald-300 bg-emerald-500/10'
                          : 'text-cyan-300 bg-pitch-panel/40'
                      }`}>
                        {player.points}
                      </td>

                      {/* Form (Last 5) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {player.form.length === 0 ? (
                            <span className="text-[10px] text-slate-500 font-mono">-</span>
                          ) : (
                            player.form.map((res, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                  res === 'W'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : res === 'D'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {res}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Cutoff Divider after Top 4 in Overall Table */}
                    {index === 3 && isOverallView && currentStats.length > 4 && (
                      <tr key="top-4-qualification-cutoff" className="bg-emerald-950/40 border-y-2 border-dashed border-emerald-500/40">
                        <td colSpan={11} className="py-2 px-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                              <span>🏆</span>
                              <span>Top 4 Playoff Qualification Cutoff</span>
                            </div>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Legend */}
        <div className="p-4 bg-pitch-darkest/70 border-t border-pitch-border flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>🟢 Top 4 Playoff Qualification Zone</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>↑ Rank Increased</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
              <span>↓ Rank Decreased</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Click any player row to view in-depth profile & head-to-head records
          </div>
        </div>
      </div>
    </div>
  );
};
