import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Users, Gamepad2, Trophy, BarChart2 } from 'lucide-react';

export const StatCardsRow: React.FC = () => {
  const { players, matches, dynamicStats, tournament } = useTournament();

  const totalMatches = matches.length || 28;
  const completedMatches = dynamicStats.completed_matches;
  const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 px-3 sm:px-8 mb-6 relative z-10">
      
      {/* Card 1: Total Players */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-start gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">Total Players</span>
          <span className="text-lg sm:text-2xl font-display font-black text-slate-900 block leading-tight truncate">
            {players.length}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 block truncate">Registered</span>
        </div>
      </div>

      {/* Card 2: Total Matches */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-start gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#1d6bf3] flex items-center justify-center shrink-0">
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">Total Matches</span>
          <span className="text-lg sm:text-2xl font-display font-black text-slate-900 block leading-tight truncate">
            {totalMatches}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block truncate">
            {tournament.group_format === 'SINGLE' ? '(League Stage)' : '(Group Stage)'}
          </span>
        </div>
      </div>

      {/* Card 3: Total Goals */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-start gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 8 14.5 10 13.5 13 10.5 13 9.5 10" fill="#059669" stroke="none" />
            <path d="M12 8V2M14.5 10L19.5 7M13.5 13L17.5 17.5M10.5 13L6.5 17.5M9.5 10L4.5 7" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">Total Goals</span>
          <span className="text-lg sm:text-2xl font-display font-black text-slate-900 block leading-tight truncate">
            {dynamicStats.total_goals}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 block truncate">
            {dynamicStats.average_goals_per_match} per match
          </span>
        </div>
      </div>

      {/* Card 4: Matches Completed */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-start gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
          <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">Completed</span>
          <span className="text-lg sm:text-2xl font-display font-black text-slate-900 block leading-tight truncate">
            {completedMatches} / {totalMatches}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
            <div className="flex-1 h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 shrink-0">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Card 5: Current Stage */}
      <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-start gap-2.5 sm:gap-3.5 hover:shadow-md transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">Current Stage</span>
          <span className="text-base sm:text-lg font-display font-black text-slate-900 block leading-tight truncate">
            {tournament.status === 'COMPLETED' ? 'Champion Crowned' : tournament.status === 'FINAL' ? 'Grand Final' : tournament.status === 'SEMI_FINALS' ? 'Semi Finals' : 'League Stage'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">
            Round 2 of 7
          </span>
        </div>
      </div>

    </div>
  );
};
