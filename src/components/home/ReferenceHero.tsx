import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Play, BarChart2, Trophy, Crown, Sparkles } from 'lucide-react';

export const ReferenceHero: React.FC = () => {
  const { tournament, players, matches, playoffs, setActiveTab, isAdmin } = useTournament();

  const champion = players.find(p => p.id === playoffs.champion_player_id);
  const runnerUp = players.find(p => p.id === playoffs.runner_up_player_id);
  const thirdPlace = players.find(p => p.id === playoffs.third_place_player_id);
  const finalMatch = playoffs.final;

  const tourName = tournament?.tournament_name || 'eFootball Championship 2026';
  const words = tourName.trim().split(' ');
  const primaryText = words.length > 1 ? words.slice(0, words.length - 1).join(' ') : words[0];
  const highlightText = words.length > 1 ? words[words.length - 1] : '';

  // Calculate final score if champion is crowned
  const champScore = finalMatch && champion
    ? (finalMatch.player_1 === champion.id ? finalMatch.player_1_score : finalMatch.player_2_score)
    : undefined;
  const oppScore = finalMatch && champion
    ? (finalMatch.player_1 === champion.id ? finalMatch.player_2_score : finalMatch.player_1_score)
    : undefined;

  // When a champion is crowned after the finals, display the Grand Champion Hero Showcase
  if (champion) {
    return (
      <div className="relative pt-6 pb-8 sm:pb-12 px-4 sm:px-8 text-center select-none overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[300px] bg-gradient-to-r from-amber-400/20 via-yellow-300/25 to-amber-500/20 blur-3xl rounded-full opacity-60" />
        </div>

        {/* Top Right Script Slogan */}
        <div className="hidden sm:block absolute right-8 top-2 text-right pointer-events-none">
          <span className="font-script text-2xl sm:text-3xl text-amber-600/70 font-bold leading-tight block transform -rotate-6">
            Victory<br />Glory<br />The Champion
          </span>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
          
          {/* Accent Gold Ribbon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/50 text-amber-800 text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm mb-3">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>🏆 TOURNAMENT CHAMPION CROWNED 🏆</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          {/* Champion Avatar with Glowing Golden Ring and Crown */}
          <div className="relative my-2.5">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full blur-md opacity-80 animate-pulse" />
            <div className="relative">
              <PlayerAvatar
                name={champion.player_name}
                photo={champion.player_photo}
                size="xl"
                glow
                className="ring-4 ring-amber-400 shadow-2xl"
              />
              <div className="absolute -top-3 -right-2 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-white">
                <Crown className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>

          {/* Champion Name & Title */}
          <h1 className="font-display font-black text-3xl xs:text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 uppercase mt-1">
            {champion.player_name}
          </h1>
          <p className="font-display font-black text-sm sm:text-base text-[#1d6bf3] tracking-wide uppercase mt-0.5">
            Undisputed Champion of {tourName}
          </p>

          {/* Final Match Victory Recap Pill */}
          {finalMatch && finalMatch.status === 'COMPLETED' && champScore !== undefined && oppScore !== undefined && (
            <div className="mt-3 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-300/80 shadow-sm text-xs sm:text-sm font-mono text-slate-700 flex items-center gap-2 flex-wrap justify-center">
              <span className="font-bold text-amber-600 uppercase text-[11px] tracking-wider">Final Victory:</span>
              <span className="font-black text-slate-900">{champion.player_name} ({champScore})</span>
              <span className="text-slate-400 font-bold">vs</span>
              <span className="font-semibold text-slate-600">({oppScore}) {runnerUp?.player_name || 'Runner-Up'}</span>
              {finalMatch.penalties_played && (
                <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-bold">
                  (Shootout {finalMatch.player_1_penalty_score}-{finalMatch.player_2_penalty_score})
                </span>
              )}
            </div>
          )}

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 w-full max-w-md mx-auto">
            {/* 1st Place */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/70 border-2 border-amber-400 rounded-2xl p-2.5 text-center shadow-sm">
              <span className="text-base sm:text-lg">🥇</span>
              <span className="text-[10px] font-black uppercase text-amber-800 block">1st Place</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block mt-0.5">
                {champion.player_name}
              </span>
            </div>

            {/* 2nd Place */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl p-2.5 text-center shadow-sm">
              <span className="text-base sm:text-lg">🥈</span>
              <span className="text-[10px] font-black uppercase text-slate-500 block">Runner-Up</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block mt-0.5">
                {runnerUp?.player_name || 'TBD'}
              </span>
            </div>

            {/* 3rd Place */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl p-2.5 text-center shadow-sm">
              <span className="text-base sm:text-lg">🥉</span>
              <span className="text-[10px] font-black uppercase text-amber-700/80 block">3rd Place</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block mt-0.5">
                {thirdPlace?.player_name || 'TBD'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mt-5 sm:mt-6 w-full max-w-lg mx-auto">
            <button
              onClick={() => setActiveTab('champion')}
              className="flex-1 sm:flex-initial min-w-[170px] flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-display font-black text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <Trophy className="w-4 h-4 text-slate-950 shrink-0" />
              <span>🏆 CELEBRATE CHAMPION</span>
            </button>

            <button
              onClick={() => setActiveTab('playoffs')}
              className="flex-1 sm:flex-initial min-w-[140px] flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <span>View Playoff Bracket</span>
            </button>

            <button
              onClick={() => setActiveTab('goldenboot')}
              className="flex-1 sm:flex-initial min-w-[120px] flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <span>Golden Boot</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-6 pb-10 sm:pb-14 px-4 sm:px-8 text-center select-none overflow-hidden">
      
      {/* Top Right Script Slogan */}
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

        {/* Dynamic Tournament Headline */}
        <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#0f172a] uppercase leading-tight">
          {primaryText}
        </h1>
        {highlightText && (
          <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#1d6bf3] uppercase leading-tight -mt-1 drop-shadow-sm">
            {highlightText}
          </h1>
        )}

        {/* Subtitle / Status */}
        {tournament.status === 'SETUP' ? (
          <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Setup & Registration Phase &bull; {players.length} Players Registered</span>
          </div>
        ) : (
          <p className="text-slate-600 font-medium text-xs sm:text-base mt-2 sm:mt-2.5 max-w-md px-2">
            Play. Compete. Create Your Legacy.
          </p>
        )}

        {/* 3 Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mt-5 sm:mt-6 w-full max-w-md mx-auto">
          {matches.length === 0 && isAdmin ? (
            <button
              onClick={() => setActiveTab('admin')}
              className="flex-1 sm:flex-initial min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-white text-white shrink-0" />
              <span>Generate Fixtures</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('fixtures')}
              className="flex-1 sm:flex-initial min-w-[130px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-xs sm:text-sm shadow-blue-glow transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-white text-white shrink-0" />
              <span>View Fixtures</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('standings')}
            className="flex-1 sm:flex-initial min-w-[130px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <BarChart2 className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Points Table</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className="flex-1 sm:flex-initial min-w-[130px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <Trophy className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Players ({players.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
