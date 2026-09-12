import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Trophy, Users, Shield, Calendar, TableProperties, Flame, ChevronRight, Play } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { tournament, players, matches, setActiveTab } = useTournament();

  const completedMatches = matches.filter(m => m.status === 'COMPLETED').length;
  const progressPercent = matches.length > 0 ? Math.round((completedMatches / matches.length) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-card via-pitch-dark to-pitch-darkest border border-pitch-border p-6 sm:p-10 mb-8 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left Tournament Overview */}
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>STAGE: {tournament.status.replace(/_/g, ' ')}</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-pitch-panel text-slate-300 border border-pitch-border">
              {tournament.group_format === 'SINGLE' ? '1 League Group' : '2 Groups (Group A & B)'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-pitch-panel text-slate-300 border border-pitch-border">
              {players.length} Competitors
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-wide uppercase mb-3">
            {tournament.tournament_name}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            The premier eFootball tournament stage. Track live fixtures, automatic goal tallies, live points tables with head-to-head tie breaking, Golden Boot race, and championship playoffs.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('fixtures')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm hover:brightness-110 shadow-glow-cyan flex items-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>View Fixtures</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className="px-5 py-2.5 rounded-xl bg-pitch-panel hover:bg-pitch-hover text-white border border-pitch-border font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <TableProperties className="w-4 h-4 text-emerald-400" />
              <span>Live Points Table</span>
            </button>
            <button
              onClick={() => setActiveTab('playoffs')}
              className="px-5 py-2.5 rounded-xl bg-pitch-panel hover:bg-pitch-hover text-white border border-pitch-border font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Playoffs Bracket</span>
            </button>
          </div>
        </div>

        {/* Right Tournament Completion Meter Card */}
        <div className="w-full lg:w-72 bg-pitch-darkest/80 border border-pitch-border rounded-2xl p-5 shrink-0 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Progress</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-pitch-panel rounded-full overflow-hidden mb-4 border border-pitch-border">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-pitch-panel/60 border border-pitch-border">
              <span className="text-slate-400 text-[10px] block">Matches</span>
              <span className="font-bold text-white text-sm">{completedMatches} / {matches.length}</span>
            </div>
            <div className="p-2 rounded-lg bg-pitch-panel/60 border border-pitch-border">
              <span className="text-slate-400 text-[10px] block">Format</span>
              <span className="font-bold text-amber-300 text-sm">
                {tournament.same_group_match_frequency}x Round
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
