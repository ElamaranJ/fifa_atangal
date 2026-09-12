import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match, Player } from '../../types/tournament';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { 
  Trophy, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Sparkles, 
  ChevronRight, 
  Award,
  Flame,
  AlertCircle
} from 'lucide-react';

interface PlayoffBracketProps {
  onEnterScore: (match: Match) => void;
  onSelectMatch: (match: Match) => void;
}

export const PlayoffBracket: React.FC<PlayoffBracketProps> = ({
  onEnterScore,
  onSelectMatch,
}) => {
  const { 
    playoffs, 
    players, 
    tournament, 
    isAdmin, 
    startPlayoffs, 
    setActiveTab, 
    matches 
  } = useTournament();

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getPlayer = (id?: string | null): Player | undefined => {
    if (!id) return undefined;
    return players.find(p => p.id === id);
  };

  const sf1 = playoffs.semi_final_1;
  const sf2 = playoffs.semi_final_2;
  const finalMatch = playoffs.final;
  const thirdPlaceMatch = playoffs.third_place;

  const champion = getPlayer(playoffs.champion_player_id);
  const runnerUp = getPlayer(playoffs.runner_up_player_id);
  const thirdPlace = getPlayer(playoffs.third_place_player_id);

  // Check if playoffs can be launched if not already
  const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
  const leagueCompleted = leagueMatches.length > 0 && leagueMatches.every(m => m.status === 'COMPLETED');
  const hasPlayoffsStarted = !!(sf1 || sf2);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.7));
  const handleFit = () => setZoomLevel(1);

  // Render a bracket match box
  const renderMatchNode = (
    title: string,
    match?: Match,
    isGrandFinal: boolean = false
  ) => {
    if (!match) {
      return (
        <div className="w-64 sm:w-72 bg-slate-950/45 backdrop-blur-xl border border-dashed border-white/20 rounded-2xl p-4 text-center shadow-xl text-white">
          <span className="text-[11px] font-mono text-cyan-300 uppercase font-bold block mb-1">
            {title}
          </span>
          <p className="text-xs text-slate-400 italic">Waiting for previous stage to complete...</p>
        </div>
      );
    }

    const p1 = getPlayer(match.player_1);
    const p2 = getPlayer(match.player_2);
    const isCompleted = match.status === 'COMPLETED';
    const s1 = match.player_1_score;
    const s2 = match.player_2_score;

    return (
      <div
        className={`w-64 sm:w-72 bg-slate-950/45 backdrop-blur-xl border rounded-2xl p-4 shadow-xl transition-all relative text-white ${
          isGrandFinal
            ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
            : match.status === 'COMPLETED'
            ? 'border-emerald-400/50'
            : 'border-white/20 hover:border-cyan-400/50'
        }`}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 pb-2 border-b border-white/10">
          <span className={isGrandFinal ? 'text-amber-300 font-extrabold flex items-center gap-1' : 'text-cyan-400'}>
            {isGrandFinal && <Trophy className="w-3.5 h-3.5" />}
            {title}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isCompleted ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40' : 'bg-white/10 text-slate-300 border border-white/10'}`}>
            {match.status}
          </span>
        </div>

        {/* Player 1 Row */}
        <div
          onClick={() => onSelectMatch(match)}
          className={`flex items-center justify-between p-2 rounded-xl mb-1.5 transition-colors cursor-pointer ${
            match.winner_id === match.player_1
              ? 'bg-emerald-500/20 border border-emerald-400/40'
              : 'hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerAvatar
              name={p1?.player_name || 'TBD'}
              photo={p1?.player_photo}
              size="sm"
              glow={match.winner_id === match.player_1}
            />
            <span className={`text-xs truncate ${match.winner_id === match.player_1 ? 'font-black text-cyan-300' : 'font-semibold text-white'}`}>
              {p1?.player_name || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isCompleted && (
              <span className="font-display font-black text-sm text-white px-2 py-0.5 bg-white/10 rounded border border-white/15">
                {s1}
              </span>
            )}
            {match.winner_id === match.player_1 && (
              <span className="text-[10px] text-cyan-300 font-bold ml-1">✓</span>
            )}
          </div>
        </div>

        {/* Player 2 Row */}
        <div
          onClick={() => onSelectMatch(match)}
          className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
            match.winner_id === match.player_2
              ? 'bg-emerald-500/20 border border-emerald-400/40'
              : 'hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerAvatar
              name={p2?.player_name || 'TBD'}
              photo={p2?.player_photo}
              size="sm"
              glow={match.winner_id === match.player_2}
            />
            <span className={`text-xs truncate ${match.winner_id === match.player_2 ? 'font-black text-cyan-300' : 'font-semibold text-white'}`}>
              {p2?.player_name || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isCompleted && (
              <span className="font-display font-black text-sm text-white px-2 py-0.5 bg-white/10 rounded border border-white/15">
                {s2}
              </span>
            )}
            {match.winner_id === match.player_2 && (
              <span className="text-[10px] text-cyan-300 font-bold ml-1">✓</span>
            )}
          </div>
        </div>

        {/* Penalties indicator if played */}
        {match.penalties_played && (
          <div className="mt-2 text-[10px] font-mono text-center text-amber-300 font-bold bg-amber-400/20 border border-amber-400/40 py-1 rounded-lg">
            Penalties: {p1?.player_name} ({match.player_1_penalty_score}) vs {p2?.player_name} ({match.player_2_penalty_score})
          </div>
        )}

        {/* Admin Action Button */}
        {isAdmin && (
          <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={() => onEnterScore(match)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                isGrandFinal
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                  : 'bg-[#1d6bf3] hover:bg-[#1557c0] text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isCompleted ? 'Edit Score' : 'Submit Score'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Zoom & Fit Bracket Controls (Requirement 11) */}
      <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Playoff Championship Bracket</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Top 4 Knockout Stage • Semi-Finals → Grand Final → Tournament Champion
          </p>
        </div>

        {/* Zoom & Fit controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-cyan-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              title="Fit Bracket"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors border-l border-white/15 ml-1"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Champion Celebration Button if decided */}
          {champion && (
            <button
              onClick={() => setActiveTab('champion')}
              className="px-4 py-2.5 min-h-[40px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-xs hover:brightness-110 shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 CELEBRATE CHAMPION</span>
            </button>
          )}
        </div>
      </div>

      {/* If playoffs have not started yet */}
      {!hasPlayoffsStarted && (
        <div className="p-8 sm:p-12 text-center bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl space-y-4 text-white">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce-gentle" />
          <h3 className="font-display text-2xl font-black text-white">Playoffs Bracket Unlocked Soon</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto font-medium">
            The playoff bracket will generate once all group/league matches are completed.
          </p>

          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => {
                  const res = startPlayoffs();
                  if (!res.success && res.error) {
                    alert(res.error);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-display font-black text-sm shadow-blue-glow transition-all hover:scale-105 active:scale-95"
              >
                INITIALIZE PLAYOFFS NOW (TOP 4)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Bracket Interactive Arena */}
      {hasPlayoffsStarted && (
        <div className="space-y-3">
          {/* Mobile Swipe Cue */}
          <div className="lg:hidden flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-xs font-mono text-cyan-300">
            <span>👉</span>
            <span>Swipe horizontally to navigate playoff stages</span>
            <span>👈</span>
          </div>

          <div className="bg-slate-950/45 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-10 shadow-2xl overflow-x-auto min-h-[500px] touch-pan-x [-webkit-overflow-scrolling:touch] text-white">
            <div
              className="transition-transform duration-200 origin-top-left flex flex-col lg:flex-row items-center justify-around gap-8 sm:gap-14 py-4 min-w-[740px]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
            {/* Column 1: Semi Finals */}
            <div className="flex flex-col justify-between gap-12 sm:gap-20">
              <div className="relative">
                {renderMatchNode('Semi Final 1', sf1)}
                {/* Visual connecting line */}
                <div className="hidden lg:block absolute -right-8 top-1/2 w-8 h-0.5 bg-white/20" />
              </div>

              <div className="relative">
                {renderMatchNode('Semi Final 2', sf2)}
                {/* Visual connecting line */}
                <div className="hidden lg:block absolute -right-8 top-1/2 w-8 h-0.5 bg-white/20" />
              </div>
            </div>

            {/* Middle Column: SVG Connector tree */}
            <div className="hidden lg:flex flex-col items-center justify-center text-slate-400">
              <div className="w-12 h-44 border-r-2 border-t-2 border-b-2 border-white/20 rounded-r-xl relative">
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-white/20" />
              </div>
            </div>

            {/* Column 2: Grand Final */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {renderMatchNode('Grand Championship Final', finalMatch, true)}
                {/* Connector line to trophy */}
                <div className="hidden lg:block absolute -right-8 top-1/2 w-8 h-0.5 bg-white/20" />
              </div>

              {/* Optional 3rd Place Match */}
              {thirdPlaceMatch && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  {renderMatchNode('3rd Place Playoff', thirdPlaceMatch)}
                </div>
              )}
            </div>

            {/* Column 3: Crowned Champion Spotlight */}
            <div className="flex flex-col items-center text-center">
              <div className="w-64 sm:w-72 bg-slate-900/80 backdrop-blur-xl border-2 border-amber-400/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                  <Trophy className="w-9 h-9" />
                </div>

                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-300 block mb-1">
                  TOURNAMENT CHAMPION
                </span>

                {champion ? (
                  <div className="space-y-3 mt-3">
                    <PlayerAvatar
                      name={champion.player_name}
                      photo={champion.player_photo}
                      size="xl"
                      glow
                      className="mx-auto ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    />
                    <h3 className="font-display text-xl font-black text-white">
                      {champion.player_name}
                    </h3>
                    <button
                      onClick={() => setActiveTab('champion')}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                    >
                      View Champion Hall
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-xs text-slate-400 italic font-medium">
                    Awaiting Grand Final completion
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

    </div>
  );
};
