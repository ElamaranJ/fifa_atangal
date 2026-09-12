import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { FootballBootIcon } from '../common/FootballBootIcon';
import { Match, PlayerStatistics } from '../../types/tournament';
import { Calendar, BarChart2, ChevronRight, Play, Trophy } from 'lucide-react';

interface ReferenceBottomCardsProps {
  onEnterScore: (match: Match) => void;
  onSelectMatch: (match: Match) => void;
  onSelectPlayer: (player: PlayerStatistics) => void;
}

export const ReferenceBottomCards: React.FC<ReferenceBottomCardsProps> = ({
  onEnterScore,
  onSelectMatch,
  onSelectPlayer,
}) => {
  const { matches, players, overallStats, goldenBootLeaders, setActiveTab, isAdmin, playoffs } = useTournament();

  const upcomingMatches = matches.filter(m => m.status !== 'COMPLETED').slice(0, 4);
  const champion = players.find(p => p.id === playoffs?.champion_player_id);
  const runnerUp = players.find(p => p.id === playoffs?.runner_up_player_id);
  const thirdPlace = players.find(p => p.id === playoffs?.third_place_player_id);
  const finalMatch = playoffs?.final;

  const getPlayer = (id: string) => players.find(p => p.id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 px-3 sm:px-8 pb-10 relative z-10">
      
      {/* 1. Upcoming Matches / Championship Final Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              {champion ? (
                <Trophy className="w-5 h-5 text-amber-500" />
              ) : (
                <Calendar className="w-5 h-5 text-[#1d6bf3]" />
              )}
              <h3 className="font-display font-bold text-base text-slate-900">
                {champion ? 'Championship Podium' : 'Upcoming Matches'}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab(champion ? 'champion' : 'fixtures')}
              className="text-xs font-bold text-[#1d6bf3] hover:underline"
            >
              {champion ? 'View Hall 🏆' : 'View All'}
            </button>
          </div>

          <div className="space-y-3.5">
            {upcomingMatches.length === 0 ? (
              champion ? (
                <div className="py-2 space-y-3">
                  {/* Champion Winner Feature Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/5 border border-amber-300/80 flex items-center gap-3">
                    <PlayerAvatar name={champion.player_name} photo={champion.player_photo} size="md" glow />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-700 tracking-wider">
                          1st Place • Champion
                        </span>
                      </div>
                      <h4 className="font-display font-black text-slate-900 text-sm truncate">
                        {champion.player_name}
                      </h4>
                      {finalMatch && finalMatch.status === 'COMPLETED' && (
                        <span className="text-[11px] font-mono font-semibold text-slate-600 block">
                          Won Final: {finalMatch.player_1_score} - {finalMatch.player_2_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Runner-Up & 3rd Place */}
                  <div className="space-y-1.5 text-xs">
                    {runnerUp && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <span>🥈</span> Runner-Up:
                        </span>
                        <span className="font-bold text-slate-800">{runnerUp.player_name}</span>
                      </div>
                    )}
                    {thirdPlace && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <span>🥉</span> 3rd Place:
                        </span>
                        <span className="font-bold text-slate-800">{thirdPlace.player_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Navigation */}
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => setActiveTab('champion')}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Hall of Champions</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('playoffs')}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Playoff Bracket
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Upcoming Fixtures</p>
                  <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                    {players.length >= 2 
                      ? `${players.length} players registered. Generate fixtures in Admin Setup to schedule matches.`
                      : 'Register players and generate fixtures in Admin Setup to start.'}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab('admin')}
                      className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#1d6bf3] text-white text-xs font-bold shadow-xs hover:bg-[#1557c0] transition-colors"
                    >
                      Setup Wizard →
                    </button>
                  )}
                </div>
              )
            ) : (
              upcomingMatches.map((m) => {
              const p1 = getPlayer(m.player_1);
              const p2 = getPlayer(m.player_2);

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-1.5 sm:gap-2 py-1.5 hover:bg-slate-50 rounded-xl px-1 transition-colors group cursor-pointer"
                  onClick={() => onSelectMatch(m)}
                >
                  {/* Schedule */}
                  <div className="w-14 sm:w-16 shrink-0 text-[10px] sm:text-[11px] leading-tight text-slate-400 font-medium">
                    <span className="block text-slate-700 font-semibold">{m.date || 'Sep 12'}</span>
                    <span>{m.time || '6:00 PM'}</span>
                  </div>

                  {/* Matchup */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <PlayerAvatar name={p1?.player_name || 'P1'} photo={p1?.player_photo} size="sm" />
                    <span className="text-xs font-bold text-slate-800 truncate flex-1 min-w-0">
                      {p1?.player_name}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400 px-0.5 shrink-0">
                      VS
                    </span>

                    <PlayerAvatar name={p2?.player_name || 'P2'} photo={p2?.player_photo} size="sm" />
                    <span className="text-xs font-bold text-slate-800 truncate flex-1 min-w-0">
                      {p2?.player_name}
                    </span>
                  </div>

                  {/* Status / Action */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isAdmin ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEnterScore(m);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[#1d6bf3] hover:bg-[#1557c0] text-white text-[10px] font-bold shadow-sm transition-all"
                      >
                        Score
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-semibold">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* 2. Points Table Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-5 h-5 text-[#1d6bf3]" />
              <h3 className="font-display font-bold text-base text-slate-900">
                Points Table
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('standings')}
              className="text-xs font-bold text-[#1d6bf3] hover:underline"
            >
              View Full Table
            </button>
          </div>

          <div className="overflow-x-auto">
            {overallStats.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <BarChart2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Standings Yet</p>
                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                  Player standings will appear here once players are registered.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-1 text-center w-6">#</th>
                  <th className="py-2 px-1">Player</th>
                  <th className="py-2 px-1 text-center">MP</th>
                  <th className="py-2 px-1 text-center">W</th>
                  <th className="py-2 px-1 text-center">D</th>
                  <th className="py-2 px-1 text-center">L</th>
                  <th className="py-2 px-1 text-center">GF</th>
                  <th className="py-2 px-1 text-center">GA</th>
                  <th className="py-2 px-1 text-center">GD</th>
                  <th className="py-2 px-1 text-center font-black">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {overallStats.slice(0, 8).map((player, idx) => {
                  const isLeader = player.rank === 1;
                  const isTop4 = player.rank <= 4;

                  return (
                    <React.Fragment key={`${player.player_id}_${player.matches_played}_${player.points}`}>
                      <tr
                        onClick={() => onSelectPlayer(player)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isLeader 
                            ? 'bg-emerald-50/60 font-bold border-l-2 border-l-emerald-500' 
                            : isTop4 
                            ? 'bg-emerald-50/25 font-semibold border-l-2 border-l-emerald-400' 
                            : 'border-l-2 border-l-transparent'
                        }`}
                      >
                        <td className="py-2 px-1 text-center">
                          {isLeader ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px] leading-4 text-center">
                              1
                            </span>
                          ) : isTop4 ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] leading-4 text-center border border-emerald-200">
                              {player.rank}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold">{player.rank}</span>
                          )}
                        </td>

                        <td className="py-2 px-1">
                          <div className="flex items-center gap-1.5 max-w-[110px] truncate">
                            <PlayerAvatar name={player.player_name} photo={player.player_photo} size="xs" />
                            <span className={`truncate text-xs ${
                              isLeader 
                                ? 'text-emerald-900 font-bold' 
                                : isTop4 
                                ? 'text-emerald-800 font-semibold' 
                                : 'text-slate-800 font-semibold'
                            }`}>
                              {player.player_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-2 px-1 text-center text-slate-500">{player.matches_played}</td>
                        <td className="py-2 px-1 text-center text-slate-600">{player.wins}</td>
                        <td className="py-2 px-1 text-center text-slate-600">{player.draws}</td>
                        <td className="py-2 px-1 text-center text-slate-600">{player.losses}</td>
                        <td className="py-2 px-1 text-center text-slate-600">{player.goals_for}</td>
                        <td className="py-2 px-1 text-center text-slate-600">{player.goals_against}</td>
                        <td className={`py-2 px-1 text-center font-bold ${
                          player.goal_difference > 0 ? 'text-emerald-600' : player.goal_difference < 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {player.goal_difference > 0 ? `+${player.goal_difference}` : player.goal_difference}
                        </td>
                        <td className={`py-2 px-1 text-center font-black text-xs ${
                          isLeader 
                            ? 'text-emerald-700 font-black' 
                            : isTop4 
                            ? 'text-emerald-600 font-bold' 
                            : 'text-slate-900'
                        }`}>
                          {player.points}
                        </td>
                      </tr>

                      {/* Subtle Top 4 qualification divider line */}
                      {idx === 3 && overallStats.length > 4 && (
                        <tr key="home-qualification-divider" className="bg-emerald-50/50 border-y border-dashed border-emerald-300/80">
                          <td colSpan={10} className="py-0.5 px-2 text-center text-[9px] font-mono font-bold text-emerald-700 uppercase tracking-widest">
                            ▲ Top 4 Playoff Zone ▲
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>

      {/* 3. Golden Boot Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <FootballBootIcon variant="dark" width={22} height={14} />
              <h3 className="font-display font-bold text-base text-slate-900">
                Golden Boot
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('goldenboot')}
              className="text-xs font-bold text-[#1d6bf3] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {goldenBootLeaders.length === 0 || goldenBootLeaders.every(l => l.total_goals === 0) ? (
              <div className="py-8 text-center space-y-2">
                <div className="flex justify-center opacity-40">
                  <FootballBootIcon variant="dark" width={32} height={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">No Goals Scored Yet</p>
                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                  Golden boot rankings will update automatically as match results are recorded.
                </p>
              </div>
            ) : (
              goldenBootLeaders.slice(0, 6).map((player) => {
              const isFirst = player.golden_boot_rank === 1;
              const isSecond = player.golden_boot_rank === 2;
              const isThird = player.golden_boot_rank === 3;

              return (
                <div
                  key={player.player_id}
                  onClick={() => onSelectPlayer(player)}
                  className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Rank Indicator */}
                    <div className="w-4 text-center shrink-0">
                      {isFirst ? (
                        <span className="inline-block w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] leading-4 text-center">
                          1
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{player.golden_boot_rank}</span>
                      )}
                    </div>

                    <PlayerAvatar name={player.player_name} photo={player.player_photo} size="sm" />

                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-[#1d6bf3] transition-colors">
                        {player.player_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {player.total_goals} Goals
                      </span>
                    </div>
                  </div>

                  {/* Cleat / Boot graphic */}
                  <div className="shrink-0 flex items-center pr-1">
                    {isFirst && (
                      <FootballBootIcon variant="gold" width={32} height={18} />
                    )}
                    {isSecond && (
                      <FootballBootIcon variant="silver" width={32} height={18} />
                    )}
                    {isThird && (
                      <FootballBootIcon variant="bronze" width={32} height={18} />
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>

    </div>
  );
};
