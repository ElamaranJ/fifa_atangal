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
  const { matches, players, tournament, setActiveTab, isAdmin } = useTournament();

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
        const p1Obj = players.find(p => p.id === m.player_1);
        const p2Obj = players.find(p => p.id === m.player_2);
        if (!p1Obj) {
          console.warn(`[FixtureList] Match #${m.match_number} references unknown player_1 ID: ${m.player_1}`);
        }
        if (!p2Obj) {
          console.warn(`[FixtureList] Match #${m.match_number} references unknown player_2 ID: ${m.player_2}`);
        }
        const p1 = p1Obj?.player_name.toLowerCase() || '';
        const p2 = p2Obj?.player_name.toLowerCase() || '';
        if (!p1.includes(query) && !p2.includes(query)) return false;
      }

      return true;
    });
  }, [matches, players, statusFilter, groupFilter, roundFilter, searchPlayer]);

  // Log warnings on initial load/render if any fixture references missing players
  React.useEffect(() => {
    matches.forEach(m => {
      if (m.stage === 'LEAGUE') {
        if (!players.some(p => p.id === m.player_1)) {
          console.warn(`[FixtureList] Match #${m.match_number} references missing player_1 ID: ${m.player_1}`);
        }
        if (!players.some(p => p.id === m.player_2)) {
          console.warn(`[FixtureList] Match #${m.match_number} references missing player_2 ID: ${m.player_2}`);
        }
      }
    });
  }, [matches, players]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-black text-white tracking-wide">
              Tournament Fixtures
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Showing {filteredMatches.length} of {matches.filter(m => m.stage === 'LEAGUE').length} League Matches
            </p>
          </div>

          {/* Status Segmented Buttons (Responsive full width on mobile) */}
          <div className="flex items-center p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all min-h-[38px] flex items-center justify-center ${
                statusFilter === 'ALL'
                  ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all min-h-[38px] flex items-center justify-center ${
                statusFilter === 'UPCOMING'
                  ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all min-h-[38px] flex items-center justify-center ${
                statusFilter === 'COMPLETED'
                  ? 'bg-[#1d6bf3] text-white font-bold shadow-blue-glow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-white/10">
          
          {/* Search Player */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[42px]"
            />
            <Search className="absolute left-3 top-3 sm:top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Group Filter */}
          {tournament.group_format === 'TWO_GROUPS' && (
            <div>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[42px]"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Groups</option>
                <option value="Group A" className="bg-slate-900 text-white">Group A</option>
                <option value="Group B" className="bg-slate-900 text-white">Group B</option>
                <option value="Cross Group" className="bg-slate-900 text-white">Cross Group Matches</option>
              </select>
            </div>
          )}

          {/* Round Filter */}
          <div>
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 min-h-[42px]"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Rounds</option>
              {rounds.map(r => (
                <option key={r} value={r} className="bg-slate-900 text-white">Round {r}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Fixture Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl text-white space-y-3">
          <Calendar className="w-12 h-12 text-cyan-400/70 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {matches.length === 0 ? 'No Fixtures Scheduled Yet' : 'No Matching Fixtures Found'}
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            {matches.length === 0
              ? `${players.length} players registered. Generate the schedule in the Admin Setup Wizard to activate match fixtures.`
              : 'Try clearing your player search or switching round/group filters.'}
          </p>
          {matches.length === 0 && isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className="mt-2 px-4 py-2 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white text-xs font-bold shadow-blue-glow transition-all"
            >
              Open Setup Wizard →
            </button>
          )}
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
