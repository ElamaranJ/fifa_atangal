import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { PlayerStatistics } from '../../types/tournament';
import { Users, Search, Plus, Trash2, Edit2, Trophy, Star } from 'lucide-react';

interface PlayerDirectoryProps {
  onSelectPlayer: (player: PlayerStatistics) => void;
}

export const PlayerDirectory: React.FC<PlayerDirectoryProps> = ({ onSelectPlayer }) => {
  const { 
    overallStats, 
    players, 
    isAdmin, 
    removePlayer, 
    setActiveTab 
  } = useTournament();

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  const filteredStats = overallStats.filter(s => {
    if (search.trim() && !s.player_name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedGroup !== 'ALL' && s.group_name !== selectedGroup) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Banner (Glassmorphic) */}
      <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
            <span>Tournament Roster ({players.length} Players)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Registered competitors, individual form records, and performance ratings
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-3 py-2.5 sm:py-2 min-h-[42px] bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-md"
            />
            <Search className="absolute left-3 top-3 sm:top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2.5 sm:py-2 min-h-[42px] bg-slate-900/80 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-md"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Groups</option>
              <option value="Group A" className="bg-slate-900 text-white">Group A</option>
              <option value="Group B" className="bg-slate-900 text-white">Group B</option>
            </select>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className="px-4 py-2.5 sm:py-2 min-h-[42px] rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-blue-glow transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Manage / Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Players Grid or Empty State (Glassmorphic) */}
      {filteredStats.length === 0 ? (
        <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-2xl">
          <Users className="w-12 h-12 text-cyan-400/70 mx-auto" />
          <h3 className="font-display text-lg sm:text-xl font-black text-white">
            {players.length === 0 ? 'No Players Registered Yet' : 'No Matching Players Found'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-medium">
            {players.length === 0
              ? 'Get started by adding tournament competitors and generating the fixture schedule in Admin Setup.'
              : 'Try clearing your search query or selecting a different group filter.'}
          </p>
          {players.length === 0 && isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className="px-6 py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-blue-glow transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Players in Setup</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredStats.map((player) => (
            <div
              key={player.player_id}
              onClick={() => onSelectPlayer(player)}
              className="bg-slate-950/45 backdrop-blur-xl border border-white/20 hover:border-cyan-400/60 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(6,182,212,0.25)] cursor-pointer group flex flex-col justify-between shadow-xl text-white"
            >
              {/* Top row: Rank badge & Group */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  player.rank === 1
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : player.is_qualified
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-white/10 text-slate-300 border border-white/10'
                }`}>
                  Rank #{player.rank}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {player.group_name || 'Competitor'}
                </span>
              </div>

              {/* Avatar & Name */}
              <div className="flex flex-col items-center text-center my-2">
                <PlayerAvatar
                  name={player.player_name}
                  photo={player.player_photo}
                  size="xl"
                  glow={player.rank === 1}
                  className="group-hover:scale-110 transition-transform"
                />
                <h3 className="font-bold text-base text-white mt-3 group-hover:text-cyan-300 transition-colors truncate max-w-full">
                  {player.player_name}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Rating {player.best_player_rating}
                  </span>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-1 py-3 my-2 border-y border-white/10 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Goals</span>
                  <span className="font-display font-black text-amber-400 text-sm">{player.total_goals}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Wins</span>
                  <span className="font-display font-black text-emerald-400 text-sm">{player.wins}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Points</span>
                  <span className="font-display font-black text-cyan-300 text-sm">{player.points}</span>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 text-[11px] font-mono">
                  {player.win_percentage}% Win Rate
                </span>
                <span className="text-cyan-400 font-bold text-xs group-hover:underline">
                  View Stats →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
