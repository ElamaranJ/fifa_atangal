import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerStatistics } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Flame, Trophy, Award, Sparkles, TrendingUp, Users } from 'lucide-react';

interface GoldenBootProps {
  onSelectPlayer: (player: PlayerStatistics) => void;
}

export const GoldenBoot: React.FC<GoldenBootProps> = ({ onSelectPlayer }) => {
  const { goldenBootLeaders } = useTournament();

  const leader = goldenBootLeaders[0];
  const isJointLeader = leader && leader.is_joint_golden_boot;
  const jointLeaders = goldenBootLeaders.filter(p => p.golden_boot_rank === 1);

  return (
    <div className="space-y-8">
      
      {/* Golden Boot Leader Spotlight Banner */}
      {leader && leader.total_goals > 0 ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-pitch-card to-pitch-darkest border-2 border-amber-500/40 p-5 sm:p-8 shadow-glow-gold">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            
            {/* Player Info */}
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6">
              <div className="relative">
                <PlayerAvatar
                  name={leader.player_name}
                  photo={leader.player_photo}
                  size="2xl"
                  glow
                  className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)] cursor-pointer"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-bold text-sm sm:text-base shadow-lg">
                  🏆
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mb-1.5 sm:mb-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isJointLeader ? 'JOINT GOLDEN BOOT LEADER' : 'GOLDEN BOOT LEADER'}</span>
                </div>
                <h2 
                  onClick={() => onSelectPlayer(leader)}
                  className="font-display text-2xl sm:text-4xl font-black text-white hover:text-amber-300 cursor-pointer transition-colors truncate max-w-xs sm:max-w-md"
                >
                  {leader.player_name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5 sm:mt-1">
                  {leader.group_name || 'Tournament Top Gun'}
                </p>
              </div>
            </div>

            {/* Quick Metrics highlight (Responsive full width on mobile) */}
            <div className="w-full md:w-auto flex items-center justify-around gap-2 sm:gap-4 bg-pitch-darkest/80 border border-pitch-border rounded-2xl p-3 sm:p-5">
              <div className="text-center px-2 sm:px-3 border-r border-pitch-border flex-1 sm:flex-initial">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400 block">Goals</span>
                <span className="text-2xl sm:text-4xl font-display font-black text-amber-300">
                  {leader.total_goals}
                </span>
              </div>
              <div className="text-center px-2 sm:px-3 border-r border-pitch-border flex-1 sm:flex-initial">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400 block">Matches</span>
                <span className="text-xl sm:text-3xl font-display font-bold text-white">
                  {leader.matches_played}
                </span>
              </div>
              <div className="text-center px-2 sm:px-3 flex-1 sm:flex-initial">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400 block">Goals/Match</span>
                <span className="text-xl sm:text-3xl font-display font-bold text-cyan-300">
                  {leader.goals_per_match}
                </span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-pitch-card/60 border border-pitch-border rounded-3xl">
          <Flame className="w-12 h-12 text-amber-400/50 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white">Golden Boot Race Waiting to Kick Off</h3>
          <p className="text-xs text-slate-400 mt-1">Submit match results to track top scorers automatically.</p>
        </div>
      )}

      {/* Complete Leaderboard Table */}
      <div className="bg-pitch-card/90 border border-pitch-border rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-pitch-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-display text-xl font-bold text-white">
              Golden Boot Leaderboard
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Tie rules: Goals → Fewer Matches → Goals / Match
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pitch-darkest/90 border-b border-pitch-border text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4 text-center font-bold text-amber-300">Total Goals</th>
                <th className="py-3.5 px-4 text-center">Matches</th>
                <th className="py-3.5 px-4 text-center">Goals Per Match</th>
                <th className="py-3.5 px-4 text-center hidden sm:table-cell">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-pitch-border/50 text-xs sm:text-sm">
              {goldenBootLeaders.map((player) => {
                const isFirst = player.golden_boot_rank === 1 && player.total_goals > 0;
                const isSecond = player.golden_boot_rank === 2 && player.total_goals > 0;
                const isThird = player.golden_boot_rank === 3 && player.total_goals > 0;

                return (
                  <tr
                    key={player.player_id}
                    onClick={() => onSelectPlayer(player)}
                    className="hover:bg-pitch-panel/60 transition-colors cursor-pointer group"
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {isFirst ? (
                          <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center justify-center text-xs shadow-glow-gold">
                            🥇 1
                          </span>
                        ) : isSecond ? (
                          <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 font-bold border border-slate-300/40 flex items-center justify-center text-xs">
                            🥈 2
                          </span>
                        ) : isThird ? (
                          <span className="w-7 h-7 rounded-full bg-amber-800/30 text-amber-400 font-bold border border-amber-800/40 flex items-center justify-center text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono font-bold">
                            #{player.golden_boot_rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Player */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          name={player.player_name}
                          photo={player.player_photo}
                          size="sm"
                          glow={isFirst}
                        />
                        <div>
                          <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                            {player.player_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {player.group_name || 'Competitor'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Total Goals */}
                    <td className="py-3.5 px-4 text-center font-display font-black text-base text-amber-300 bg-amber-500/5">
                      {player.total_goals}
                    </td>

                    {/* Matches */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {player.matches_played}
                    </td>

                    {/* Goals / match */}
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-cyan-300">
                      {player.goals_per_match}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                      {player.is_joint_golden_boot ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono uppercase">
                          Joint Leader
                        </span>
                      ) : isFirst ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono uppercase">
                          Top Scorer
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Contender
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
