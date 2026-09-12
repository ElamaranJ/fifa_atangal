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
      
      {/* Top Header & Search Banner */}
      <div className="bg-pitch-card/80 border border-pitch-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
            <span>Tournament Roster ({players.length} Players)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
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
              className="w-full sm:w-48 pl-9 pr-3 py-2.5 sm:py-2 min-h-[42px] bg-pitch-darkest border border-pitch-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="absolute left-3 top-3 sm:top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2.5 sm:py-2 min-h-[42px] bg-pitch-darkest border border-pitch-border rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Groups</option>
              <option value="Group A">Group A</option>
              <option value="Group B">Group B</option>
            </select>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className="px-4 py-2.5 sm:py-2 min-h-[42px] rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Manage / Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Players Grid with Micro-animations */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredStats.map((player) => (
          <div
            key={player.player_id}
            onClick={() => onSelectPlayer(player)}
            className="bg-pitch-card/80 border border-pitch-border hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)] cursor-pointer group flex flex-col justify-between"
          >
            {/* Top row: Rank badge & Group */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                player.rank === 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : player.is_qualified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-pitch-panel text-slate-400'
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
            <div className="grid grid-cols-3 gap-1 py-3 my-2 border-y border-pitch-border/60 text-center text-xs">
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
              <span className="text-cyan-400 font-semibold text-xs group-hover:underline">
                View Stats →
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
