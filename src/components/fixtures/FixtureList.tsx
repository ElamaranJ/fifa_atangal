import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { MatchCard } from './MatchCard';
import { Match } from '../../types/tournament';
import { Search, Filter, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface FixtureListProps {
  onSelectMatch: (match: Match) => void;
  onEnterScore: (match: Match) => void;
}

export const FixtureList: React.FC<FixtureListProps> = ({
  onSelectMatch,
  onEnterScore,
}) => {
  const { matches, players, tournament } = useTournament();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [roundFilter, setRoundFilter] = useState<string>('ALL');
  const [searchPlayer, setSearchPlayer] = useState<string>('');

  // Extract unique rounds
  const rounds = useMemo(() => {
    const set = new Set<number>();
    matches.forEach(m => set.add(m.round));
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Only show league matches in the regular fixture list (playoffs have their dedicated bracket)
      if (m.stage !== 'LEAGUE') return false;

      // Status filter
      if (statusFilter === 'UPCOMING' && m.status === 'COMPLETED') return false;
      if (statusFilter === 'COMPLETED' && m.status !== 'COMPLETED') return false;

      // Group filter
      if (groupFilter !== 'ALL') {
        if (groupFilter === 'CROSS_GROUP' && m.group !== 'Cross Group') return false;
        if (groupFilter !== 'CROSS_GROUP' && m.group !== groupFilter) return false;
      }

      // Round filter
      if (roundFilter !== 'ALL' && m.round !== parseInt(roundFilter)) return false;

      // Player search filter
      if (searchPlayer.trim()) {
        const query = searchPlayer.toLowerCase();
        const p1 = players.find(p => p.id === m.player_1)?.player_name.toLowerCase() || '';
        const p2 = players.find(p => p.id === m.player_2)?.player_name.toLowerCase() || '';
        if (!p1.includes(query) && !p2.includes(query)) return false;
      }

      return true;
    });
  }, [matches, players, statusFilter, groupFilter, roundFilter, searchPlayer]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-pitch-card/80 border border-pitch-border rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">
              Tournament Fixtures
            </h2>
            <p className="text-xs text-slate-400">
              Showing {filteredMatches.length} of {matches.filter(m => m.stage === 'LEAGUE').length} League Matches
            </p>
          </div>

          {/* Status Segmented Buttons (Responsive full width on mobile) */}
          <div className="flex items-center p-1 bg-pitch-darkest rounded-xl border border-pitch-border text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all min-h-[38px] flex items-center justify-center ${
                statusFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all min-h-[38px] flex items-center justify-center ${
                statusFilter === 'UPCOMING'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all min-h-[38px] flex items-center justify-center ${
                statusFilter === 'COMPLETED'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2 border-t border-pitch-border/60">
          
          {/* Search Player */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-pitch-darkest border border-pitch-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[42px]"
            />
            <Search className="absolute left-3 top-3 sm:top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Group Filter */}
          {tournament.group_format === 'TWO_GROUPS' && (
            <div>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 bg-pitch-darkest border border-pitch-border rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px]"
              >
                <option value="ALL">All Groups</option>
                <option value="Group A">Group A</option>
                <option value="Group B">Group B</option>
                <option value="Cross Group">Cross Group Matches</option>
              </select>
            </div>
          )}

          {/* Round Filter */}
          <div>
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 bg-pitch-darkest border border-pitch-border rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px]"
            >
              <option value="ALL">All Rounds</option>
              {rounds.map(r => (
                <option key={r} value={r}>Round {r}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Fixture Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center bg-pitch-card/40 border border-pitch-border rounded-3xl">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No matches found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the filters or generate new fixtures.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onSelect={onSelectMatch}
              onEnterScore={onEnterScore}
            />
          ))}
        </div>
      )}
    </div>
  );
};
