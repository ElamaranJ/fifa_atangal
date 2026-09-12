import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  Trophy, 
  Users, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Award, 
  Flame,
  Activity
} from 'lucide-react';

export const TournamentSummary: React.FC = () => {
  const { 
    tournament, 
    players, 
    matches, 
    overallStats, 
    playoffs, 
    dynamicStats,
    setSelectedPlayerForProfile,
    setActiveTab 
  } = useTournament();

  const champion = players.find(p => p.id === playoffs.champion_player_id);
  const top4 = overallStats.slice(0, 4);

  return (
    <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1d6bf3]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-black text-slate-900">Tournament Dossier & Summary</h3>
            <p className="text-xs text-slate-500 font-medium">Official tournament statistics & executive overview</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-[#1d6bf3] border border-blue-200 uppercase">
          {tournament.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">Tournament Format</span>
          <span className="font-bold text-slate-900 text-sm">
            {tournament.group_format === 'SINGLE' ? 'Single League Group' : '2 Groups (Group A & B)'}
          </span>
          <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
            {tournament.same_group_match_frequency}x Same Group • {tournament.other_group_match_frequency}x Cross
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">Roster Size</span>
          <span className="font-bold text-[#1d6bf3] text-sm">{players.length} Registered</span>
          <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
            {tournament.group_format === 'TWO_GROUPS' ? 'Divided into 2 groups' : '1 Unified table'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">Match Completion</span>
          <span className="font-bold text-emerald-700 text-sm">
            {dynamicStats.completed_matches} / {dynamicStats.total_matches} Played
          </span>
          <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
            {dynamicStats.remaining_matches} matches remaining
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">Championship Crown</span>
          {champion ? (
            <div className="flex items-center gap-2 mt-0.5">
              <PlayerAvatar name={champion.player_name} photo={champion.player_photo} size="xs" glow />
              <span className="font-bold text-amber-600 text-sm truncate">{champion.player_name}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic font-medium">In progress...</span>
          )}
        </div>
      </div>

      {/* Top 4 Qualified contenders row */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Top 4 Ranked Contenders</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {top4.map((player, idx) => (
            <div
              key={player.player_id}
              onClick={() => setSelectedPlayerForProfile(player)}
              className="bg-slate-50 border border-slate-200 hover:border-cyan-500/60 rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition-all shadow-xs"
            >
              <span className="font-display font-black text-[#1d6bf3] text-sm">#{idx + 1}</span>
              <PlayerAvatar name={player.player_name} photo={player.player_photo} size="sm" />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 text-xs truncate block group-hover:text-[#1d6bf3]">
                  {player.player_name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {player.points} PTS • {player.total_goals} G
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
