import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';

export const ProgressBar: React.FC = () => {
  const { tournament, matches, playoffs, setActiveTab } = useTournament();

  const stages = [
    { key: 'SETUP', label: 'Registration', tab: 'admin' },
    { key: 'FIXTURES', label: 'Fixtures', tab: 'fixtures' },
    { key: 'LEAGUE', label: 'League Stage', tab: 'standings' },
    { key: 'QUALIFICATION', label: 'Qualification', tab: 'standings' },
    { key: 'SEMI_FINALS', label: 'Semi Finals', tab: 'playoffs' },
    { key: 'FINAL', label: 'Grand Final', tab: 'playoffs' },
    { key: 'COMPLETED', label: 'Champion', tab: 'champion' },
  ];

  // Determine current stage index
  const getCurrentIndex = () => {
    if (tournament.status === 'COMPLETED' || playoffs.champion_player_id) return 6;
    if (tournament.status === 'FINAL' || (playoffs.final && playoffs.final.status === 'UPCOMING')) return 5;
    if (tournament.status === 'SEMI_FINALS' || playoffs.semi_final_1) return 4;
    if (tournament.status === 'QUALIFICATION') return 3;
    if (matches.length > 0 && tournament.status === 'LEAGUE') return 2;
    if (matches.length > 0) return 1;
    return 0;
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="w-full bg-pitch-card/80 backdrop-blur border border-pitch-border rounded-xl p-3 sm:p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between overflow-x-auto pb-1 no-scrollbar">
        {stages.map((stg, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <React.Fragment key={stg.key}>
              <button
                onClick={() => setActiveTab(stg.tab)}
                className={`flex items-center gap-2 group shrink-0 transition-all ${
                  isCurrent ? 'scale-105' : 'hover:opacity-100 opacity-80'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 font-extrabold animate-pulse'
                      : 'bg-pitch-panel text-slate-400 border border-pitch-border'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : idx === 6 ? (
                    <Trophy className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-slate-400'}`} />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                    isCurrent
                      ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                      : isDone
                      ? 'text-emerald-300'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {stg.label}
                </span>
              </button>

              {idx < stages.length - 1 && (
                <div
                  className={`h-0.5 min-w-[14px] sm:min-w-[28px] mx-1 sm:mx-2 rounded transition-all ${
                    idx < currentIndex
                      ? 'bg-emerald-500/60'
                      : idx === currentIndex
                      ? 'bg-gradient-to-r from-cyan-500 to-pitch-panel'
                      : 'bg-pitch-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
