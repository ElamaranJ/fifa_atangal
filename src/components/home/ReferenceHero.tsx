import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Play, BarChart2, Trophy } from 'lucide-react';

export const ReferenceHero: React.FC = () => {
  const { setActiveTab } = useTournament();

  return (
    <div className="relative pt-6 pb-12 sm:pb-16 px-4 sm:px-8 text-center select-none overflow-hidden">
      
      {/* Top Right Script Slogan: "Play Compete Be a Champion" */}
      <div className="hidden sm:block absolute right-8 top-2 text-right pointer-events-none">
        <span className="font-script text-2xl sm:text-3xl text-slate-800/80 font-bold leading-tight block transform -rotate-6">
          Play<br />Compete<br />Be a Champion
        </span>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col items-center">
        {/* Accent Tag */}
        <div className="flex flex-col items-center mb-1.5">
          <div className="w-8 sm:w-10 h-[2.5px] bg-[#10b981] rounded-full mb-1" />
          <span className="text-[10px] sm:text-[11px] font-bold text-[#10b981] uppercase tracking-[0.25em]">
            WELCOME TO
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#0f172a] uppercase leading-tight">
          eFOOTBALL
        </h1>
        <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#1d6bf3] uppercase leading-tight -mt-1 drop-shadow-sm">
          CHAMPIONSHIP 2026
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 font-medium text-xs sm:text-base mt-2 sm:mt-2.5 max-w-md px-2">
          Play. Compete. Create Your Legacy.
        </p>

        {/* 3 Call to Action Buttons (Touch friendly min 44px) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mt-5 sm:mt-6 w-full max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('fixtures')}
            className="flex-1 sm:flex-initial min-w-[130px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-xs sm:text-sm shadow-blue-glow transition-all hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-white text-white shrink-0" />
            <span>View Fixtures</span>
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className="flex-1 sm:flex-initial min-w-[130px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <BarChart2 className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Points Table</span>
          </button>

          <button
            onClick={() => setActiveTab('playoffs')}
            className="flex-1 sm:flex-initial min-w-[130px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <Trophy className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Playoffs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
