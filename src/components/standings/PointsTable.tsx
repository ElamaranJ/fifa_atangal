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
      <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <TableProperties className="w-6 h-6 text-cyan-400" />
            <span>Live Points Table</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Dynamic standings sorted by Points → Goal Difference → Goals Scored → Head-to-Head
          </p>
        </div>

        {/* Group Selector for 2-Group Tournaments */}
        {tournament.group_format === 'TWO_GROUPS' && (
          <div className="flex items-center p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setActiveGroupTab('COMBINED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeGroupTab === 'COMBINED'
                  ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Overall Table
            </button>
            <button
              onClick={() => setActiveGroupTab('GROUP_A')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeGroupTab === 'GROUP_A'
                  ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Group A
            </button>
            <button
              onClick={() => setActiveGroupTab('GROUP_B')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeGroupTab === 'GROUP_B'
                  ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Group B
            </button>
          </div>
        )}
      </div>

      {/* Standings Table Card or Empty State */}
      {currentStats.length === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl space-y-3 text-white">
          <TableProperties className="w-12 h-12 text-cyan-400/70 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white">No Standings Yet</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Live points standings will appear here once players are registered and tournament matches are played.
          </p>
        </div>
      ) : (
        <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden text-white">
          
          {/* 1. Mobile Card-Based Standings View (< sm) */}
          <div className="block sm:hidden divide-y divide-white/10">
            {currentStats.map((player, index) => {
              const isOverallView = activeGroupTab === 'COMBINED' || tournament.group_format === 'SINGLE';
              const isTopQualified = isOverallView ? player.rank <= 4 : player.is_qualified;
              const isLeader = player.rank === 1;

              return (
                <React.Fragment key={`mobile_${player.player_id}_${player.matches_played}_${player.points}`}>
                  <div
                    onClick={() => onSelectPlayer(player)}
                    className={`p-3.5 transition-colors cursor-pointer active:bg-white/10 ${
                      isTopQualified
                        ? isLeader
                          ? 'bg-amber-500/15 border-l-4 border-l-amber-400'
                          : 'bg-emerald-500/15 border-l-4 border-l-emerald-400'
                        : 'border-l-4 border-l-transparent hover:bg-white/5'
                    }`}
                  >
                    {/* Top Row: Rank, Avatar, Name, and Points */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Rank badge */}
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isLeader
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : isTopQualified
                              ? 'bg-emerald-400 text-slate-950 shadow-sm'
                              : 'bg-white/10 text-slate-300 border border-white/10'
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
                            <span className="font-bold text-sm text-white truncate">
                              {player.player_name}
                            </span>

                            {isTopQualified && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{isLeader ? 'Leader' : 'Top 4'}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {tournament.group_format === 'TWO_GROUPS' ? (player.group_name || 'Group Stage') : 'League'}
                          </span>
                        </div>
                      </div>

                      {/* Points Badge */}
                      <div className="shrink-0 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-xl font-display font-black text-sm sm:text-base ${
                          isLeader
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : isTopQualified
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-white/10 text-cyan-300 border border-white/15'
                        }`}>
                          {player.points} PTS
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Detailed Stats Grid */}
                    <div className="grid grid-cols-6 gap-1 my-2.5 py-2 px-2.5 bg-white/5 rounded-xl border border-white/10 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">MP</span>
                        <span className="font-mono font-semibold text-slate-200">{player.matches_played}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">W</span>
                        <span className="font-mono font-bold text-emerald-400">{player.wins}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">D</span>
                        <span className="font-mono font-bold text-amber-400">{player.draws}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">L</span>
                        <span className="font-mono font-bold text-rose-400">{player.losses}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">GF</span>
                        <span className="font-mono text-slate-200">{player.goals_for}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">GD</span>
                        <span className={`font-mono font-bold ${
                          player.goal_difference > 0 ? 'text-emerald-400' : player.goal_difference < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {player.goal_difference > 0 ? `+${player.goal_difference}` : player.goal_difference}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Form & Rank Shift */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">Form:</span>
                        <div className="flex items-center gap-1">
                          {player.form.length === 0 ? (
                            <span className="text-[10px] text-slate-400 font-mono">-</span>
                          ) : (
                            player.form.map((res, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                  res === 'W'
                                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                                    : res === 'D'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {res}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        {player.rank_change === 'UP' && (
                          <span className="text-emerald-400 flex items-center font-bold">
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>Up</span>
                          </span>
                        )}
                        {player.rank_change === 'DOWN' && (
                          <span className="text-rose-400 flex items-center font-bold">
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>Down</span>
                          </span>
                        )}
                        {player.rank_change === 'SAME' && (
                          <span className="text-slate-400 flex items-center">
                            <Minus className="w-3.5 h-3.5" />
                            <span>Same</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cutoff Divider after Top 4 in Overall Table (Mobile) */}
                  {index === 3 && isOverallView && currentStats.length > 4 && (
                    <div key="mobile-top-4-qualification-cutoff" className="bg-emerald-500/20 py-2 px-3 border-y border-dashed border-emerald-400/50 text-center">
                      <div className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest">
                        <span>🏆</span>
                        <span>Top 4 Playoff Cutoff</span>
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
                <tr className="bg-white/10 border-b border-white/15 text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
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
              
              <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
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
                              ? 'bg-amber-500/15 border-l-4 border-l-amber-400 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 border-l-4 border-l-emerald-400 hover:bg-emerald-500/25'
                            : 'border-l-4 border-l-transparent hover:bg-white/10'
                        }`}
                      >
                        {/* Rank & Movement badge */}
                        <td className="py-3.5 px-3 sm:px-4 text-center font-display font-bold">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                                isLeader
                                  ? 'bg-amber-400 text-slate-950'
                                  : isTopQualified
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-white/10 text-slate-300 border border-white/10'
                              }`}
                            >
                              {player.rank}
                            </span>

                            {player.rank_change === 'UP' && (
                              <span title="Rank Increased" className="text-emerald-400 flex items-center">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {player.rank_change === 'DOWN' && (
                              <span title="Rank Decreased" className="text-rose-400 flex items-center">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {player.rank_change === 'SAME' && (
                              <span title="Unchanged" className="text-slate-400 flex items-center">
                                <Minus className="w-3.5 h-3.5" />
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
                                <span className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                  {player.player_name}
                                </span>

                                {isTopQualified && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>{isLeader ? 'Leader' : 'Top 4'}</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {tournament.group_format === 'TWO_GROUPS' ? (player.group_name || 'Group Stage') : 'League'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stats Columns */}
                        <td className="py-3.5 px-2.5 text-center font-mono text-slate-200">
                          {player.matches_played}
                        </td>
                        <td className="py-3.5 px-2.5 text-center font-mono text-emerald-400 font-bold">
                          {player.wins}
                        </td>
                        <td className="py-3.5 px-2.5 text-center font-mono text-amber-400 font-bold">
                          {player.draws}
                        </td>
                        <td className="py-3.5 px-2.5 text-center font-mono text-rose-400 font-bold">
                          {player.losses}
                        </td>
                        <td className="py-3.5 px-2.5 text-center font-mono text-slate-200">
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
                        <td className="py-3.5 px-3.5 text-center font-display font-black text-base text-cyan-300 bg-cyan-500/10">
                          {player.points}
                        </td>

                        {/* Form */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {player.form.length === 0 ? (
                              <span className="text-[10px] text-slate-400 font-mono">-</span>
                            ) : (
                              player.form.map((res, i) => (
                                <span
                                  key={i}
                                  className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                    res === 'W'
                                      ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                                      : res === 'D'
                                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
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
                        <tr key="top-4-qualification-cutoff" className="bg-emerald-500/20 border-y-2 border-dashed border-emerald-400/60">
                          <td colSpan={11} className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="h-[1px] flex-1 bg-emerald-400/30" />
                              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest bg-slate-900/90 px-3 py-1 rounded-full border border-emerald-400/50 shadow-sm">
                                <span>🏆</span>
                                <span>Top 4 Playoff Qualification Cutoff</span>
                              </div>
                              <div className="h-[1px] flex-1 bg-emerald-400/30" />
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
          <div className="p-4 bg-white/5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
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
              Click any player row to view in-depth profile & records
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
